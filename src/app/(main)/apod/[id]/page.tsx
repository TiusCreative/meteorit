import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import ApodActions from '@/components/ApodActions';
import SafeImage from '@/components/SafeImage';
import { adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { isSiteLanguage, LANGUAGE_COOKIE_KEY, defaultLanguage } from '@/lib/i18n';
import { landingText } from '@/lib/landingText';
import { fetchJsonFromR2, uploadToR2 } from '@/lib/r2Client';

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

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

// Fetch APOD Data
async function getApod(id: string): Promise<Apod | null> {
  // 1. Coba fetch dari R2 history.json via S3 SDK terlebih dahulu
  try {
    const history = await fetchJsonFromR2<Apod[]>('data/encyclopedia/history.json');
    if (Array.isArray(history)) {
      const matched = history.find(a => a.id === id);
      if (matched) return matched;
    }
  } catch (err) {
    console.warn("Failed to fetch APOD from R2 history cache, trying Firestore...", err);
  }

  // 2. Coba dari Firestore
  try {
    const docSnap = await adminDb.collection('apod_history').doc(id).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || { en: '', id: '' },
        explanation: data.explanation || { en: '', id: '' },
        image_url: data.image_url || '',
        copyright: data.copyright || 'NASA Public Domain'
      };
    }
  } catch (err) {
    console.warn("Failed to fetch APOD from Firestore database, falling back to NASA API:", err);
  }

  // 3. Fallback: Fetch langsung dari NASA API jika di-request tanggal yang belum di-cache
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${id}`);
    if (res.ok) {
      const apodData = await res.json();

      // Terjemahkan dengan AI
      const translatedTitle = await translateText(apodData.title, 'Terjemahkan judul astronomi berikut ke Bahasa Indonesia secara singkat dan menarik.');
      const translatedExplanation = await translateText(apodData.explanation, 'Terjemahkan deskripsi ilmiah astronomi berikut ke Bahasa Indonesia yang mudah dipahami.');

      // Deteksi jika NASA API mengembalikan placeholder logo
      const isNasaLogoPlaceholder = (url: string) =>
        url.includes('nasa-logo') || url.includes('/themes/nasa-child/assets/images/');

      let finalImageUrl = apodData.hdurl || apodData.url;

      // Jika placeholder, coba ambil gambar asli dari WordPress API
      if (apodData.media_type !== 'video' && isNasaLogoPlaceholder(finalImageUrl)) {
        try {
          const d = new Date(id + 'T00:00:00Z');
          const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
          const slugPrefix = `apod-${d.getUTCFullYear()}-${monthNames[d.getUTCMonth()]}-${d.getUTCDate()}`;
          const wpRes = await fetch(
            `https://science.nasa.gov/wp-json/wp/v2/image-article?search=${slugPrefix}&per_page=3&orderby=date&order=desc`,
            { cache: 'no-store' }
          );
          if (wpRes.ok) {
            const wpData = await wpRes.json();
            const matched = Array.isArray(wpData) && (wpData.find((item: any) => item.slug?.startsWith(slugPrefix)) || wpData[0]);
            if (matched) {
              const fi = matched.featured_image;
              if (fi?.file && fi.file.startsWith('http')) finalImageUrl = fi.file;
              else if (matched.featured_image_url && !isNasaLogoPlaceholder(matched.featured_image_url)) finalImageUrl = matched.featured_image_url;
            }
          }
        } catch (wpErr) {
          console.warn('[APOD Detail] WordPress image fallback failed:', wpErr);
        }
      }

      try {
        if (apodData.media_type !== 'video') {
          const imgFetch = await fetch(finalImageUrl);
          if (imgFetch.ok) {
            const buffer = Buffer.from(await imgFetch.arrayBuffer());
            const ext = finalImageUrl.split('.').pop()?.split('?')[0] || 'jpg';
            const imgKey = `data/encyclopedia/images/${id}.${ext}`;
            const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
            finalImageUrl = await uploadToR2(imgKey, buffer, contentType);
          }
        }
      } catch (imgErr) {
        console.error("Gagal mengunggah gambar APOD ke R2:", imgErr);
      }

      const finalApod: Apod = {
        id: apodData.date,
        title: {
          en: apodData.title,
          id: translatedTitle
        },
        explanation: {
          en: apodData.explanation,
          id: translatedExplanation
        },
        image_url: finalImageUrl,
        copyright: apodData.copyright || 'NASA Public Domain'
      };

      // Simpan/Arsipkan ke Firestore agar request selanjutnya instan
      try {
        await adminDb.collection('apod_history').doc(id).set(finalApod);
      } catch (saveErr) {
        console.warn("Failed to save auto-fetched APOD to Firestore:", saveErr);
      }

      return finalApod;
    }
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
  let title = (locale !== 'id' && (apod.title as any)[locale]) || '';
  let explanation = (locale !== 'id' && (apod.explanation as any)[locale]) || '';

  if (locale !== 'id' && (!title || !explanation)) {
    try {
      const targetLangLabel = 
        locale === 'en' ? 'English' : 
        locale === 'ms' ? 'Malay' : 
        locale === 'zh' ? 'Mandarin Chinese' : 
        locale === 'ja' ? 'Japanese' : 
        locale === 'ru' ? 'Russian' :
        locale === 'fr' ? 'French' :
        'English';
      
      const [translatedTitle, translatedExplanation] = await Promise.all([
        translateText(
          apod.title.en || apod.title.id,
          `Translate this astronomy title into ${targetLangLabel}. Return ONLY the translated title, no introduction, no quotes, no other text.`
        ),
        translateText(
          apod.explanation.en || apod.explanation.id,
          `Translate this astronomy explanation into ${targetLangLabel}. Keep paragraph structure intact. Return ONLY the translated description, no other text.`
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
