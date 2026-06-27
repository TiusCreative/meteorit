import Link from 'next/link';
import SafeImage from './SafeImage';

interface MarsPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  mars_data?: {
    rover?: string;
    camera?: string;
    sol?: number;
  };
}

export default function MarsLandingSection({ posts }: { posts: MarsPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="py-16 bg-slate-950 border-t border-red-900/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-orange-300 uppercase tracking-widest mb-3 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
              Planet Merah
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Artikel Mars Terbaru</h2>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">
              Kabar rover, geologi, cuaca ekstrem, dan masa depan manusia di Mars dari arsip artikel Meteorit Indonesia.
            </p>
          </div>
          <Link href="/mars" className="text-orange-300 hover:text-orange-200 font-bold text-sm">
            Lihat Semua Artikel Mars &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => (
            <article key={post.id} className="bg-slate-900/50 border border-red-950/40 rounded-2xl overflow-hidden shadow-xl hover:border-orange-500/40 transition-all flex flex-col">
              <div className="h-44 bg-slate-900 overflow-hidden">
                <SafeImage
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  fallback="https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg"
                />
              </div>
              <div className="p-5 flex flex-col flex-1 text-left">
                <div className="text-xs text-orange-300 font-bold mb-2">
                  {post.mars_data?.rover || 'NASA Mars Rover'} &bull; {post.date}
                </div>
                <h3 className="text-lg font-bold text-orange-100 line-clamp-2 mb-3">{post.title}</h3>
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
      </div>
    </section>
  );
}
