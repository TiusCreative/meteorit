import BlogListClient from '@/components/BlogListClient';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog Astronomi & Meteorit - Meteorit Indonesia',
  description: 'Temukan berita sains terbaru, panduan praktis mengidentifikasi batu meteorit asli, dan trivia astronomi menarik dari luar angkasa.',
  keywords: ['blog astronomi', 'edukasi meteorit', 'berita antariksa', 'panduan batu meteor', 'sains populer astronomi', 'meteor jatuh indonesia'],
};

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

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

  // 1. Coba fetch dari R2
  try {
    const r2Res = await fetch(`${R2_URL}/data/blog/posts.json?t=${Date.now()}`, { cache: 'no-store' });
    if (r2Res.ok) {
      const data = await r2Res.json();
      // Filter out Komet & Asteroid articles from the main blog list
      posts = data.filter((p: BlogPost) => p.category !== 'Komet & Asteroid');
    }
  } catch (err) {
    console.warn("Failed to fetch blog posts from R2 cache, falling back to Firestore:", err);
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

  return <BlogListClient initialPosts={posts} />;
}