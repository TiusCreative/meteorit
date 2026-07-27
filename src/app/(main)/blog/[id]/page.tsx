import { adminDb } from '@/lib/firebaseAdmin';
import ArticleContentClient from '@/components/ArticleContentClient';
import type { ArticleTranslations } from '@/lib/articleLocalization';

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
}

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

// Dynamic SEO Metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = await getBlogPost(params.id);
  if (!post) {
    return {
      title: 'Artikel Tidak Ditemukan - Meteorit Indonesia',
      description: 'Artikel sains astronomi tidak ditemukan di sistem kami.'
    };
  }
  const url = `https://www.meteorit.my.id/blog/${post.id}`;
  const shareImg = post.image || 'https://www.meteorit.my.id/logo.png';
  return {
    title: `${post.title} - Meteorit Indonesia`,
    description: post.excerpt,
    keywords: [post.title, post.category, 'astronomi indonesia', 'edukasi luar angkasa', 'artikel sains', 'bintang jatuh', 'kabar antariksa'],
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      siteName: 'Meteorit Indonesia',
      images: [
        {
          url: shareImg,
          width: 1200,
          height: 630,
          alt: post.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [shareImg]
    }
  };
}

async function getBlogPost(id: string): Promise<BlogPost | null> {
  // 1. Coba dari R2 individual article JSON (lebih efisien dari posts.json catalog)
  try {
    const res = await fetch(`${R2_URL}/data/blog/articles/${encodeURIComponent(id)}.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.id) return data as BlogPost;
    }
  } catch (err) {
    console.warn(`[Blog Detail] Gagal fetch R2 artikel individual ${id}, mencoba catalog...`, err);
  }

  // 2. Fallback ke posts.json catalog (artikel lama yang belum punya file individual)
  try {
    const res = await fetch(`${R2_URL}/data/blog/posts.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const list: BlogPost[] = await res.json();
      const matched = list.find(p => p.id === id);
      if (matched) return matched;
    }
  } catch (err) {
    console.warn(`[Blog Detail] Gagal fetch catalog R2, mencoba Firestore...`, err);
  }

  // 3. Fallback terakhir ke Firestore (backward compatibility artikel sangat lama)
  try {
    const docRef = adminDb.collection('articles').doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      return {
        id: snap.id,
        title: data.title || '',
        category: data.category || 'Trivia',
        date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
        content: data.content || '',
        image: data.image || data.imageUrl || '',
        translations: data.translations || {},
      };
    }
  } catch (err) {
    console.error("[Blog Detail] Error membaca artikel dari Firestore fallback:", err);
  }

  return null;
}

export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  const post = await getBlogPost(params.id);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">Artikel tidak ditemukan.</p>
          <a href="/blog" className="text-cyan-400 hover:underline mt-4 inline-block">← Kembali ke Blog</a>
        </div>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.image || 'https://www.meteorit.my.id/logo.png',
    author: {
      '@type': 'Organization',
      name: 'Meteorit Indonesia'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Meteorit Indonesia',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.meteorit.my.id/logo.png'
      }
    },
    mainEntityOfPage: `https://www.meteorit.my.id/blog/${post.id}`
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleContentClient post={post} backHref="/blog" />
    </>
  );
}

