"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/lib/firebaseConfig';
import SafeImage from '@/components/SafeImage';

interface Apod {
  id: string; // YYYY-MM-DD
  title: {
    en: string;
    id: string;
    [key: string]: string | undefined;
  };
  explanation: {
    en: string;
    id: string;
    [key: string]: string | undefined;
  };
  image_url: string;
  copyright?: string;
  media_type?: string;
  processedAt?: string;
}

export default function AdminApodPage() {
  const [apods, setApods] = useState<Apod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingApod, setEditingApod] = useState<Apod | null>(null);
  const [deletingApodId, setDeletingApodId] = useState<string | null>(null);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [fetchDate, setFetchDate] = useState('');
  
  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [fetchingNasa, setFetchingNasa] = useState(false);

  // Form states for Editing Modal
  const [formTitleId, setFormTitleId] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formExpId, setFormExpId] = useState('');
  const [formExpEn, setFormExpEn] = useState('');
  const [formCopyright, setFormCopyright] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState('image');

  const fetchApods = async (query = '') => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      const headers: Record<string, string> = {};
      if (user?.uid) {
        headers['x-admin-uid'] = user.uid;
      }

      const res = await fetch(`/api/admin/apod?q=${encodeURIComponent(query)}&limit=60&t=${Date.now()}`, {
        headers
      });
      const data = await res.json();

      if (res.ok && data.apods) {
        setApods(data.apods);
      } else {
        showStatus('error', data.error || 'Gagal memuat daftar APOD.');
      }
    } catch (err) {
      console.error('Failed to fetch APOD list:', err);
      showStatus('error', 'Terjadi kesalahan koneksi saat mengambil data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApods(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatusMsg({ type, message });
    setTimeout(() => {
      setStatusMsg(null);
    }, 5000);
  };

  const handleEditClick = (apod: Apod) => {
    setEditingApod(apod);
    setFormTitleId(apod.title?.id || '');
    setFormTitleEn(apod.title?.en || '');
    setFormExpId(apod.explanation?.id || '');
    setFormExpEn(apod.explanation?.en || '');
    setFormCopyright(apod.copyright || 'NASA Public Domain');
    setFormImageUrl(apod.image_url || '');
    setFormMediaType(apod.media_type || 'image');
  };

  const handleSaveEdit = async () => {
    if (!editingApod) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user?.uid) {
        headers['x-admin-uid'] = user.uid;
      }

      const payload = {
        id: editingApod.id,
        title: {
          ...editingApod.title,
          id: formTitleId,
          en: formTitleEn,
        },
        explanation: {
          ...editingApod.explanation,
          id: formExpId,
          en: formExpEn,
        },
        copyright: formCopyright,
        image_url: formImageUrl,
        media_type: formMediaType,
      };

      const res = await fetch('/api/admin/apod', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showStatus('success', data.message || 'APOD berhasil diperbarui.');
        setEditingApod(null);
        fetchApods(searchQuery);
      } else {
        showStatus('error', data.error || 'Gagal menyimpan perubahan APOD.');
      }
    } catch (err) {
      console.error('Error saving APOD:', err);
      showStatus('error', 'Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApod = async () => {
    if (!deletingApodId) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      const headers: Record<string, string> = {};
      if (user?.uid) {
        headers['x-admin-uid'] = user.uid;
      }

      const res = await fetch(`/api/admin/apod?id=${encodeURIComponent(deletingApodId)}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showStatus('success', data.message || 'Artikel APOD berhasil dihapus.');
        setDeletingApodId(null);
        fetchApods(searchQuery);
      } else {
        showStatus('error', data.error || 'Gagal menghapus APOD.');
      }
    } catch (err) {
      console.error('Error deleting APOD:', err);
      showStatus('error', 'Terjadi kesalahan sistem saat menghapus.');
    } finally {
      setSaving(false);
    }
  };

  const handleAiTranslate = async () => {
    if (!formTitleEn && !formExpEn) {
      showStatus('error', 'Isi judul dan deskripsi Bahasa Inggris terlebih dahulu untuk diterjemahkan AI.');
      return;
    }
    setTranslating(true);
    try {
      const user = auth.currentUser;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user?.uid) {
        headers['x-admin-uid'] = user.uid;
      }

      const res = await fetch('/api/admin/apod', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'retranslate',
          text: {
            title: formTitleEn,
            explanation: formExpEn
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.translated) {
        if (data.translated.title) setFormTitleId(data.translated.title);
        if (data.translated.explanation) setFormExpId(data.translated.explanation);
        showStatus('success', 'Terjemahan AI Bahasa Indonesia berhasil dibuat!');
      } else {
        showStatus('error', data.error || 'Gagal menerjemahkan teks dengan AI.');
      }
    } catch (err) {
      console.error('AI Translation error:', err);
      showStatus('error', 'Gagal memanggil layanan terjemahan AI.');
    } finally {
      setTranslating(false);
    }
  };

  const handleFetchNasaDate = async () => {
    if (!fetchDate) {
      showStatus('error', 'Pilih atau ketik tanggal YYYY-MM-DD terlebih dahulu.');
      return;
    }
    setFetchingNasa(true);
    try {
      const user = auth.currentUser;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user?.uid) {
        headers['x-admin-uid'] = user.uid;
      }

      const res = await fetch('/api/admin/apod', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'fetch_nasa',
          date: fetchDate
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showStatus('success', data.message || `APOD tanggal ${fetchDate} berhasil diambil.`);
        setIsFetchModalOpen(false);
        setFetchDate('');
        fetchApods(searchQuery);
      } else {
        showStatus('error', data.error || 'Gagal mengambil APOD dari NASA API.');
      }
    } catch (err) {
      console.error('Fetch NASA APOD error:', err);
      showStatus('error', 'Terjadi kesalahan saat mengambil APOD NASA.');
    } finally {
      setFetchingNasa(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌌</span>
            <h1 className="text-2xl font-bold text-amber-400">Manajemen APOD (Foto Harian)</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Kelola, edit deskripsi terjemahan, atau hapus entri NASA Astronomy Picture of the Day.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFetchModalOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/20"
          >
            <span>🚀</span> Fetch Tanggal NASA
          </button>
        </div>
      </div>

      {/* Alert status notification */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{statusMsg.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{statusMsg.message}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Stats & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total APOD Dimuat</p>
          <p className="text-2xl font-bold text-white mt-1">{apods.length} artikel</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl md:col-span-2 flex items-center">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Cari berdasarkan tanggal (YYYY-MM-DD) atau kata kunci judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-base">🔍</span>
          </div>
        </div>
      </div>

      {/* APOD List Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Memuat arsip APOD...</p>
          </div>
        ) : apods.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <span className="text-4xl block mb-2">🔭</span>
            <p className="text-lg font-bold text-gray-300">Tidak ada artikel APOD yang cocok.</p>
            <p className="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-slate-950 text-gray-400 text-xs uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Tanggal (ID)</th>
                  <th className="p-4">Gambar</th>
                  <th className="p-4">Judul (Indonesia / English)</th>
                  <th className="p-4">Copyright</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {apods.map((apod) => (
                  <tr key={apod.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                      {apod.id}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="w-16 h-12 relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                        {apod.image_url ? (
                          <img
                            src={apod.image_url}
                            alt={apod.title?.id || apod.id}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                            No Img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 max-w-md">
                      <p className="font-semibold text-white line-clamp-1">
                        {apod.title?.id || apod.title?.en || 'Tanpa Judul'}
                      </p>
                      {apod.title?.id && apod.title?.en && (
                        <p className="text-xs text-gray-400 line-clamp-1 italic mt-0.5">
                          {apod.title.en}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-400 max-w-[150px] truncate">
                      {apod.copyright || 'NASA Public Domain'}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap space-x-2">
                      <Link
                        href={`/apod/${apod.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        title="Lihat Halaman Publik"
                      >
                        👁️ Publik
                      </Link>
                      <button
                        onClick={() => handleEditClick(apod)}
                        className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeletingApodId(apod.id)}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit APOD Modal */}
      {editingApod && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <h2 className="text-lg font-bold text-amber-400">Edit Artikel APOD - {editingApod.id}</h2>
              </div>
              <button
                onClick={() => setEditingApod(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Image Preview & URL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Pratinjau Gambar</label>
                  <div className="aspect-video relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                    {formImageUrl ? (
                      <img src={formImageUrl} alt="APOD preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">Tidak ada URL gambar</span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">URL Gambar / Media</label>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Hak Cipta / Credit</label>
                      <input
                        type="text"
                        value={formCopyright}
                        onChange={(e) => setFormCopyright(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Tipe Media</label>
                      <select
                        value={formMediaType}
                        onChange={(e) => setFormMediaType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="image">Gambar (Image)</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action AI Translate */}
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-gray-400">Terjemahkan otomatis dari Bahasa Inggris ke Indonesia?</span>
                <button
                  type="button"
                  onClick={handleAiTranslate}
                  disabled={translating}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  {translating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menerjemahkan AI...</span>
                    </>
                  ) : (
                    <>
                      <span>🤖</span> Re-Translate AI
                    </>
                  )}
                </button>
              </div>

              {/* Titles */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">Judul (Bahasa Indonesia)</label>
                  <input
                    type="text"
                    value={formTitleId}
                    onChange={(e) => setFormTitleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 mb-1">Judul (Bahasa Inggris Original)</label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Explanations */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">Deskripsi / Penjelasan (Bahasa Indonesia)</label>
                  <textarea
                    rows={5}
                    value={formExpId}
                    onChange={(e) => setFormExpId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-cyan-400 mb-1">Deskripsi / Penjelasan (Bahasa Inggris Original)</label>
                  <textarea
                    rows={5}
                    value={formExpEn}
                    onChange={(e) => setFormExpEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingApod(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-sm font-medium transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete APOD Confirmation Modal */}
      {deletingApodId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <span className="text-5xl block">⚠️</span>
            <h3 className="text-xl font-bold text-white">Hapus Artikel APOD?</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Apakah Anda yakin ingin menghapus artikel APOD tanggal <strong className="text-amber-400 font-mono">{deletingApodId}</strong>?
              Tindakan ini akan menghapus data dari Firestore DB, Cloudflare D1, dan memperbarui cache R2.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingApodId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-sm font-medium transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteApod}
                disabled={saving}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-red-600/20"
              >
                {saving ? 'Menghapus...' : 'Ya, Hapus Artikel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fetch NASA Modal */}
      {isFetchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                <span>🚀</span> Fetch APOD dari NASA API
              </h3>
              <button onClick={() => setIsFetchModalOpen(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Masukkan tanggal yang ingin diambil langsung dari NASA API. AI akan secara otomatis menerjemahkan judul & deskripsi ke Bahasa Indonesia.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Tanggal (YYYY-MM-DD)</label>
              <input
                type="date"
                value={fetchDate}
                onChange={(e) => setFetchDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsFetchModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-sm font-medium transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleFetchNasaDate}
                disabled={fetchingNasa}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/20"
              >
                {fetchingNasa ? 'Mengambil...' : 'Proses & Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
