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
  eonet_data?: {
    event_id?: string;
    event_title?: string;
    categories?: string[];
    lat?: number | null;
    lon?: number | null;
    event_date?: string;
    status?: string;
    source?: string;
  };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  if (!post) {
    return { title: 'Artikel Tidak Ditemukan - Meteorit Indonesia', description: 'Artikel peristiwa alam tidak ditemukan.' };
  }
  return {
    title: `${post.title} - Meteorit Indonesia`,
    description: post.excerpt,
    keywords: [post.title, 'EONET', 'peristiwa alam', 'NASA', 'gunung berapi', 'kebakaran hutan', 'meteorit indonesia'],
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
          category: data.category || 'Peristiwa Alam',
          date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
          content: data.content || '',
          image: data.image || '',
          translations: data.translations || {},
          eonet_data: data.eonet_data || null,
        };
      }
    }
  } catch (err) {
    console.warn(`[EONET Detail] Gagal fetch R2 artikel ${id}, mencoba Firestore...`, err);
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
        category: data.category || 'Peristiwa Alam',
        date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
        content: data.content || '',
        image: data.image || '',
        translations: data.translations || {},
        eonet_data: data.eonet_data || null,
      };
    }
  } catch (err) {
    console.error('Error fetching EONET article:', err);
  }
  return null;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'wildfires': '🔥',
  'volcanoes': '🌋',
  'severe storms': '🌪️',
  'dust': '🌫️',
  'ice': '🧊',
  'snow': '❄️',
};

function getCategoryEmoji(cats: string[] = []): string {
  const combined = cats.join(' ').toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (combined.includes(key)) return emoji;
  }
  return '🌍';
}

import EonetArticleClient from '@/components/EonetArticleClient';

export default async function EonetDetailPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const locale = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = landingText[locale];

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">{t.articleNotFound || 'Artikel tidak ditemukan.'}</p>
          <Link href="/eonet" className="text-emerald-400 hover:underline mt-4 inline-block">{t.backToEonet || '← Kembali ke Daftar Peristiwa Alam'}</Link>
        </div>
      </div>
    );
  }

  const eo = post.eonet_data;
  const emoji = getCategoryEmoji(eo?.categories);

  let weatherData = null;
  if (eo && eo.lat !== null && eo.lat !== undefined && eo.lon !== null && eo.lon !== undefined) {
    try {
      weatherData = await fetchAndCacheWeather(eo.lat, eo.lon);
    } catch (err) {
      console.error('Failed to load coordinate weather for EONET detail page:', err);
    }
  }

  return (
    <EonetArticleClient post={post} weatherData={weatherData} emoji={emoji} />
  );
}
