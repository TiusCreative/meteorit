import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import AdDisplay from '@/components/AdDisplay';
import { adminDb } from '@/lib/firebaseAdmin';
import { getAbsoluteUrl } from '@/lib/siteUrl';

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

interface MarsPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  createdAt?: string;
  mars_data?: {
    topic?: string;
    rover?: string;
    camera?: string;
    sol?: number;
  };
}

async function loadMarsArticles(): Promise<MarsPost[]> {
  const posts: MarsPost[] = [];

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
          image: data.image || '',
          createdAt: data.createdAt || '',
          mars_data: data.mars_data || {}
        });
      }
    });
  } catch (error) {
    console.error('[Mars Page] Gagal mengambil artikel Mars:', error);
  }

  return posts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export default async function MarsPage() {
  const posts = await loadMarsArticles();

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-800/40 text-xs font-semibold text-orange-300 uppercase tracking-wider">
            Planet Merah
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-300 via-red-500 to-amber-400 bg-clip-text text-transparent">
            Artikel Planet Mars
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Fakta unik, kabar rover NASA, cuaca ekstrem, geologi, dan masa depan manusia di Mars dalam bahasa yang ringan tapi tetap ilmiah.
          </p>
        </div>

        <AdDisplay position="hero" />

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-dashed border-red-950/60 rounded-2xl">
            <span className="text-5xl block mb-4">🔴</span>
            <p className="text-gray-300 font-bold text-lg mb-2">Belum ada artikel Planet Mars</p>
            <p className="text-gray-500 text-sm">Gunakan admin console untuk memicu cron Planet Mars pertama.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-slate-900/50 border border-red-950/40 rounded-2xl overflow-hidden shadow-xl hover:border-orange-500/40 transition-all flex flex-col">
                <div className="h-48 bg-slate-900 overflow-hidden">
                  <SafeImage
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    fallback="https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-xs text-orange-300 font-bold mb-2">
                    {post.mars_data?.rover || 'NASA Mars Rover'} • {post.date}
                  </div>
                  <h2 className="text-lg font-bold text-orange-100 line-clamp-2 mb-3">{post.title}</h2>
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed flex-1">{post.excerpt}</p>
                  <Link
                    href={`/mars/${post.id}`}
                    className="mt-5 block text-center bg-red-900/40 hover:bg-red-800/60 border border-red-700/30 text-orange-200 py-2.5 rounded-xl text-sm font-bold transition-all"
                  >
                    Baca Artikel Mars
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10">
          <AdDisplay position="footer" />
        </div>
      </div>
    </main>
  );
}
