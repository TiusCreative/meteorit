import KometListClient from '@/components/KometListClient';
import { adminDb } from '@/lib/firebaseAdmin';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema } from '@/lib/seoSchemas';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Artikel & Kabar Komet Asteroid - Meteorit Indonesia',
  description: 'Baca ulasan sains populer terlengkap, data perlintasan asteroid dekat Bumi, dan analisis astronomi komet dari Meteorit Indonesia.',
  keywords: ['artikel komet', 'kabar asteroid', 'perlintasan batuan antariksa', 'sains komet', 'meteoroid', 'NASA NeoWs'],
};

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  translations?: Record<string, any>;
}

export default async function KometPage() {
  let posts: BlogPost[] = [];

  // 1. Fetch data/blog/posts.json via authenticated R2 S3 SDK
  try {
    const data = await fetchJsonFromR2<BlogPost[]>('data/blog/posts.json');
    if (Array.isArray(data) && data.length > 0) {
      posts = data.filter((p: BlogPost) => p.category === 'Komet & Asteroid');
    }
  } catch (err) {
    console.warn("[Komet List] Gagal fetch R2 S3, mencoba Firestore...", err);
  }

  // 2. Fallback ke Firestore jika R2 kosong
  if (posts.length === 0) {
    try {
      const snapshot = await adminDb
        .collection('articles')
        .where('category', '==', 'Komet & Asteroid')
        .get();

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.status === 'Published') {
          posts.push({
            id: doc.id,
            title: data.title || '',
            category: data.category || 'Komet & Asteroid',
            date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
            image: data.image || data.imageUrl || '',
            createdAt: data.createdAt || '',
            translations: data.translations || {},
          } as any);
        }
      });

      posts.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (err) {
      console.error("Failed to fetch komet articles from Firestore:", err);
    }
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Komet & Asteroid', url: '/komet' },
  ]);

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Artikel Komet & Asteroid',
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
      <KometListClient initialPosts={posts} />
    </>
  );
}
