import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import ArticleActions from '@/components/ArticleActions';
import SafeImage from '@/components/SafeImage';
import { adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { isSiteLanguage, LANGUAGE_COOKIE_KEY, defaultLanguage } from '@/lib/i18n';
import { pickLocalizedArticle, type ArticleTranslations } from '@/lib/articleLocalization';
import { landingText } from '@/lib/landingText';
import { fetchAndCacheWeather } from '@/lib/openweather';

export const dynamic = 'force-dynamic';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content: string;
  image: string;
  translations?: ArticleTranslations;
  fireball_data?: {
    event_date?: string;
    lat?: string | null;
    lon?: string | null;
    lat_dir?: string | null;
    lon_dir?: string | null;
    energy_gj?: number;
    energy_kt?: number;
    impact_e?: number;
    alt?: string | null;
    vel?: string | null;
    source?: string;
  };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) {
    return { title: 'Artikel Tidak Ditemukan - Meteorit Indonesia', description: 'Artikel bola api tidak ditemukan.' };
  }
  return {
    title: `${post.title} - Meteorit Indonesia`,
    description: post.excerpt,
    keywords: [post.title, 'fireball', 'bola api', 'meteor', 'NASA JPL', 'atmosfer bumi', 'meteorit indonesia'],
  };
}

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

async function getPost(id: string): Promise<BlogPost | null> {
  // 1. Coba fetch dari Cloudflare R2
  try {
    const res = await fetch(`${R2_URL}/data/blog/articles/${encodeURIComponent(id)}.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.id) {
        return {
          id: data.id,
          title: data.title || '',
          category: data.category || 'Bola Api & Fireball',
          date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
          content: data.content || '',
          image: data.image || '',
          translations: data.translations || {},
          fireball_data: data.fireball_data || null,
        };
      }
    }
  } catch (err) {
    console.warn(`[Fireball Detail] Gagal fetch R2 artikel ${id}, mencoba Firestore...`, err);
  }

  // 2. Fallback ke Firestore
  try {
    const docRef = adminDb.collection('articles').doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data()!;
      return {
        id: snap.id,
        title: data.title || '',
        category: data.category || 'Bola Api & Fireball',
        date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
        content: data.content || '',
        image: data.image || '',
        translations: data.translations || {},
        fireball_data: data.fireball_data || null,
      };
    }
  } catch (err) {
    console.error('Error fetching fireball article:', err);
  }
  return null;
}

import FireballArticleClient from '@/components/FireballArticleClient';

export default async function FireballDetailPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const locale = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = landingText[locale];

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">{t.articleNotFound || 'Artikel tidak ditemukan.'}</p>
          <Link href="/fireball" className="text-orange-400 hover:underline mt-4 inline-block">{t.backToFireball || '← Kembali ke Daftar Fireball'}</Link>
        </div>
      </div>
    );
  }

  const fb = post.fireball_data;
  let weatherData = null;
  if (fb && fb.lat && fb.lon) {
    try {
      const latVal = parseFloat(fb.lat);
      const lonVal = parseFloat(fb.lon);
      const finalLat = fb.lat_dir === 'S' ? -latVal : latVal;
      const finalLon = fb.lon_dir === 'W' ? -lonVal : lonVal;
      if (!isNaN(finalLat) && !isNaN(finalLon)) {
        weatherData = await fetchAndCacheWeather(finalLat, finalLon);
      }
    } catch (err) {
      console.error('Failed to load coordinate weather for fireball detail page:', err);
    }
  }

  return (
    <FireballArticleClient post={post} weatherData={weatherData} />
  );
}
