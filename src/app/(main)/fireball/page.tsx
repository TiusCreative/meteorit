import { adminDb } from '@/lib/firebaseAdmin';
import FireballListClient from '@/components/FireballListClient';

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

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

export default async function FireballPage() {
  let posts: BlogPost[] = [];

  // 1. Coba fetch dari R2
  try {
    const r2Res = await fetch(`${R2_URL}/data/blog/posts.json?t=${Date.now()}`, { cache: 'no-store' });
    if (r2Res.ok) {
      const data = await r2Res.json();
      posts = data.filter((p: BlogPost) => p.category === 'Bola Api & Fireball');
    }
  } catch (err) {
    console.warn("[Fireball List] Gagal fetch R2 cache, mencoba Firestore...", err);
  }

  // 2. Fallback ke Firestore
  if (posts.length === 0) {
    try {
      const snapshot = await adminDb
        .collection('articles')
        .where('category', '==', 'Bola Api & Fireball')
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

  return <FireballListClient initialPosts={posts} />;
}
