"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

interface ManualAd {
  id: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
}

export default function IklanManagement() {
  const [adsenseActive, setAdsenseActive] = useState(true);
  const [adsenseClientId, setAdsenseClientId] = useState('');
  const [adsenseSlotId, setAdsenseSlotId] = useState('');
  const [adsensePositions, setAdsensePositions] = useState<string[]>([]);
  const [manualAds, setManualAds] = useState<ManualAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual ad form
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [newAdLinkUrl, setNewAdLinkUrl] = useState('');
  const [newAdPosition, setNewAdPosition] = useState('content');

  async function loadSettings() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings;
        setAdsenseActive(settings.adsenseActive);
        setAdsenseClientId(settings.adsenseClientId || '');
        setAdsenseSlotId(settings.adsenseSlotId || '');
        setAdsensePositions(settings.adsensePositions || []);
        setManualAds(settings.manualAds || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveAdsense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adsenseActive,
          adsenseClientId,
          adsenseSlotId,
          adsensePositions
        })
      });
      if (res.ok) {
        alert('Pengaturan Google Adsense berhasil diperbarui!');
      } else {
        alert('Gagal memperbarui Adsense.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePositionToggle = (pos: string) => {
    if (adsensePositions.includes(pos)) {
      setAdsensePositions(adsensePositions.filter(p => p !== pos));
    } else {
      setAdsensePositions([...adsensePositions, pos]);
    }
  };

  const handleAddManualAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdImageUrl || !newAdLinkUrl) return;

    const newAd: ManualAd = {
      id: `ad-${Date.now()}`,
      imageUrl: newAdImageUrl,
      linkUrl: newAdLinkUrl,
      position: newAdPosition
    };

    const updated = [...manualAds, newAd];
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualAds: updated })
      });
      if (res.ok) {
        setManualAds(updated);
        setNewAdImageUrl('');
        setNewAdLinkUrl('');
        alert('Iklan manual sponsor berhasil didaftarkan!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteManualAd = async (id: string) => {
    const updated = manualAds.filter(ad => ad.id !== id);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualAds: updated })
      });
      if (res.ok) {
        setManualAds(updated);
        alert('Iklan manual berhasil dihapus!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-3xl font-bold text-slate-800">Manajemen Iklan</h1>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-semibold">Memuat pengaturan iklan...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Google Adsense Panel */}
          <form onSubmit={handleSaveAdsense} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Pengaturan Google Adsense</h2>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-bold text-slate-800 text-sm block">Status Iklan Otomatis</span>
                <span className="text-xs text-slate-500">Nyalakan/matikan seluruh Adsense di website</span>
              </div>
              <input 
                type="checkbox"
                checked={adsenseActive}
                onChange={(e) => setAdsenseActive(e.target.checked)}
                className="w-5 h-5 cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Adsense Publisher Client ID</label>
              <input 
                type="text"
                value={adsenseClientId}
                onChange={(e) => setAdsenseClientId(e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Adsense Ad Slot ID</label>
              <input 
                type="text"
                value={adsenseSlotId}
                onChange={(e) => setAdsenseSlotId(e.target.value)}
                placeholder="XXXXXXXXXX"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Penempatan Posisi Iklan</label>
              <div className="space-y-2 text-sm text-slate-700">
                {['hero', 'content', 'footer'].map((pos) => (
                  <label key={pos} className="flex items-center gap-2 cursor-pointer capitalize">
                    <input 
                      type="checkbox"
                      checked={adsensePositions.includes(pos)}
                      onChange={() => handlePositionToggle(pos)}
                      className="accent-blue-600"
                    />
                    Posisi: {pos}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors">
              Simpan Pengaturan Adsense
            </button>
          </form>

          {/* Manual Partner Ad Panel */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Iklan Banner Manual (Mitra Lokal)</h2>
              
              {/* List active manual ads */}
              <div className="space-y-3 mb-6">
                {manualAds.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">Belum ada banner iklan manual.</p>
                ) : (
                  manualAds.map((ad) => (
                    <div key={ad.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs">
                        <p className="font-bold text-slate-800 truncate max-w-[200px]">{ad.linkUrl}</p>
                        <p className="text-[10px] text-cyan-600 uppercase font-bold">Posisi: {ad.position}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteManualAd(ad.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                      >
                        Hapus
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add manual ad */}
              <form onSubmit={handleAddManualAd} className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-bold text-slate-700">Daftarkan Iklan Mitra</h3>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">URL Gambar Banner</label>
                  <input 
                    type="url"
                    value={newAdImageUrl}
                    onChange={(e) => setNewAdImageUrl(e.target.value)}
                    placeholder="https://image-url.com/ad.jpg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tautan Klik URL</label>
                  <input 
                    type="url"
                    value={newAdLinkUrl}
                    onChange={(e) => setNewAdLinkUrl(e.target.value)}
                    placeholder="https://partner-website.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Target Penempatan</label>
                  <select 
                    value={newAdPosition}
                    onChange={(e) => setNewAdPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none text-slate-800 text-sm"
                  >
                    <option value="hero">Hero Section (Atas)</option>
                    <option value="content">Content Section (Tengah)</option>
                    <option value="footer">Footer Section (Bawah)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs transition-colors">
                  Daftarkan Iklan Banner
                </button>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}