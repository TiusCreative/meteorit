export const runtime = 'edge';
import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import ApodActions from '@/components/ApodActions';
import SafeImage from '@/components/SafeImage';
import { adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { isSiteLanguage, LANGUAGE_COOKIE_KEY, defaultLanguage } from '@/lib/i18n';
import { landingText } from '@/lib/landingText';
import { fetchJsonFromR2, uploadToR2 } from '@/lib/r2Client';
import { queryD1 } from '@/lib/d1Client';
import { fetchRawApod, isNasaLogoPlaceholder } from '@/lib/nasaApodHelper';
import { ensureImageUrl } from '@/lib/imageSafeguard';

export const dynamic = 'force-dynamic';

interface Apod {
  id: string; // YYYY-MM-DD
  title: {
    en: string;
    id: string;
    ms?: string;
    zh?: string;
    ja?: string;
  };
  explanation: {
    en: string;
    id: string;
    ms?: string;
    zh?: string;
    ja?: string;
  };
  image_url: string;
  copyright: string;
}

const NASA_API_KEY = process.env.NASA_API_KEY || 'hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN';

import { translateText } from '@/lib/translator';

// Format Date localized
function formatLocalizedDate(dateStr: string, locale: string) {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
}

const R2_URL = process.env.R2_PUBLIC_URL || 'https://cdn.meteorit.my.id';

// Fetch APOD Data
async function getApod(id: string): Promise<Apod | null> {
  let cachedApod: Apod | null = null;

  // 1. Coba fetch dari R2 history.json via S3 SDK terlebih dahulu
  try {
    const history = await fetchJsonFromR2<Apod[]>('data/encyclopedia/history.json');
    if (Array.isArray(history)) {
      const matched = history.find(a => a.id === id);
      if (matched && !isNasaLogoPlaceholder(matched.image_url) && matched.title?.id && matched.title.id.toLowerCase() !== 'nasa science') {
        cachedApod = matched;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch APOD from R2 history cache, trying Firestore...", err);
  }

  // 2. Coba dari Cloudflare D1
  if (!cachedApod) {
    try {
      const d1Res = await queryD1('SELECT id, date, title, explanation, image_url, copyright FROM apod_history WHERE id = ? LIMIT 1', [id]);
      if (d1Res?.results?.length) {
        const data = d1Res.results[0];
        const rowApod: Apod = {
          id: data.id,
          title: typeof data.title === 'string' && data.title.startsWith('{') ? JSON.parse(data.title) : { en: data.title, id: data.title },
          explanation: typeof data.explanation === 'string' && data.explanation.startsWith('{') ? JSON.parse(data.explanation) : { en: data.explanation, id: data.explanation },
          image_url: data.image_url || '',
          copyright: data.copyright || 'NASA Public Domain'
        };
        if (!isNasaLogoPlaceholder(rowApod.image_url) && rowApod.title?.id && rowApod.title.id.toLowerCase() !== 'nasa science') {
          cachedApod = rowApod;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch APOD from D1 database, falling back to NASA API:", err);
    }
  }

  if (cachedApod) {
    return cachedApod;
  }

  // 3. Fallback: Ambil data APOD asli menggunakan nasaApodHelper (bebas logo NASA)
  try {
    const rawApod = await fetchRawApod(id);

    // Terjemahkan dengan AI
    const translatedTitle = await translateText(
      rawApod.title,
      'Terjemahkan judul astronomi NASA APOD berikut ke Bahasa Indonesia secara singkat, akurat, dan ilmiah. Kembalikan HANYA judul terjemahan saja.',
      'id'
    );
    const translatedExplanation = await translateText(
      rawApod.explanation,
      'Terjemahkan deskripsi ilmiah astronomi NASA APOD berikut ke Bahasa Indonesia yang akurat, mudah dipahami, dan lengkap. Jangan memotong penjelasan.',
      'id'
    );

    let finalImageUrl = rawApod.imageUrl;
    if (rawApod.mediaType !== 'video' && rawApod.imageUrl && !rawApod.imageUrl.includes('cdn.meteorit.my.id')) {
      try {
        const imgFetch = await fetch(rawApod.imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeteoritIndonesia/1.0)' },
          signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(15000) : undefined,
        });
        if (imgFetch.ok) {
          const buffer = Buffer.from(await imgFetch.arrayBuffer());
          const ext = rawApod.imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
          const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
          const imgKey = `data/encyclopedia/images/${id}.${safeExt}`;
          const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
          finalImageUrl = await uploadToR2(imgKey, buffer, contentType);
        }
      } catch (imgErr) {
        console.error("Gagal mengunggah gambar APOD ke R2:", imgErr);
      }
    }

    finalImageUrl = await ensureImageUrl(finalImageUrl, 'apod');

    const finalApod: Apod = {
      id: rawApod.date,
      title: {
        en: rawApod.title,
        id: translatedTitle || rawApod.title
      },
      explanation: {
        en: rawApod.explanation,
        id: translatedExplanation || rawApod.explanation
      },
      image_url: finalImageUrl,
      copyright: rawApod.copyright || 'NASA Public Domain'
    };

    // Simpan/Arsipkan ke Firestore & D1 agar request selanjutnya instan
    try {
      await adminDb.collection('apod_history').doc(id).set(finalApod);
    } catch (saveErr) {
      console.warn("Failed to save auto-fetched APOD to Firestore:", saveErr);
    }

    return finalApod;
  } catch (err) {
    console.error("NASA APOD Fallback API error:", err);
  }

  return null;
}


// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const apod = await getApod(params.id);
  if (!apod) {
    return {
      title: 'Foto Antariksa Tidak Ditemukan - Meteorit Indonesia',
      description: 'Detail foto antariksa NASA APOD tidak ditemukan.'
    };
  }
  return {
    title: `${apod.title.id || apod.title.en} - Foto Antariksa NASA ${formatLocalizedDate(apod.id, 'id')}`,
    description: apod.explanation.id?.substring(0, 150) || `Arsip Astronomy Picture of the Day tanggal ${formatLocalizedDate(apod.id, 'id')}.`,
    keywords: [apod.title.id || apod.title.en, 'nasa apod', 'astronomy picture of the day', 'foto antariksa', 'arsip foto luar angkasa', 'gambar astronomi harian'],
  };
}

import ApodContentClient from '@/components/ApodContentClient';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seoSchemas';

export default async function ApodDetailPage({ params }: { params: { id: string } }) {
  const apod = await getApod(params.id);
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const locale = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = landingText[locale];

  if (!apod) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">{t.apodError || 'Foto antariksa tidak ditemukan atau format tanggal salah.'}</p>
          <Link href="/apod" className="text-cyan-400 hover:underline mt-4 inline-block">
            {t.backToApod || 'Kembali ke Galeri APOD'}
          </Link>
        </div>
      </div>
    );
  }

  // Localize content title/explanation if present on the server-side first
  let title = (apod.title as any)?.[locale] || '';
  let explanation = (apod.explanation as any)?.[locale] || '';

  // Clean title if it contains conversational disclaimer
  if (title && title.length > 80 && (title.toLowerCase().includes('tidak dapat diterjemahkan') || title.toLowerCase().includes('konteks'))) {
    title = apod.title.en || 'V-G-R';
    if (apod.title) apod.title.id = title;
  }

  // Check if Indonesian translation is missing, generic placeholder, or untranslated English
  const isIndonesianNeedsTranslation = locale === 'id' && (
    !title ||
    title.toLowerCase() === 'nasa science' ||
    !explanation ||
    explanation === apod.explanation.en
  );

  const isOtherLocaleNeedsTranslation = locale !== 'id' && (!title || !explanation);

  if (isIndonesianNeedsTranslation || isOtherLocaleNeedsTranslation) {
    try {
      const targetLangLabel = 
        locale === 'id' ? 'Indonesian' :
        locale === 'en' ? 'English' : 
        locale === 'ms' ? 'Malay' : 
        locale === 'zh' ? 'Mandarin Chinese' : 
        locale === 'ja' ? 'Japanese' : 
        locale === 'ru' ? 'Russian' :
        locale === 'fr' ? 'French' :
        'Indonesian';
      
      const sourceTitle = (apod.title.en && apod.title.en.toLowerCase() !== 'nasa science') ? apod.title.en : apod.title.id;
      const sourceExplanation = apod.explanation.en || apod.explanation.id;

      const [translatedTitle, translatedExplanation] = await Promise.all([
        translateText(
          sourceTitle,
          `Translate this astronomy title into ${targetLangLabel}. Return ONLY the translated title, no introduction, no quotes, no other text.`,
          locale
        ),
        translateText(
          sourceExplanation,
          `Translate this astronomy scientific explanation into ${targetLangLabel}. Preserve scientific terms, mission names, and full paragraph structure. Return ONLY the translated description, no other text.`,
          locale
        )
      ]);

      if (translatedTitle && translatedExplanation) {
        title = translatedTitle;
        explanation = translatedExplanation;
        
        // Save back to Firestore cache
        const updateData: any = {};
        updateData[`title.${locale}`] = translatedTitle;
        updateData[`explanation.${locale}`] = translatedExplanation;
        await adminDb.collection('apod_history').doc(apod.id).update(updateData);
        
        // Update local object properties
        (apod.title as any)[locale] = translatedTitle;
        (apod.explanation as any)[locale] = translatedExplanation;
      }
    } catch (e) {
      console.error('Failed to translate APOD on the fly:', e);
    }
  }

  if (!title) title = apod.title.id || apod.title.en;
  if (!explanation) explanation = apod.explanation.id || apod.explanation.en;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'APOD', url: '/apod' },
    { name: title, url: `/apod/${apod.id}` },
  ]);

  const articleSchema = generateArticleSchema({
    title: `${title} - NASA APOD`,
    description: explanation,
    url: `/apod/${apod.id}`,
    image: apod.image_url,
    datePublished: apod.id,
    category: 'Astronomy Picture of the Day',
  });

  const imageObjectSchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: title,
    description: explanation,
    contentUrl: apod.image_url,
    creditText: apod.copyright || 'NASA Public Domain',
  };

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, articleSchema, imageObjectSchema]} />
      <ApodContentClient 
        initialApod={apod} 
        initialTitle={title} 
        initialExplanation={explanation} 
      />
    </>
  );
}
