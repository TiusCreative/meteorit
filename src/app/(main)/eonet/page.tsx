import { adminDb } from '@/lib/firebaseAdmin';
import EonetListClient from '@/components/EonetListClient';

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

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

export default async function EonetPage() {
  let posts: BlogPost[] = [];

  // 1. Coba fetch dari R2
  try {
    const r2Res = await fetch(`${R2_URL}/data/blog/posts.json?t=${Date.now()}`, { cache: 'no-store' });
    if (r2Res.ok) {
      const data = await r2Res.json();
      posts = data.filter((p: BlogPost) => p.category === 'Peristiwa Alam');
    }
  } catch (err) {
    console.warn("[EONET List] Gagal fetch R2 cache, mencoba Firestore...", err);
  }

  // 2. Fallback ke Firestore
  if (posts.length === 0) {
    try {
      const snapshot = await adminDb
        .collection('articles')
        .where('category', '==', 'Peristiwa Alam')
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

  return <EonetListClient initialPosts={posts} />;
}
