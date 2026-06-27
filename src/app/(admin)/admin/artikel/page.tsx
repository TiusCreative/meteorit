"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Article {
  id: string;
  title: string;
  category: string;
  status: string;
  date: string;
  views: number;
  excerpt: string;
  content: string;
  image: string;
  review_status?: string; // 'Otomatis' | 'Terverifikasi'
}

const PAGE_SIZE = 15;

export default function ArtikelManagement() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingKomet, setIsGeneratingKomet] = useState(false);
  const [isGeneratingMars, setIsGeneratingMars] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Trivia');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [marsPage, setMarsPage] = useState(1);
  const [kometPage, setKometPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  async function loadArticles() {
    setIsLoading(true);
    try {
      // 1. Coba ambil data ter-update dari database lokal (Firestore API)
      const dbRes = await fetch(`/api/articles?limit=200&t=${Date.now()}`, { cache: 'no-store' });
      if (dbRes.ok) {
        const data = await dbRes.json();
        setArticles(data.articles || []);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error("Gagal memuat artikel dari database, mencoba fallback ke R2:", err);
    }

    try {
      // 2. Fallback ke R2 cache jika database gagal diakses
      const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';
      const res = await fetch(`${r2PublicUrl}/data/blog/posts.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
        setIsLoading(false);
        return;
      }
    } catch { /* R2 kosong/CORS */ }

    setArticles([]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadArticles();
  }, []);

  const handleGenerateAIArticle = async () => {
    setIsGenerating(true);
    try {
      const secret = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const res = await fetch(`/api/cron/blog?secret=${secret}`);
      if (res.ok) {
        const data = await res.json();
        alert(`Sukses! Artikel AI baru diterbitkan: "${data.article?.title}"`);
        loadArticles(); // Refresh list
      } else {
        alert('Gagal membuat artikel dengan AI. Periksa kredensial Groq API.');
      }
    } catch (error) {
      console.error(error);
      alert('Error memicu regenerasi AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateKometArticle = async () => {
    setIsGeneratingKomet(true);
    try {
      const secret = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const res = await fetch(`/api/cron/komet?secret=${secret}`);
      if (res.ok) {
        const data = await res.json();
        if (data.created === false) {
          alert(data.message || 'Tidak ada artikel komet baru yang dibuat karena semua kandidat sudah pernah dirilis.');
        } else {
          alert(`Sukses! Ulasan batuan luar angkasa baru dirilis untuk: "${data.article?.title}" (Status: ${data.article?.review_status})`);
        }
        loadArticles(); // Refresh list
      } else {
        const errorData = await res.json();
        alert(`Gagal membuat artikel komet: ${errorData.details || errorData.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error memicu pembuatan artikel komet otomatis.');
    } finally {
      setIsGeneratingKomet(false);
    }
  };

  const handleGenerateMarsArticle = async () => {
    setIsGeneratingMars(true);
    try {
      const secret = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const res = await fetch(`/api/cron/mars?secret=${secret}`);
      if (res.ok) {
        const data = await res.json();
        if (data.created === false) {
          alert(data.message || 'Tidak ada artikel Planet Mars baru yang dibuat.');
        } else {
          alert(`Sukses! Artikel Planet Mars baru diterbitkan: "${data.article?.title}"`);
        }
        loadArticles();
      } else {
        const errorData = await res.json();
        alert(`Gagal membuat artikel Planet Mars: ${errorData.details || errorData.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error memicu pembuatan artikel Planet Mars otomatis.');
    } finally {
      setIsGeneratingMars(false);
    }
  };

  const handleVerifyArticle = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-uid': currentUser.uid
        },
        body: JSON.stringify({
          id,
          review_status: 'Terverifikasi'
        })
      });

      if (res.ok) {
        alert('Artikel berhasil diverifikasi.');
        loadArticles();
      } else {
        const data = await res.json();
        alert(`Gagal memverifikasi artikel: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saat memverifikasi artikel.');
    }
  };

  const handleEditClick = (article: Article) => {
    setSelectedArticle(article);
    setEditTitle(article.title || '');
    setEditCategory(article.category || 'Trivia');
    setEditExcerpt(article.excerpt || '');
    setEditContent(article.content || '');
    setEditImage(article.image || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle || !currentUser) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-uid': currentUser.uid
        },
        body: JSON.stringify({
          id: selectedArticle.id,
          title: editTitle,
          category: editCategory,
          excerpt: editExcerpt,
          content: editContent,
          image: editImage
        })
      });

      if (res.ok) {
        alert('Artikel berhasil diperbarui.');
        setShowEditModal(false);
        loadArticles();
      } else {
        const data = await res.json();
        alert(`Gagal menyimpan artikel: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saat memperbarui artikel.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!currentUser) return;
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini secara permanen dari database dan R2 cache?')) return;

    try {
      const res = await fetch(`/api/admin/articles?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-uid': currentUser.uid
        }
      });

      if (res.ok) {
        alert('Artikel berhasil dihapus.');
        loadArticles();
      } else {
        const data = await res.json();
        alert(`Gagal menghapus: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saat menghapus artikel.');
    }
  };

  const categories = ['Panduan', 'Peristiwa', 'Sejarah', 'Edukasi', 'Trivia', 'Komet & Asteroid', 'Planet Mars'];
  const kometArticles = articles.filter((article) => article.category === 'Komet & Asteroid');
  const marsArticles = articles.filter((article) => article.category === 'Planet Mars');
  const marsTotalPages = Math.max(1, Math.ceil(marsArticles.length / PAGE_SIZE));
  const kometTotalPages = Math.max(1, Math.ceil(kometArticles.length / PAGE_SIZE));
  const allTotalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const paginatedMarsArticles = marsArticles.slice((marsPage - 1) * PAGE_SIZE, marsPage * PAGE_SIZE);
  const paginatedKometArticles = kometArticles.slice((kometPage - 1) * PAGE_SIZE, kometPage * PAGE_SIZE);
  const paginatedArticles = articles.slice((allPage - 1) * PAGE_SIZE, allPage * PAGE_SIZE);

  useEffect(() => {
    setMarsPage((page) => Math.min(page, marsTotalPages));
    setKometPage((page) => Math.min(page, kometTotalPages));
    setAllPage((page) => Math.min(page, allTotalPages));
  }, [marsTotalPages, kometTotalPages, allTotalPages]);

  const PaginationControls = ({
    currentPage,
    totalPages,
    totalItems,
    onPageChange
  }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  }) => {
    if (totalItems <= PAGE_SIZE) return null;

    const startItem = (currentPage - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/70">
        <p className="text-xs font-semibold text-slate-500">
          Menampilkan {startItem}-{endItem} dari {totalItems} artikel
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Berikutnya
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Artikel</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola konten blog edukasi sains astronomi, meteorit, dan komet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleGenerateKometArticle}
            disabled={isGeneratingKomet}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all inline-flex items-center gap-2 shadow-sm text-sm"
          >
            {isGeneratingKomet ? '⏳ Memproses data luar angkasa...' : '☄️ Picu Artikel Komet (AI)'}
          </button>
          <button 
            onClick={handleGenerateMarsArticle}
            disabled={isGeneratingMars}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all inline-flex items-center gap-2 shadow-sm text-sm"
          >
            {isGeneratingMars ? '⏳ Menulis artikel Mars...' : '🔴 Picu Artikel Mars (AI)'}
          </button>
          <button 
            onClick={handleGenerateAIArticle}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all inline-flex items-center gap-2 shadow-sm text-sm"
          >
            {isGenerating ? '⏳ Memproses...' : '➕ Buat Artikel Baru (AI)'}
          </button>
        </div>
      </div>

      {/* Mars Articles Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
        <div className="p-6 border-b border-red-100 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-red-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Daftar Artikel Planet Mars ({marsArticles.length} artikel)</h2>
            <p className="text-xs text-slate-500 mt-1">Artikel yang tampil di halaman publik /mars.</p>
          </div>
          <button
            onClick={handleGenerateMarsArticle}
            disabled={isGeneratingMars}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-sm text-xs"
          >
            {isGeneratingMars ? 'Memproses...' : 'Picu Artikel Mars'}
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-slate-500 text-sm">Memuat artikel Planet Mars...</div>
        ) : marsArticles.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">Belum ada artikel Planet Mars. Jalankan AI Mars Writer untuk menerbitkan artikel pertama.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Review Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginatedMarsArticles.map((article) => {
                  const rStatus = article.review_status || 'Terverifikasi';
                  const isAuto = rStatus === 'Otomatis';

                  return (
                    <tr key={article.id} className="hover:bg-red-50/40">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">{article.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{article.excerpt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isAuto ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {rStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{article.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{article.views || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center items-center gap-2">
                          {isAuto && (
                            <button
                              onClick={() => handleVerifyArticle(article.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              Verifikasi
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(article)}
                            className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(article.id)}
                            className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PaginationControls
              currentPage={marsPage}
              totalPages={marsTotalPages}
              totalItems={marsArticles.length}
              onPageChange={setMarsPage}
            />
          </div>
        )}
      </div>

      {/* Komet Articles Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="p-6 border-b border-amber-100 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-amber-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Daftar Artikel Komet & Asteroid ({kometArticles.length} artikel)</h2>
            <p className="text-xs text-slate-500 mt-1">Artikel yang tampil di halaman publik /komet.</p>
          </div>
          <button
            onClick={handleGenerateKometArticle}
            disabled={isGeneratingKomet}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-sm text-xs"
          >
            {isGeneratingKomet ? 'Memproses...' : 'Picu Artikel Komet'}
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-slate-500 text-sm">Memuat artikel komet...</div>
        ) : kometArticles.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">Belum ada artikel komet. Jalankan AI Komet Writer untuk menerbitkan artikel pertama.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Review Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginatedKometArticles.map((article) => {
                  const rStatus = article.review_status || 'Terverifikasi';
                  const isAuto = rStatus === 'Otomatis';

                  return (
                    <tr key={article.id} className="hover:bg-amber-50/40">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">{article.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{article.excerpt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isAuto ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {rStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {article.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {article.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center items-center gap-2">
                          {isAuto && (
                            <button
                              onClick={() => handleVerifyArticle(article.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              Verifikasi
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(article)}
                            className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(article.id)}
                            className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PaginationControls
              currentPage={kometPage}
              totalPages={kometTotalPages}
              totalItems={kometArticles.length}
              onPageChange={setKometPage}
            />
          </div>
        )}
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Daftar Artikel di R2 Cache ({articles.length} artikel)</h2>
          <button 
            onClick={loadArticles}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            🔄 Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Memuat artikel...</div>
        ) : articles.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Belum ada artikel. Klik tombol di atas untuk memicu AI Content Writer pertama.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Review Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginatedArticles.map((article) => {
                  const rStatus = article.review_status || 'Terverifikasi';
                  const isAuto = rStatus === 'Otomatis';
                  
                  return (
                    <tr key={article.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900 line-clamp-1">{article.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{article.excerpt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isAuto ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {rStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {article.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {article.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center items-center gap-2">
                          {isAuto && (
                            <button 
                              onClick={() => handleVerifyArticle(article.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              Verifikasi
                            </button>
                          )}
                          <button 
                            onClick={() => handleEditClick(article)}
                            className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(article.id)}
                            className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PaginationControls
              currentPage={allPage}
              totalPages={allTotalPages}
              totalItems={articles.length}
              onPageChange={setAllPage}
            />
          </div>
        )}
      </div>

      {/* Manual Trigger Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Penulis Otomatis Groq AI</h2>
        <p className="text-slate-600 text-sm mb-4">
          Sistem ini secara terjadwal menulis artikel sains tentang astronomi umum atau analisis batuan luar angkasa yang melintas dekat Bumi dari NASA NeoWs. Gunakan pemicu di bawah untuk memerintahkan AI menulis konten secara instan saat ini juga.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleGenerateKometArticle}
            disabled={isGeneratingKomet}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors inline-flex items-center gap-2 text-sm shadow-sm"
          >
            {isGeneratingKomet ? '⏳ Memproses data luar angkasa...' : '☄️ Jalankan AI Komet Writer'}
          </button>
          <button 
            onClick={handleGenerateMarsArticle}
            disabled={isGeneratingMars}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 px-6 rounded-xl transition-colors inline-flex items-center gap-2 text-sm shadow-sm"
          >
            {isGeneratingMars ? '⏳ Menulis Mars...' : '🔴 Jalankan AI Mars Writer'}
          </button>
          <button 
            onClick={handleGenerateAIArticle}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors inline-flex items-center gap-2 text-sm shadow-sm"
          >
            {isGenerating ? '⏳ Menulis Artikel...' : '⚡ Jalankan AI Blog Writer'}
          </button>
        </div>
      </div>

      {/* EDIT MODAL DIALOG */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Edit Artikel</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-semibold focus:outline-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-grow text-sm">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Judul Artikel</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Kategori</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">URL Gambar (Opsional)</label>
                  <input 
                    type="text" 
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Ringkasan Pendek (Excerpt)</label>
                <textarea 
                  rows={2}
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Konten Utama (Markdown Format)</label>
                <textarea 
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-xs text-slate-800"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSaving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
