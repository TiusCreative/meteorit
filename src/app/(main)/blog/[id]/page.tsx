import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import ArticleActions from '@/components/ArticleActions';
import SafeImage from '@/components/SafeImage';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content: string;
  image: string;
}

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

// Dynamic SEO Metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = await getBlogPost(params.id);
  if (!post) {
    return {
      title: 'Artikel Tidak Ditemukan - Meteorit Indonesia',
      description: 'Artikel sains astronomi tidak ditemukan di sistem kami.'
    };
  }
  return {
    title: `${post.title} - Meteorit Indonesia`,
    description: post.excerpt,
    keywords: [post.title, post.category, 'astronomi indonesia', 'edukasi luar angkasa', 'artikel sains', 'bintang jatuh', 'kabar antariksa'],
  };
}

async function getBlogPost(id: string): Promise<BlogPost | null> {
  // 1. Coba dari R2
  try {
    const res = await fetch(`${R2_URL}/data/blog/posts.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const list: BlogPost[] = await res.json();
      const matched = list.find(p => p.id === id);
      if (matched) return matched;
    }
  } catch (err) {
    console.warn("Failed to fetch article from R2 catalog, trying Firestore...", err);
  }

  // 2. Fallback ke Firestore
  try {
    const docRef = adminDb.collection('articles').doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      return {
        id: snap.id,
        title: data.title || '',
        category: data.category || 'Trivia',
        date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        excerpt: data.excerpt || data.content?.substring(0, 150) + '...',
        content: data.content || '',
        image: data.image || data.imageUrl || '',
      };
    }
  } catch (err) {
    console.error("Error reading post from Firestore fallback:", err);
  }

  return null;
}

export default async function BlogDetailPage({ params }: { params: { id: string } }) {
  const post = await getBlogPost(params.id);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">Artikel tidak ditemukan.</p>
          <Link href="/blog" className="text-cyan-400 hover:underline mt-4 inline-block">Kembali ke Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        
        {/* Navigation back link */}
        <Link 
          href="/blog" 
          className="text-cyan-400 hover:text-cyan-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden"
        >
          ← Kembali ke Daftar Artikel
        </Link>

        <article className="bg-slate-900/40 border border-cyan-950/30 rounded-3xl p-6 md:p-10 shadow-2xl print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          
          <div className="flex justify-between items-center mb-6 print:hidden">
            <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {post.category}
            </span>
            <span className="text-gray-500 text-sm">{post.date}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight text-cyan-400 print:text-black text-left">
            {post.title}
          </h1>

          {/* Dynamic Client Actions */}
          <ArticleActions post={post} />

          {/* Printable container */}
          <div id="printable-article-content" className="space-y-6 text-left">
            {/* Banner Image */}
            <div className="h-64 md:h-[450px] w-full rounded-2xl overflow-hidden mb-8 print:h-auto print:mb-4">
              <SafeImage 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover"
                fallback="https://placehold.co/800x500/020617/22d3ee?text=Astronomi"
              />
            </div>

            {/* Content body */}
            <div className="prose prose-invert max-w-none prose-headings:text-amber-400 prose-p:text-gray-300 prose-p:leading-relaxed text-left border-b border-cyan-900/30 pb-8 print:border-gray-300 print:text-black">
              {post.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('###')) {
                  return <h3 key={index} className="text-2xl font-bold mt-6 mb-3 text-amber-400 print:text-black">{paragraph.replace('###', '').trim()}</h3>;
                }
                if (paragraph.startsWith('##')) {
                  return <h2 key={index} className="text-3xl font-extrabold mt-8 mb-4 text-cyan-400 print:text-black">{paragraph.replace('##', '').trim()}</h2>;
                }
                if (paragraph.startsWith('#')) {
                  return <h1 key={index} className="text-4xl font-extrabold mt-8 mb-4 text-cyan-400 print:text-black">{paragraph.replace('#', '').trim()}</h1>;
                }
                return <p key={index} className="mb-4 text-gray-300 print:text-black leading-relaxed">{paragraph}</p>;
              })}
            </div>
          </div>

          <div className="print:hidden">
            <AdDisplay position="content" />
          </div>

        </article>
      </div>
    </main>
  );
}
