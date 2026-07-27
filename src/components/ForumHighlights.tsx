"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  votes: number;
  authorName: string;
  authorPhoto: string;

  createdAt: string;
}

const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: "mock-forum-post-1",
    title: "Apakah ini Meteorit Kondrit? Menemukan batu hitam berat berkerak di Bekasi",
    content: "Halo kawan-kawan kolektor, kemarin saya tidak sengaja menemukan batu berwarna kehitaman dengan berat jenis yang tidak biasa di dekat persawahan Cikarang. Memiliki pori-pori halus dan sedikit menarik magnet. Mohon bantuannya untuk mengidentifikasi apakah ini meteorit chondrite asli atau slag besi...",
    category: "Meteor atau Bukan?",
    votes: 18,
    authorName: "Rian Hidayat",
    authorPhoto: "https://placehold.co/100x100/1e293b/fff?text=R",
    createdAt: new Date().toISOString()
  },
  {
    id: "mock-forum-post-2",
    title: "Info jadwal pengamatan Hujan Meteor Perseid Agustus 2026 di Indonesia",
    content: "Rekan-rekan pecinta langit malam, berikut adalah rincian jam puncak dan lokasi terbaik bebas polusi cahaya untuk berburu meteor Perseid di Indonesia. Direkomendasikan melakukan observasi mulai pukul 23.00 WIB hingga menjelang fajar...",
    category: "Info Astronomi",
    votes: 32,
    authorName: "Anisa Rahma",
    authorPhoto: "https://placehold.co/100x100/0284c7/fff?text=A",
    createdAt: new Date().toISOString()
  },
  {
    id: "mock-forum-post-3",
    title: "Review mikroskop stereo terbaik untuk meneliti struktur Widmanstätten meteorit",
    content: "Bagi kolektor yang ingin mengamati detail struktur Widmanstätten atau garis Neumann pada meteorit besi dengan asam nitrat, berikut beberapa rekomendasi mikroskop berkualitas dengan budget terjangkau...",
    category: "Koleksi & Edukasi",
    votes: 12,
    authorName: "Budi Santoso",
    authorPhoto: "https://placehold.co/100x100/15803d/fff?text=B",
    createdAt: new Date().toISOString()
  }
];

export default function ForumHighlights() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/forum/posts')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success && data.posts && data.posts.length > 0) {
          setPosts(data.posts.slice(0, 3));
        } else {
          setPosts(MOCK_FORUM_POSTS);
        }
      })
      .catch(err => {
        console.error('Gagal mengambil sorotan forum:', err);
        setPosts(MOCK_FORUM_POSTS);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-cyan-900/10 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Title */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-3 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
            💬 Diskusi Komunitas Aktif
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white">
            Forum Astronomi & Meteorit
          </h2>
          <p className="text-slate-600 dark:text-gray-400 mt-2 text-sm max-w-xl mx-auto">
            Ikuti percakapan seru kolektor dan pecinta bintang. Ajukan analisis &quot;Meteor atau Bukan?&quot; atau diskusikan teori astronomi terbaru.
          </p>
        </div>

        {/* Loading placeholder */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/50 space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-800/50 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between text-left"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/30 px-2.5 py-0.5 rounded-full uppercase">
                      {post.category}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">👍 {post.votes} voting</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-lg leading-snug line-clamp-2">
                    <Link href="/forum" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/55 pt-4 mt-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src={post.authorPhoto || 'https://placehold.co/100x100/1e293b/fff?text=U'} 
                      alt={post.authorName} 
                      className="w-6 h-6 rounded-full object-cover border border-amber-400"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{post.authorName}</span>
                  </div>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                    {new Date(post.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-10">
          <Link
            href="/forum"
            className="inline-flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all duration-300 shadow-sm"
          >
            Buka Forum Komunitas Utama →
          </Link>
        </div>

      </div>
    </section>
  );
}
