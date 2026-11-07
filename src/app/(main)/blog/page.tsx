import BlogListClient from '@/components/BlogListClient';
import { adminDb } from '@/lib/firebaseAdmin';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema } from '@/lib/seoSchemas';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog Astronomi & Meteorit - Meteorit Indonesia',
  description: 'Temukan berita sains terbaru, panduan praktis mengidentifikasi batu meteorit asli, dan trivia astronomi menarik dari luar angkasa.',
  keywords: ['blog astronomi', 'edukasi meteorit', 'berita antariksa', 'panduan batu meteor', 'sains populer astronomi', 'meteor jatuh indonesia'],
};

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  translations?: any;
}

export default async function BlogPage() {
  let posts: BlogPost[] = [];

  // 1. Fetch data/blog/posts.json via authenticated R2 S3 SDK
  try {
    const data = await fetchJsonFromR2<BlogPost[]>('data/blog/posts.json');
    if (Array.isArray(data) && data.length > 0) {
      posts = data.filter((p: BlogPost) => p.category !== 'Komet & Asteroid');
    }
  } catch (err) {
    console.warn("Failed to fetch blog posts from R2 S3, falling back to Firestore:", err);
  }

  // 2. Fallback ke Firestore jika R2 kosong/gagal
  if (posts.length === 0) {
    try {
      const snapshot = await adminDb.collection('articles').orderBy('createdAt', 'desc').get();
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.status === 'Published' && data.category !== 'Komet & Asteroid') {
          posts.push({
            id: doc.id,
            title: data.title || '',
            category: data.category || 'Trivia',
            date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
            image: data.image || data.imageUrl || '',
            translations: data.translations || {},
          });
        }
      });
    } catch (err) {
      console.error("Failed to fetch blog posts from Firestore fallback:", err);
    }
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Blog', url: '/blog' },
  ]);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Artikel & Blog Meteorit Indonesia',
    itemListElement: posts.slice(0, 10).map((post, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: post.title,
      url: `https://www.meteorit.my.id/blog/${post.id}`,
    })),
  };

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, itemListSchema]} />
      <BlogListClient initialPosts={posts} />
    </>
  );
}