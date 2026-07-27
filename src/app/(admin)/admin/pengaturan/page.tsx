"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseConfig';


interface BackupFile {
  key: string;
  name: string;
  size: number;
  lastModified: string;
}

export default function PengaturanAdmin() {
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [telegramChannel, setTelegramChannel] = useState('');
  const [telegramGroup, setTelegramGroup] = useState('');
  const [aboutVisi, setAboutVisi] = useState('');
  const [aboutMisi, setAboutMisi] = useState('');
  const [aboutSejarah, setAboutSejarah] = useState('');
  const [encyclopediaCronLimit, setEncyclopediaCronLimit] = useState(20);
  const [googleTagId, setGoogleTagId] = useState('');
  const [googleAnalyticsPropertyId, setGoogleAnalyticsPropertyId] = useState('');
  const [googleSearchConsoleUrl, setGoogleSearchConsoleUrl] = useState('');
  const [customHeadCode, setCustomHeadCode] = useState('');
  const [customBodyStartCode, setCustomBodyStartCode] = useState('');
  const [customBodyEndCode, setCustomBodyEndCode] = useState('');
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackupProcessing, setIsBackupProcessing] = useState(false);
  const [isSyncingD1, setIsSyncingD1] = useState(false);


  async function loadData() {
    setIsLoading(true);
    try {
      // 1. Load settings docs
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const settings = settingsData.settings;
        setWhatsappUrl(settings.whatsappUrl || '');
        setTelegramChannel(settings.telegramChannel || '');
        setTelegramGroup(settings.telegramGroup || '');
        setAboutVisi(settings.aboutVisi || '');
        setAboutMisi(settings.aboutMisi || '');
        setAboutSejarah(settings.aboutSejarah || '');
        setEncyclopediaCronLimit(settings.encyclopediaCronLimit || 20);
        setGoogleTagId(settings.googleTagId || '');
        setGoogleAnalyticsPropertyId(settings.googleAnalyticsPropertyId || '');
        setGoogleSearchConsoleUrl(settings.googleSearchConsoleUrl || '');
        setCustomHeadCode(settings.customHeadCode || '');
        setCustomBodyStartCode(settings.customBodyStartCode || '');
        setCustomBodyEndCode(settings.customBodyEndCode || '');
      }

      // 2. Load backup lists from R2
      const backupsRes = await fetch('/api/admin/backup');
      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData.backups || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappUrl,
          telegramChannel,
          telegramGroup,
          aboutVisi,
          aboutMisi,
          aboutSejarah,
          encyclopediaCronLimit: Number(encyclopediaCronLimit),
          googleTagId,
          googleAnalyticsPropertyId,
          googleSearchConsoleUrl,
          customHeadCode,
          customBodyStartCode,
          customBodyEndCode
        })
      });
      if (res.ok) {
        alert('Pengaturan berhasil disimpan!');
      } else {
        alert('Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackupProcessing(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup' })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Backup berhasil dibuat: ${data.file}`);
        loadData(); // Reload list
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memproses backup database.');
    } finally {
      setIsBackupProcessing(false);
    }
  };

  const handleSyncD1 = async () => {
    setIsSyncingD1(true);
    try {
      const currentUser = auth.currentUser;
      const adminUid = currentUser?.uid || '';
      
      const res = await fetch('/api/admin/sync-d1', {
        method: 'POST',
        headers: {
          'x-admin-uid': adminUid
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Sukses! Sinkronisasi Cloudflare D1 selesai.\n\n- Total: ${data.stats.total}\n- Berhasil: ${data.stats.synced}\n- Gagal: ${data.stats.failed}\n\nSemua metadata berhasil dipindahkan ke Cloudflare D1.`);
      } else {
        alert(`Gagal sinkronisasi D1: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat memicu sinkronisasi manual D1.');
    } finally {
      setIsSyncingD1(false);
    }
  };


  const handleRestoreBackup = async (fileName: string) => {
    if (!confirm(`Apakah Anda yakin ingin melakukan restore dari berkas "${fileName}"? Tindakan ini akan mengganti semua koleksi Firestore saat ini.`)) return;

    setIsBackupProcessing(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', fileName })
      });
      if (res.ok) {
        alert('Database berhasil direstore dari backup!');
        loadData();
      } else {
        alert('Gagal memproses restore database.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBackupProcessing(false);
    }
  };

  const handleDeleteBackup = async (fileName: string) => {
    if (!confirm(`Hapus berkas backup "${fileName}"?`)) return;

    setIsBackupProcessing(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', fileName })
      });
      if (res.ok) {
        alert('Berkas backup berhasil dihapus dari Cloudflare R2!');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBackupProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-3xl font-bold text-slate-800">Pengaturan Umum</h1>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-semibold">Memuat pengaturan...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Social settings */}
          <form onSubmit={handleSaveSocialLinks} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Konfigurasi Media Sosial & Sistem (Cron)</h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">WhatsApp Channel URL</label>
              <input 
                type="url"
                value={whatsappUrl}
                onChange={(e) => setWhatsappUrl(e.target.value)}
                placeholder="https://whatsapp.com/channel/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Telegram Channel URL</label>
              <input 
                type="url"
                value={telegramChannel}
                onChange={(e) => setTelegramChannel(e.target.value)}
                placeholder="https://t.me/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Telegram Group URL</label>
              <input 
                type="url"
                value={telegramGroup}
                onChange={(e) => setTelegramGroup(e.target.value)}
                placeholder="https://t.me/joinchat/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Data Cron Ensiklopedia</label>
              <select
                value={encyclopediaCronLimit}
                onChange={(e) => setEncyclopediaCronLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm bg-white"
              >
                <option value={5}>5 item / hari</option>
                <option value={10}>10 item / hari</option>
                <option value={15}>15 item / hari</option>
                <option value={20}>20 item / hari</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors">
              Simpan Tautan & Konfigurasi Cron
            </button>
          </form>

          {/* Backup Restore Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Backup & Restore (Cloudflare R2)</h2>
            
            <div className="flex gap-4">
              <button 
                onClick={handleCreateBackup}
                disabled={isBackupProcessing}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors"
              >
                {isBackupProcessing ? '⏳ Memproses...' : '💾 Buat Backup Baru'}
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500">Cloudflare D1 Database</p>
              <button 
                onClick={handleSyncD1}
                disabled={isSyncingD1}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors"
              >
                {isSyncingD1 ? '⏳ Menyinkronkan D1...' : '🗄️ Inisialisasi & Sinkron Firebase ke D1'}
              </button>
            </div>


            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">Daftar Backup Tersedia</h3>
              <div className="space-y-2 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                {backups.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">Belum ada file backup di R2.</p>
                ) : (
                  backups.map((b) => (
                    <div key={b.key} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 text-xs shadow-sm">
                      <div className="text-left">
                        <span className="font-semibold text-slate-700 block truncate max-w-[180px]">{b.name}</span>
                        <span className="text-[10px] text-slate-400">Ukuran: {(b.size / 1024).toFixed(2)} KB | Modifikasi: {new Date(b.lastModified).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={`/api/admin/backup?file=${encodeURIComponent(b.name)}`}
                          download
                          className="text-green-600 hover:text-green-900 font-bold"
                        >
                          Unduh
                        </a>
                        <button 
                          onClick={() => handleRestoreBackup(b.name)}
                          disabled={isBackupProcessing}
                          className="text-blue-600 hover:text-blue-900 font-bold"
                        >
                          Restore
                        </button>
                        <button 
                          onClick={() => handleDeleteBackup(b.name)}
                          disabled={isBackupProcessing}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          Hapus
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Google Analytics & Tag Editor */}
          <form onSubmit={handleSaveSocialLinks} className="col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-lg font-bold text-slate-800">Google Analytics, Search Console & Tag Editor</h2>
              <p className="text-xs text-slate-500 mt-1">Kode di bawah akan diinjeksi ke layout global website.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Google Tag / Measurement ID</label>
                <input
                  type="text"
                  value={googleTagId}
                  onChange={(e) => setGoogleTagId(e.target.value)}
                  placeholder="G-X4F6EB07D4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Google Analytics Property ID Numerik</label>
                <input
                  type="text"
                  value={googleAnalyticsPropertyId}
                  onChange={(e) => setGoogleAnalyticsPropertyId(e.target.value)}
                  placeholder="123456789"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">Bukan Measurement ID yang diawali G-.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Google Search Console URL</label>
                <input
                  type="url"
                  value={googleSearchConsoleUrl}
                  onChange={(e) => setGoogleSearchConsoleUrl(e.target.value)}
                  placeholder="https://search.google.com/search-console"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Kode untuk Head</label>
              <textarea
                rows={10}
                value={customHeadCode}
                onChange={(e) => setCustomHeadCode(e.target.value)}
                placeholder="<script>...</script>"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kode awal Body</label>
                <textarea
                  rows={8}
                  value={customBodyStartCode}
                  onChange={(e) => setCustomBodyStartCode(e.target.value)}
                  placeholder="Kode setelah tag <body>"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kode akhir Body</label>
                <textarea
                  rows={8}
                  value={customBodyEndCode}
                  onChange={(e) => setCustomBodyEndCode(e.target.value)}
                  placeholder="Kode sebelum tag </body>"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors">
                Simpan Kode Google & Tag
              </button>
              {googleSearchConsoleUrl && (
                <a
                  href={googleSearchConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  Buka Google Search Console
                </a>
              )}
              <a
                href="https://analytics.google.com/analytics/web/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Buka Google Analytics
              </a>
            </div>
          </form>

          {/* Tentang Kami Panel */}
          <form onSubmit={handleSaveSocialLinks} className="col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Konten Halaman Tentang Kami (About Us)</h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Visi Kami</label>
              <textarea 
                rows={3}
                value={aboutVisi}
                onChange={(e) => setAboutVisi(e.target.value)}
                placeholder="Visi komunitas..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Misi Kami (Pisahkan dengan baris baru untuk setiap poin)</label>
              <textarea 
                rows={5}
                value={aboutMisi}
                onChange={(e) => setAboutMisi(e.target.value)}
                placeholder="Misi 1&#10;Misi 2&#10;Misi 3..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Sejarah Kami</label>
              <textarea 
                rows={5}
                value={aboutSejarah}
                onChange={(e) => setAboutSejarah(e.target.value)}
                placeholder="Sejarah berdirinya platform..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 text-sm"
                required
              />
            </div>

            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors">
              Simpan Konten Tentang Kami & Tautan Sosmed
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
