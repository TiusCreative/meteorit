import { adminDb } from '@/lib/firebaseAdmin';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import ArticleContentClient from '@/components/ArticleContentClient';
import type { ArticleTranslations } from '@/lib/articleLocalization';
import JsonLd from '@/components/JsonLd';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/seoSchemas';

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
  const ogApiUrl = `https://www.meteorit.my.id/api/og?title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(post.excerpt)}&category=${encodeURIComponent(post.category || 'ASTRONOMI')}`;
  const shareImg = ogApiUrl;
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
          alt: post.title,
          type: 'image/png',
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
  // 1. Coba dari R2 individual article JSON via authenticated R2 S3 SDK
  try {
    const data = await fetchJsonFromR2<BlogPost>(`data/blog/articles/${id}.json`);
    if (data && data.id) return data;
  } catch (err) {
    console.warn(`[Blog Detail] Gagal fetch R2 artikel individual ${id}, mencoba catalog...`, err);
  }

  // 2. Fallback ke posts.json catalog via authenticated R2 S3 SDK
  try {
    const list = await fetchJsonFromR2<BlogPost[]>('data/blog/posts.json');
    if (Array.isArray(list)) {
      const matched = list.find(p => p.id === id);
      if (matched) return matched;
    }
  } catch (err) {
    console.warn(`[Blog Detail] Gagal fetch catalog R2, mencoba Firestore...`, err);
  }

  // 3. Fallback terakhir ke Firestore
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

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.id}` },
  ]);

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    url: `/blog/${post.id}`,
    image: post.image,
    datePublished: post.date,
    category: post.category,
  });

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, articleSchema]} />
      <ArticleContentClient post={post} backHref="/blog" />
    </>
  );
}
