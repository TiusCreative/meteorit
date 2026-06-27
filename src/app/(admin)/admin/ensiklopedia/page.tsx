"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Meteorite {
  id: string;
  name: string;
  recclass: string;
  year: string;
  mass: string;
  lat: string;
  long: string;
  translated_description: string;
  image_url: string;
}

export default function EnsiklopediaManagement() {
  const [meteorites, setMeteorites] = useState<Meteorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMeteorite, setSelectedMeteorite] = useState<Meteorite | null>(null);
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editMass, setEditMass] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLong, setEditLong] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  const [isAPODSyncing, setIsAPODSyncing] = useState(false);
  const [isGeneratingKomet, setIsGeneratingKomet] = useState(false);
  const [isGeneratingAstronot, setIsGeneratingAstronot] = useState(false);

  async function loadMeteorites() {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/meteorites`, {
        headers: {
          'x-admin-uid': currentUser.uid
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMeteorites(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadMeteorites();
    }
  }, [currentUser]);

  const handleAPODSync = async () => {
    setIsAPODSyncing(true);
    try {
      const secret = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const res = await fetch(`/api/cron?secret=${secret}&target=apod`);
      if (res.ok) {
        const data = await res.json();
        alert(`Sukses! Sinkronisasi NASA APOD selesai. Gambar/Video hari ini ("${data.apod}") berhasil diproses.`);
      } else {
        alert('Gagal menyinkronkan data APOD dengan NASA.');
      }
    } catch (error) {
      console.error(error);
      alert('Error memicu sinkronisasi NASA APOD.');
    } finally {
      setIsAPODSyncing(false);
    }
  };

  const handleGenerateKometArticle = async () => {
    setIsGeneratingKomet(true);
    try {
      const secret = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const res = await fetch(`/api/cron/komet?secret=${secret}`);
      if (res.ok) {
        const data = await res.json();
        alert(`Sukses! Artikel komet baru berhasil dirilis: "${data.article?.title}"`);
      } else {
        const err = await res.json();
        alert(`Gagal memicu komet: ${err.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error memicu generator komet.');
    } finally {
      setIsGeneratingKomet(false);
    }
  };

  const handleGenerateAstronotProfile = async () => {
    setIsGeneratingAstronot(true);
    try {
      const secret = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const res = await fetch(`/api/cron/astronot?secret=${secret}`);
      if (res.ok) {
        const data = await res.json();
        alert(`Sukses! Profil astronot diproses. Total: ${data.total} astronot.`);
      } else {
        const err = await res.json();
        alert(`Gagal memicu astronot: ${err.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error memicu generator astronot.');
    } finally {
      setIsGeneratingAstronot(false);
    }
  };

  const handleNASASync = async () => {
    setIsSyncing(true);
    try {
      const secret = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const res = await fetch(`/api/cron?secret=${secret}&target=meteorites`);
      if (res.ok) {
        const data = await res.json();
        alert(`Sukses! Sinkronisasi meteorit NASA selesai. ${data.meteoritesCount} meteorit berhasil diproses.`);
        loadMeteorites(); // Refresh
      } else {
        alert('Gagal menyinkronkan data dengan NASA.');
      }
    } catch (error) {
      console.error(error);
      alert('Error memicu sinkronisasi NASA.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditClick = (met: Meteorite) => {
    setSelectedMeteorite(met);
    setEditName(met.name || '');
    setEditClass(met.recclass || '');
    setEditYear(met.year || '');
    setEditMass(met.mass || '');
    setEditLat(met.lat || '0');
    setEditLong(met.long || '0');
    setEditDescription(met.translated_description || '');
    setEditImageUrl(met.image_url || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeteorite || !currentUser) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/meteorites', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-uid': currentUser.uid
        },
        body: JSON.stringify({
          id: selectedMeteorite.id,
          name: editName,
          recclass: editClass,
          year: editYear,
          mass: editMass,
          lat: editLat,
          long: editLong,
          translated_description: editDescription,
          image_url: editImageUrl
        })
      });

      if (res.ok) {
        alert('Data meteorit berhasil diperbarui.');
        setShowEditModal(false);
        loadMeteorites();
      } else {
        const data = await res.json();
        alert(`Gagal menyimpan: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saat memperbarui data meteorit.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!currentUser) return;
    if (!confirm('Apakah Anda yakin ingin menghapus meteorit ini secara permanen dari database dan R2 cache?')) return;

    try {
      const res = await fetch(`/api/admin/meteorites?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-uid': currentUser.uid
        }
      });

      if (res.ok) {
        alert('Meteorit berhasil dihapus.');
        loadMeteorites();
      } else {
        const data = await res.json();
        alert(`Gagal menghapus: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saat menghapus data meteorit.');
    }
  };

  return (
    <div className="space-y-6 text-left relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen Ensiklopedia</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola katalog ilmiah meteorit yang ditarik dari NASA API.</p>
        </div>
        <button 
          onClick={handleNASASync}
          disabled={isSyncing}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all inline-flex items-center gap-2 shadow-sm text-sm"
        >
          {isSyncing ? '⏳ Menyinkronkan...' : '🔄 Sinkronkan Data NASA'}
        </button>
      </div>

      {/* Sync Control panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* APOD */}
        <div className="space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Picu Manual APOD</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              Unduh Astronomy Picture of the Day NASA hari ini, terjemahkan dengan Llama AI, dan simpan di cache R2.
            </p>
          </div>
          <button 
            onClick={handleAPODSync}
            disabled={isAPODSyncing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            {isAPODSyncing ? '⏳ Mengunduh APOD...' : '🌌 Picu APOD Manual'}
          </button>
        </div>

        {/* Meteorit */}
        <div className="space-y-3 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Harvester Meteorit</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              Harvester meteorit mengunduh data pendaratan batuan luar angkasa acak dari NASA API dan memperbarui cache katalog R2.
            </p>
          </div>
          <button 
            onClick={handleNASASync}
            disabled={isSyncing}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            {isSyncing ? '⏳ Sinkronisasi...' : '🛰️ Harvester Meteorit'}
          </button>
        </div>

        {/* Komet */}
        <div className="space-y-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Harvester Komet</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              Pantau asteroid terdekat dari NASA NeoWs, buat ulasan sains populer dengan Llama-3 AI, lalu terbitkan ke blog.
            </p>
          </div>
          <button 
            onClick={handleGenerateKometArticle}
            disabled={isGeneratingKomet}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            {isGeneratingKomet ? '⏳ Menulis Artikel...' : '☄️ Harvester Komet (AI)'}
          </button>
        </div>

        {/* Astronot */}
        <div className="space-y-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-1">Harvester Astronot</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              Ambil kru luar angkasa aktif saat ini dari API, generate biografi AI & foto, lalu daftarkan ke database.
            </p>
          </div>
          <button 
            onClick={handleGenerateAstronotProfile}
            disabled={isGeneratingAstronot}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl transition-all inline-flex items-center justify-center gap-2 text-xs shadow-sm"
          >
            {isGeneratingAstronot ? '⏳ Menggenerate...' : '👨‍🚀 Harvester Astronot (AI)'}
          </button>
        </div>
      </div>

      {/* Meteorites Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Katalog Meteorit Terdaftar ({meteorites.length} item)</h2>
          <button 
            onClick={loadMeteorites}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            🔄 Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Memuat katalog...</div>
        ) : meteorites.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Katalog kosong. Jalankan sinkronisasi NASA di atas untuk mengisi data.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tahun</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Massa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Koordinat</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {meteorites.map((met) => (
                    <tr key={met.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">{met.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {met.recclass}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {met.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {met.mass}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                        {met.lat}, {met.long}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(met)}
                            className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(met.id)}
                            className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden block divide-y divide-slate-100">
              {meteorites.map((met) => (
                <div key={met.id} className="p-4 space-y-3.5 hover:bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{met.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ID: {met.id}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      {met.recclass}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Tahun</span>
                      <span className="font-semibold text-slate-700">{met.year}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Massa</span>
                      <span className="font-semibold text-slate-700">{met.mass}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Koordinat</span>
                      <span className="font-mono text-slate-700 block truncate" title={`${met.lat}, ${met.long}`}>
                        {met.lat}, {met.long}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => handleEditClick(met)}
                      className="flex-1 bg-amber-100 text-amber-800 hover:bg-amber-200 py-2 rounded-xl text-xs font-bold transition-all text-center"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(met.id)}
                      className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 py-2 rounded-xl text-xs font-bold transition-all text-center"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* EDIT MODAL DIALOG */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Edit Data Meteorit</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-semibold focus:outline-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-grow text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Nama Meteorit</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Tipe / Klasifikasi</label>
                  <input 
                    type="text" 
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Tahun</label>
                  <input 
                    type="text" 
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Massa (Berat)</label>
                  <input 
                    type="text" 
                    value={editMass}
                    onChange={(e) => setEditMass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Koordinat Lintang (Lat)</label>
                  <input 
                    type="text" 
                    value={editLat}
                    onChange={(e) => setEditLat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Koordinat Bujur (Long)</label>
                  <input 
                    type="text" 
                    value={editLong}
                    onChange={(e) => setEditLong(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">URL Gambar</label>
                <input 
                  type="text" 
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Deskripsi & Analisis Sejarah</label>
                <textarea 
                  rows={6}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
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