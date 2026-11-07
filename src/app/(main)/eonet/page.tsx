import { adminDb } from '@/lib/firebaseAdmin';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import EonetListClient from '@/components/EonetListClient';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema, generateDatasetSchema } from '@/lib/seoSchemas';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Peristiwa Alam Aktif NASA EONET - Meteorit Indonesia',
  description: 'Pantau peristiwa alam aktif di Bumi berdasarkan data NASA EONET v3 — gunung berapi, kebakaran hutan, badai, dan fenomena alam lainnya yang dipantau dari luar angkasa.',
  keywords: ['NASA EONET', 'peristiwa alam', 'gunung berapi aktif', 'kebakaran hutan', 'badai tropis', 'pemantauan bumi', 'meteorit indonesia'],
};

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  createdAt?: string;
  translations?: Record<string, any>;
}

export default async function EonetPage() {
  let posts: BlogPost[] = [];

  // 1. Fetch data/blog/posts.json via authenticated R2 S3 SDK
  try {
    const data = await fetchJsonFromR2<BlogPost[]>('data/blog/posts.json');
    if (Array.isArray(data) && data.length > 0) {
      posts = data.filter((p: BlogPost) => p.category === 'Peristiwa Alam' || p.category === 'EONET' || p.category === 'Bencana Alam');
    }
  } catch (err) {
    console.warn("[EONET List] Gagal fetch R2 S3, mencoba Firestore...", err);
  }

  // 2. Fallback ke Firestore jika R2 kosong
  if (posts.length === 0) {
    try {
      const snapshot = await adminDb
        .collection('articles')
        .where('category', 'in', ['Peristiwa Alam', 'EONET', 'Bencana Alam'])
        .get();

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.status === 'Published') {
          posts.push({
            id: doc.id,
            title: data.title || '',
            category: data.category || 'Peristiwa Alam',
            date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
            image: data.image || data.imageUrl || '',
            createdAt: data.createdAt || '',
            translations: data.translations || {},
          });
        }
      });

      posts.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (err) {
      console.error('Failed to fetch EONET articles from Firestore:', err);
    }
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'EONET & Peristiwa Alam', url: '/eonet' },
  ]);

  const datasetSchema = generateDatasetSchema({
    name: 'NASA EONET (Earth Observatory Natural Event Tracker)',
    description: 'Pemantauan satelit real-time terhadap fenomena dan bencana alam alam semesta.',
    url: '/eonet',
    keywords: ['eonet', 'nasa eonet', 'bencana alam', 'kebakaran hutan', 'gunung berapi'],
  });

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Laporan Peristiwa Alam Aktif NASA EONET',
    itemListElement: posts.slice(0, 10).map((post, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: post.title,
      url: `https://www.meteorit.my.id/eonet/${post.id}`,
    })),
  };

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, datasetSchema, itemListSchema]} />
      <EonetListClient initialPosts={posts} />
    </>
  );
}
