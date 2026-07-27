"use client";

import { useEffect, useState } from 'react';
import { auth, googleProvider } from '@/lib/firebaseConfig';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  votes: number;
  votedUsers: string[];
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any;
  category: 'Diskusi' | 'Meteor atau Bukan' | 'Pertanyaan' | 'Temuan';
}

interface ForumComment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any;
}

export default function ForumPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activePost, setActivePost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Diskusi' | 'Meteor atau Bukan' | 'Pertanyaan' | 'Temuan'>('Diskusi');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newComment, setNewComment] = useState('');

  // Track user login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch forum posts from D1 API
  const fetchPosts = () => {
    fetch('/api/forum/posts')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success && data.posts) {
          const postsList = data.posts.map((p: any) => ({
            ...p,
            createdAt: { toDate: () => new Date(p.createdAt) }
          }));
          setPosts(postsList);
        } else {
          throw new Error("Gagal memuat postingan.");
        }
      })
      .catch((error) => {
        console.error("D1 API loading error, falling back to mock posts:", error);
        // Fallback mockup
        setPosts([
          {
            id: 'post-1',
            title: 'Apakah batu hitam ini meteorit? Ditemukan di Pantai Parangtritis',
            content: 'Saya menemukan batu hitam pekat ini ketika berjalan di pinggir pantai. Terasa cukup berat dibandingkan batu biasa dan sedikit menempel magnet kulkas. Mohon bantuannya para suhu!',
            imageUrl: 'https://placehold.co/600x400/1e293b/f59e0b?text=Batu+Hitam+Misterius',
            votes: 14,
            votedUsers: [],
            authorId: 'user-2',
            authorName: 'Budi Santoso',
            authorPhoto: 'https://placehold.co/100x100/10b981/fff?text=BS',
            createdAt: { toDate: () => new Date() },
            category: 'Meteor atau Bukan'
          },
          {
            id: 'post-2',
            title: 'Tips membersihkan kerak fusi (fusion crust) meteorit besi',
            content: 'Bagi rekan-rekan kolektor pemula, ini cara membersihkan noda karat ringan pada meteorit besi Campo del Cielo tanpa merusak pola garis Widmanstätten di dalamnya.',
            votes: 27,
            votedUsers: [],
            authorId: 'user-3',
            authorName: 'Rudi Komet',
            authorPhoto: 'https://placehold.co/100x100/6366f1/fff?text=RK',
            createdAt: { toDate: () => new Date(Date.now() - 86400000) },
            category: 'Diskusi'
          }
        ]);
      });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Load comments from D1 API
  const fetchComments = () => {
    if (!activePost) {
      setComments([]);
      return;
    }

    fetch(`/api/forum/comments?postId=${activePost.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success && data.comments) {
          const commentsList = data.comments.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt)
          }));
          setComments(commentsList);
        } else {
          throw new Error("Gagal memuat tanggapan.");
        }
      })
      .catch(() => {
        // Mock comment fallback
        setComments([
          {
            id: 'c-1',
            postId: activePost.id,
            content: 'Terlihat seperti slag sisa peleburan besi mas, dilihat dari rongga gelembung udaranya.',
            authorName: 'Dewi Bintang',
            authorPhoto: 'https://placehold.co/100x100/ec4899/fff?text=DB',
            createdAt: new Date()
          }
        ]);
      });
  };

  useEffect(() => {
    fetchComments();
  }, [activePost]);

  const handleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Silakan login terlebih dahulu');
    if (!newTitle || !newContent) return alert('Judul dan isi postingan tidak boleh kosong');

    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          imageUrl: newImageUrl || null,
          authorId: user.uid,
          authorName: user.displayName || 'Anonim',
          authorPhoto: user.photoURL || '',
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        setNewTitle('');
        setNewContent('');
        setNewImageUrl('');
        setIsCreatingPost(false);
        fetchPosts(); // Refresh posts feed
      } else {
        throw new Error(data.error || 'Gagal mengirim postingan.');
      }
    } catch (err: any) {
      console.error("Error creating post:", err);
      alert(`Gagal mengirim postingan: ${err.message || String(err)}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Silakan login terlebih dahulu');
    if (!newComment || !activePost) return;

    try {
      const res = await fetch('/api/forum/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: activePost.id,
          content: newComment,
          authorName: user.displayName || 'Anonim',
          authorPhoto: user.photoURL || '',
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        setNewComment('');
        fetchComments(); // Refresh comment list
      } else {
        throw new Error(data.error || 'Gagal mengirim tanggapan.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal mengirim tanggapan: ${err.message || String(err)}`);
    }
  };

  const handleVote = async (postId: string, currentVoted: string[], currentVotes: number) => {
    if (!user) return alert('Silakan login untuk memberikan voting.');
    
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId: user.uid,
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        // Optimistically update local posts state
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId 
              ? { ...p, votes: data.votes, votedUsers: data.votedUsers } 
              : p
          )
        );
        if (activePost && activePost.id === postId) {
          setActivePost(prev => prev ? { ...prev, votes: data.votes, votedUsers: data.votedUsers } : null);
        }
      } else {
        throw new Error(data.error || 'Gagal meregistrasikan voting.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal meregistrasikan voting: ${err.message || String(err)}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            Forum Komunitas Astronomi
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Diskusikan temuan batu unik Anda di alam (&quot;Meteor atau Bukan?&quot;), tanyakan teori astronomi, dan berjejaring dengan kolektor lainnya.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Posts list column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header filters and button */}
            <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-cyan-950/30 rounded-2xl">
              <span className="font-bold text-cyan-400 text-lg">Semua Diskusi ({posts.length})</span>
              {user ? (
                <button 
                  onClick={() => setIsCreatingPost(!isCreatingPost)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm transition-all"
                >
                  {isCreatingPost ? 'Batal Buat Post' : '📝 Tulis Postingan Baru'}
                </button>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-xl text-sm font-bold transition-all"
                >
                  Login Google untuk Tulis Post
                </button>
              )}
            </div>

            {/* Create Post Interface */}
            {isCreatingPost && user && (
              <form onSubmit={handleCreatePost} className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl text-left space-y-4">
                <h3 className="text-xl font-bold text-amber-400">Buat Postingan Baru</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-semibold">Judul Postingan</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Menemukan batu mengkilap ditarik magnet di kebun"
                    className="w-full px-4 py-2 bg-slate-950 border border-cyan-900/40 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1 font-semibold">Kategori</label>
                    <select 
                      value={newCategory}
                      onChange={(e: any) => setNewCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-cyan-900/40 rounded-xl text-white focus:outline-none"
                    >
                      <option value="Diskusi">Diskusi Umum</option>
                      <option value="Meteor atau Bukan">Meteor atau Bukan?</option>
                      <option value="Pertanyaan">Pertanyaan Teori</option>
                      <option value="Temuan">Laporan Temuan Baru</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1 font-semibold">Tautan URL Foto Batu (Opsional)</label>
                    <input 
                      type="url" 
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://imgur.com/foto-batu.jpg"
                      className="w-full px-4 py-2 bg-slate-950 border border-cyan-900/40 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1 font-semibold">Isi Postingan / Deskripsi</label>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={5}
                    placeholder="Jelaskan karakteristik batu temuan Anda: lokasi temuan, berat, apakah menempel magnet, dll."
                    className="w-full px-4 py-2 bg-slate-950 border border-cyan-900/40 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-all">
                  Kirim Postingan ke Forum
                </button>
              </form>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className={`bg-slate-900/40 border p-6 rounded-2xl transition-all duration-300 text-left ${
                    activePost?.id === post.id 
                      ? 'border-cyan-400 ring-2 ring-cyan-900/20' 
                      : 'border-cyan-950/30 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400 bg-slate-800">
                        <img src={post.authorPhoto || 'https://placehold.co/100x100/1e293b/fff?text=U'} alt={post.authorName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-200 block text-sm">{post.authorName}</span>
                        <span className="text-gray-500 text-xs">Diskusi Komunitas</span>
                      </div>
                    </div>
                    <span className="bg-cyan-900/50 text-cyan-300 border border-cyan-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {post.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer" onClick={() => setActivePost(post)}>
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <div className="h-48 w-full max-w-md rounded-xl overflow-hidden mb-4 bg-slate-950">
                      <img src={post.imageUrl} alt="Foto Temuan" className="w-full h-full object-cover" onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/600x400/020617/22d3ee?text=Foto+Temuan';
                      }} />
                    </div>
                  )}

                  {/* Actions (Vote & Comments trigger) */}
                  <div className="flex items-center gap-6 border-t border-cyan-950/50 pt-4 text-xs font-bold text-gray-400">
                    <button 
                      onClick={() => handleVote(post.id, post.votedUsers || [], post.votes || 0)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.votedUsers?.includes(user?.uid || '') 
                          ? 'text-amber-400' 
                          : 'hover:text-cyan-400'
                      }`}
                    >
                      <span>👍 Voting ({post.votes || 0})</span>
                    </button>
                    <button 
                      onClick={() => setActivePost(post)}
                      className="hover:text-cyan-400 transition-colors"
                    >
                      💬 Tampilkan Diskusi
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Discussion comments column */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/40 border border-cyan-950/30 p-6 rounded-2xl sticky top-24 max-h-[80vh] overflow-y-auto flex flex-col">
              {activePost ? (
                <div className="text-left flex flex-col h-full">
                  <div className="flex justify-between items-center border-b border-cyan-950/50 pb-4 mb-4">
                    <h3 className="font-extrabold text-cyan-400 text-lg">Utas Komentar</h3>
                    <button 
                      onClick={() => setActivePost(null)}
                      className="text-gray-500 hover:text-white font-bold text-sm"
                    >
                      Tutup
                    </button>
                  </div>

                  <p className="text-sm font-bold text-amber-400 mb-4">{activePost.title}</p>
                  
                  {/* Comments feed */}
                  <div className="space-y-4 overflow-y-auto flex-grow max-h-[40vh] mb-4 pr-1">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-xs text-center py-6">Belum ada tanggapan. Jadilah yang pertama menjawab!</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-slate-950/40 p-3 rounded-xl border border-cyan-950/40">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800">
                              <img src={comment.authorPhoto || 'https://placehold.co/100x100/1e293b/fff?text=U'} alt={comment.authorName} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-xs text-gray-300">{comment.authorName}</span>
                          </div>
                          <p className="text-gray-300 text-xs leading-relaxed">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment interface */}
                  {user ? (
                    <form onSubmit={handleAddComment} className="mt-auto space-y-3 pt-3 border-t border-cyan-950/50">
                      <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        placeholder="Tulis tanggapan / analisis ilmiah Anda..."
                        className="w-full px-3 py-2 bg-slate-950 border border-cyan-900/40 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                        required
                      />
                      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-xl text-xs transition-all">
                        Kirim Komentar
                      </button>
                    </form>
                  ) : (
                    <div className="mt-auto text-center border-t border-cyan-950/50 pt-4">
                      <button 
                        onClick={handleLogin}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
                      >
                        Login untuk Memberi Tanggapan
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <span className="text-4xl block mb-2">💬</span>
                  <p className="text-sm font-semibold">Pilih artikel diskusi</p>
                  <p className="text-xs text-gray-600 mt-1">Pilih salah satu postingan di sebelah kiri untuk melihat percakapan lengkap.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
