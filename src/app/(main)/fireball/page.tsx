import { adminDb } from '@/lib/firebaseAdmin';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import FireballListClient from '@/components/FireballListClient';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema, generateDatasetSchema } from '@/lib/seoSchemas';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Laporan Bola Api (Fireball) NASA JPL - Meteorit Indonesia',
  description: 'Baca analisis sains terbaru tentang peristiwa fireball (bola api meteor) yang terdeteksi memasuki atmosfer Bumi berdasarkan data NASA/JPL Fireball Data API.',
  keywords: ['fireball', 'bola api', 'meteor atmosfer', 'NASA JPL', 'ledakan meteor', 'CNEOS', 'meteorit indonesia'],
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

export default async function FireballPage() {
  let posts: BlogPost[] = [];

  // 1. Fetch data/blog/posts.json via authenticated R2 S3 SDK
  try {
    const data = await fetchJsonFromR2<BlogPost[]>('data/blog/posts.json');
    if (Array.isArray(data) && data.length > 0) {
      posts = data.filter((p: BlogPost) => p.category === 'Bola Api & Fireball' || p.category === 'Fireball' || p.category === 'Bola Api');
    }
  } catch (err) {
    console.warn("[Fireball List] Gagal fetch R2 S3, mencoba Firestore...", err);
  }

  // 2. Fallback ke Firestore jika R2 kosong
  if (posts.length === 0) {
    try {
      const snapshot = await adminDb
        .collection('articles')
        .where('category', 'in', ['Bola Api & Fireball', 'Fireball', 'Bola Api'])
        .get();

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.status === 'Published') {
          posts.push({
            id: doc.id,
            title: data.title || '',
            category: data.category || 'Bola Api & Fireball',
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
      console.error('Failed to fetch fireball articles from Firestore:', err);
    }
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Fireball & Bola Api', url: '/fireball' },
  ]);

  const datasetSchema = generateDatasetSchema({
    name: 'Data Peristiwa Bola Api (Fireball) NASA CNEOS',
    description: 'Catatan empiris dan analisis energi radiasi ledakan meteor bola api yang melintas di atmosfer.',
    url: '/fireball',
    keywords: ['fireball', 'bola api meteor', 'nasa cneos', 'deteksi meteor'],
  });

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Laporan Deteksi Fireball Terbaru',
    itemListElement: posts.slice(0, 10).map((post, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: post.title,
      url: `https://www.meteorit.my.id/fireball/${post.id}`,
    })),
  };

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, datasetSchema, itemListSchema]} />
      <FireballListClient initialPosts={posts} />
    </>
  );
}
