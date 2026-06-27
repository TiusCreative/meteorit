import KometListClient from '@/components/KometListClient';
import { adminDb } from '@/lib/firebaseAdmin';

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
}

export default async function KometPage() {
  const posts: BlogPost[] = [];

  try {
    // Ambil semua artikel dengan kategori 'Komet & Asteroid' dari Firestore
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
        } as any);
      }
    });

    // Urutkan in-memory dari terbaru
    posts.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.error("Failed to fetch komet articles from Firestore:", err);
  }

  return <KometListClient initialPosts={posts} />;
}
