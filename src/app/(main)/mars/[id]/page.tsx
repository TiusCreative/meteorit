import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import AdDisplay from '@/components/AdDisplay';
import MarsArticleActions from '@/components/MarsArticleActions';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAbsoluteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

interface MarsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
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

async function getMarsArticle(id: string): Promise<MarsArticle | null> {
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
    description: article.excerpt,
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

export default async function MarsArticlePage({ params }: { params: { id: string } }) {
  const article = await getMarsArticle(params.id);

  if (!article) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">Artikel Planet Mars tidak ditemukan.</p>
          <Link href="/mars" className="text-orange-300 hover:underline mt-4 inline-block">Kembali ke Artikel Mars</Link>
        </div>
      </main>
    );
  }

  const cleanHtml = sanitizeArticleHtml(article.content);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.image || DEFAULT_IMAGE,
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
    mainEntityOfPage: getAbsoluteUrl(`/mars/${article.id}`)
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16 print:bg-white print:text-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        <Link href="/mars" className="text-orange-300 hover:text-orange-200 font-bold mb-8 inline-flex items-center gap-2 print:hidden">
          ← Kembali ke Artikel Mars
        </Link>

        <article className="bg-slate-900/40 border border-red-950/40 rounded-3xl p-6 md:p-10 shadow-2xl print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          <div id="printable-mars-content">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
              <span className="bg-red-900 text-orange-100 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Planet Mars
              </span>
              <span className="text-gray-500 text-sm">{article.date}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight text-orange-300 print:text-black text-left">
              {article.title}
            </h1>

            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8 print:text-black">
              {article.excerpt}
            </p>

            <div className="h-64 md:h-[440px] w-full rounded-2xl overflow-hidden mb-4 print:h-auto">
              <SafeImage
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
                fallback={DEFAULT_IMAGE}
              />
            </div>

            <div className="text-xs text-slate-500 mb-8 print:text-black">
              NASA Mars Rover API • {article.mars_data?.rover || 'Mars Rover'} • {article.mars_data?.camera || 'Camera'} • Sol {article.mars_data?.sol || '-'}
            </div>

            <MarsArticleActions article={article} />

            <div
              className="mars-prose max-w-none text-left border-b border-red-950/30 pb-8 print:border-gray-300"
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
          </div>

          <div className="print:hidden">
            <AdDisplay position="content" />
          </div>
        </article>
      </div>
    </main>
  );
}
