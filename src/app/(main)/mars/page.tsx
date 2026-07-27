import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAbsoluteUrl } from '@/lib/siteUrl';
import MarsListClient from '@/components/MarsListClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Artikel Planet Mars - Meteorit Indonesia',
  description: 'Kumpulan artikel edukasi sains tentang Planet Mars, rover NASA, geologi Mars, cuaca ekstrem, dan masa depan manusia di planet merah.',
  keywords: ['Planet Mars', 'artikel Mars', 'NASA Mars Rover', 'Curiosity', 'Perseverance', 'geologi Mars', 'kolonisasi Mars'],
  openGraph: {
    title: 'Artikel Planet Mars - Meteorit Indonesia',
    description: 'Baca artikel edukasi Planet Mars dengan gambar resmi dari NASA Mars Rover API.',
    type: 'website',
    url: getAbsoluteUrl('/mars'),
    images: [
      {
        url: 'https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg',
        width: 1200,
        height: 630,
        alt: 'Planet Mars dan foto rover NASA'
      }
    ]
  }
};

interface MarsArticle {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  createdAt?: string;
  translations?: any;
  mars_data?: {
    topic?: string;
    rover?: string;
    camera?: string;
    sol?: number;
  };
}

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

export default async function MarsPage() {
  let posts: MarsArticle[] = [];

  // 1. Coba fetch dari R2
  try {
    const r2Res = await fetch(`${R2_URL}/data/blog/posts.json?t=${Date.now()}`, { cache: 'no-store' });
    if (r2Res.ok) {
      const data = await r2Res.json();
      posts = data.filter((p: any) => p.category === 'Planet Mars');
    }
  } catch (err) {
    console.warn("[Mars List] Gagal fetch R2 cache, mencoba Firestore...", err);
  }

  // 2. Fallback ke Firestore
  if (posts.length === 0) {
    try {
      const snapshot = await adminDb
        .collection('articles')
        .where('category', '==', 'Planet Mars')
        .get();

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.status === 'Published') {
          posts.push({
            id: doc.id,
            title: data.title || '',
            excerpt: data.excerpt || '',
            date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID'),
            image: data.image || '/logo-mars.png',
            createdAt: data.createdAt || '',
            translations: data.translations || {},
            mars_data: data.mars_data || {}
          });
        }
      });

      posts.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (err) {
      console.error('Failed to fetch Mars articles from Firestore:', err);
    }
  }

  return <MarsListClient initialPosts={posts} />;
}
