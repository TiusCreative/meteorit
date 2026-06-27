"use client";

import { useState } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
}

interface BlogSectionProps {
  initialPosts: BlogPost[];
}

export default function BlogSection({ initialPosts }: BlogSectionProps) {
  const [posts] = useState<BlogPost[]>(initialPosts);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSubscribed(true);
        setEmail('');
      } else {
        alert(data.error || 'Gagal mendaftar. Silakan coba lagi.');
      }
    } catch (err) {
      console.error(err);
      setIsSubscribed(true); // Graceful UX even if offline
    }
  };

  return (
    <section className="py-16 bg-slate-950 border-t border-cyan-900/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Articles list */}
          <div className="lg:w-2/3 text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-cyan-400">Artikel Astronomi Terbaru</h2>
            <div className="space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="bg-slate-900/40 border border-cyan-950/30 p-6 rounded-2xl flex flex-col md:flex-row gap-6 hover:border-cyan-500/30 transition-all shadow-xl">
                  {post.image && (
                    <div className="h-32 md:w-44 w-full shrink-0 rounded-xl overflow-hidden bg-slate-950">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover" onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/400x300/020617/22d3ee?text=Space';
                      }} />
                    </div>
                  )}
                  <div className="flex-grow flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {post.category}
                      </span>
                      <span className="text-gray-500 text-xs">{post.date}</span>
                    </div>
                    <h3 className="text-xl font-bold text-cyan-400 mb-2">{post.title}</h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    <Link 
                      href={`/blog/${post.id}`}
                      className="text-cyan-400 hover:text-cyan-300 font-bold text-sm inline-flex items-center gap-1 self-start mt-auto"
                    >
                      Baca Selengkapnya →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="lg:w-1/3">
            <div className="bg-slate-900/40 border border-cyan-950/30 rounded-3xl p-8 text-left shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 text-amber-400">Langganan Berita</h3>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Masukkan alamat email Anda untuk menerima notifikasi gratis saat terjadi kejatuhan meteor baru serta artikel astronomi langsung di kotak masuk Anda.
              </p>
              
              {isSubscribed ? (
                <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-xl text-center text-sm font-semibold">
                  🎉 Terima kasih! Anda telah terdaftar dalam newsletter kami.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan alamat email Anda"
                    className="w-full px-4 py-3 bg-slate-950 border border-cyan-900/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                    required
                  />
                  <button 
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-cyan-950/50"
                  >
                    Berlangganan Sekarang
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}