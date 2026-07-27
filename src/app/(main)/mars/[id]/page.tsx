import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import AdDisplay from '@/components/AdDisplay';
import MarsArticleActions from '@/components/MarsArticleActions';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAbsoluteUrl } from '@/lib/siteUrl';

import { cookies } from 'next/headers';
import { isSiteLanguage, LANGUAGE_COOKIE_KEY, defaultLanguage } from '@/lib/i18n';
import { pickLocalizedArticle, type ArticleTranslations } from '@/lib/articleLocalization';
import { landingText } from '@/lib/landingText';

export const dynamic = 'force-dynamic';

interface MarsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
  translations?: ArticleTranslations;
  mars_data?: {
    topic?: string;
    rover?: string;
    camera?: string;
    sol?: number;
    earth_date?: string;
  };
}

const DEFAULT_IMAGE = 'https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg';

function sanitizeArticleHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

function stripHtml(str: string) {
  return str.replace(/<[^>]*>/g, '').trim();
}

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

async function getMarsArticle(id: string): Promise<MarsArticle | null> {
  // 1. Coba fetch dari Cloudflare R2
  try {
    const res = await fetch(`${R2_URL}/data/blog/articles/${encodeURIComponent(id)}.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.id) {
        return {
          id: data.id,
          title: data.title || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID'),
          image: data.image || DEFAULT_IMAGE,
          translations: data.translations || {},
          mars_data: data.mars_data || {}
        };
      }
    }
  } catch (err) {
    console.warn(`[Mars Detail] Gagal fetch R2 artikel ${id}, mencoba Firestore...`, err);
  }

  // 2. Fallback ke Firestore
  try {
    const snap = await adminDb.collection('articles').doc(id).get();
    if (!snap.exists) return null;

    const data = snap.data();
    if (data?.status !== 'Published' || data?.category !== 'Planet Mars') return null;

    return {
      id: snap.id,
      title: data.title || '',
      excerpt: data.excerpt || '',
      content: data.content || '',
      date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID'),
      image: data.image || DEFAULT_IMAGE,
      translations: data.translations || {},
      mars_data: data.mars_data || {}
    };
  } catch (error) {
    console.error('[Mars Detail] Gagal mengambil artikel Mars:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const article = await getMarsArticle(params.id);
  if (!article) {
    return {
      title: 'Artikel Mars Tidak Ditemukan - Meteorit Indonesia',
      description: 'Artikel Planet Mars tidak ditemukan.'
    };
  }

  const url = getAbsoluteUrl(`/mars/${article.id}`);
  return {
    title: `${article.title} - Meteorit Indonesia`,
    description: stripHtml(article.excerpt),
    keywords: [
      article.title,
      'Planet Mars',
      'NASA Mars Rover',
      article.mars_data?.rover || 'Mars Rover',
      'Meteorit Indonesia'
    ],
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url,
      type: 'article',
      siteName: 'Meteorit Indonesia',
      images: [
        {
          url: article.image || DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          alt: article.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.image || DEFAULT_IMAGE]
    }
  };
}

import MarsArticleClient from '@/components/MarsArticleClient';

export default async function MarsArticlePage({ params }: { params: { id: string } }) {
  const article = await getMarsArticle(params.id);
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const locale = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = landingText[locale];

  if (!article) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">{t.articleNotFound || 'Artikel Planet Mars tidak ditemukan.'}</p>
          <Link href="/mars" className="text-orange-300 hover:underline mt-4 inline-block">{t.backToMars || 'Kembali ke Artikel Mars'}</Link>
        </div>
      </main>
    );
  }

  const localizedArticle = pickLocalizedArticle(article as any, locale);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: localizedArticle.title,
    description: localizedArticle.excerpt,
    image: localizedArticle.image || DEFAULT_IMAGE,
    author: {
      '@type': 'Organization',
      name: 'Meteorit Indonesia'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Meteorit Indonesia',
      logo: {
        '@type': 'ImageObject',
        url: getAbsoluteUrl('/logo.png')
      }
    },
    mainEntityOfPage: getAbsoluteUrl(`/mars/${localizedArticle.id}`)
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarsArticleClient article={article} />
    </>
  );
}
