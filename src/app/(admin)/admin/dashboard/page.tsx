"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Stats {
  totalUsers: number;
  totalArticles: number;
  totalMeteorites: number;
  totalForumPosts: number;
  totalDonations: number;
  activeUsers: number;
}

interface AnalyticsSettings {
  googleTagId: string;
  googleAnalyticsPropertyId: string;
  googleSearchConsoleUrl: string;
}

interface GoogleAnalyticsStats {
  activeNow: number;
  activeUsers30d: number;
  newUsers30d: number;
  sessions30d: number;
  pageViews30d: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncingR2, setIsSyncingR2] = useState(false);
  const [isSyncingD1, setIsSyncingD1] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalArticles: 0,
    totalMeteorites: 0,
    totalForumPosts: 0,
    totalDonations: 0,
    activeUsers: 0
  });
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings>({
    googleTagId: '',
    googleAnalyticsPropertyId: '',
    googleSearchConsoleUrl: ''
  });
  const [googleStats, setGoogleStats] = useState<GoogleAnalyticsStats | null>(null);
  const [googleMessage, setGoogleMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);


  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/analytics/report');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }

        const settingsRes = await fetch('/api/admin/settings');
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setAnalyticsSettings({
            googleTagId: data.settings?.googleTagId || '',
            googleAnalyticsPropertyId: data.settings?.googleAnalyticsPropertyId || '',
            googleSearchConsoleUrl: data.settings?.googleSearchConsoleUrl || ''
          });
        }

        const googleRes = await fetch('/api/admin/analytics/google', { cache: 'no-store' });
        const googleData = await googleRes.json();
        if (googleRes.ok && googleData.success) {
          setGoogleStats(googleData.stats);
          setGoogleMessage('');
        } else {
          setGoogleStats(null);
          setGoogleMessage(googleData.message || 'Google Analytics belum terhubung ke dashboard internal.');
        }
      } catch (err) {
        console.error(err);
        setGoogleMessage('Gagal memuat ringkasan Google Analytics.');
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const statsCards = [
    { label: 'Total Pengguna', value: stats.totalUsers.toLocaleString(), icon: '👥', color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Artikel', value: stats.totalArticles, icon: '📝', color: 'bg-green-100 text-green-600' },
    { label: 'Total Meteorit', value: stats.totalMeteorites, icon: '🌠', color: 'bg-purple-100 text-purple-600' },
    { label: 'Postingan Forum', value: stats.totalForumPosts, icon: '💬', color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Total Donasi', value: `Rp ${stats.totalDonations.toLocaleString()}`, icon: '💰', color: 'bg-red-100 text-red-600' },
    { label: 'Pengguna Aktif', value: stats.activeUsers, icon: '📈', color: 'bg-indigo-100 text-indigo-600' }
  ];

  const handleManualSyncR2 = async () => {
    if (!currentUser) {
      alert('Anda belum terautentikasi.');
      return;
    }
    setIsSyncingR2(true);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'x-admin-uid': currentUser.uid
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Sukses! Sinkronisasi manual selesai.\n\n- ${data.stats.articles} Artikel\n- ${data.stats.meteorites} Meteorit\n- ${data.stats.glossary} Istilah Glosarium\n- ${data.stats.astronauts} Astronot\n\nSemua data berhasil ditulis ulang ke Cloudflare R2.`);
      } else {
        alert(`Gagal sinkronisasi: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat memicu sinkronisasi manual.');
    } finally {
      setIsSyncingR2(false);
    }
  };

  const handleManualSyncD1 = async () => {

    if (!currentUser) {
      alert('Anda belum terautentikasi.');
      return;
    }
    setIsSyncingD1(true);
    try {
      const res = await fetch('/api/admin/sync-d1', {
        method: 'POST',
        headers: {
          'x-admin-uid': currentUser.uid
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

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard Admin</h1>

      {/* Profile Card */}
      {currentUser && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || 'Admin'} 
                className="w-16 h-16 rounded-full border-2 border-amber-500/20"
              />
            ) : (
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'A')}
              </div>
            )}
            <div className="text-left space-y-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Halo, {currentUser.displayName || 'Administrator'} 
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Admin
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-100 dark:border-slate-900 w-fit">
                <span>UID: {currentUser.uid}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.uid);
                    alert('UID berhasil disalin ke clipboard!');
                  }}
                  className="hover:text-amber-500 transition-colors"
                  title="Salin UID"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={async () => {
              if (confirm('Apakah Anda yakin ingin keluar?')) {
                const { signOut } = await import('firebase/auth');
                await signOut(auth);
                router.push('/');
              }
            }}
            className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 px-5 py-2.5 rounded-xl text-sm font-bold border border-red-200/30 transition-all duration-200 active:scale-95 group shrink-0"
          >
            <span>🚪</span>
            <span>Keluar Sesi</span>
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-semibold">
          Memuat data analitik...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsCards.map((card, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 font-semibold">{card.label}</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.color}`}>
                  <span className="text-xl">{card.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pantauan Google Analytics</h2>
            <p className="text-sm text-slate-500 mt-1">
              Status integrasi tag dan akses cepat untuk membaca trafik website langsung dari Google.
            </p>
          </div>
          <Link
            href="/admin/pengaturan"
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold text-center"
          >
            Edit Kode Tag
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase">Measurement ID</p>
            <p className="text-lg font-black text-slate-900 mt-1">{analyticsSettings.googleTagId || 'Belum diisi'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase">Property ID</p>
            <p className="text-lg font-black text-slate-900 mt-1">{analyticsSettings.googleAnalyticsPropertyId || 'Belum diisi'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <p className="text-xs font-bold text-slate-500 uppercase">Crawler Sitemap</p>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-800 mt-2 inline-block">
              /sitemap.xml
            </a>
          </div>
        </div>

        {googleStats ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-5">
            {[
              { label: 'Aktif Sekarang', value: googleStats.activeNow },
              { label: 'Pengunjung 30 Hari', value: googleStats.activeUsers30d },
              { label: 'Pengunjung Baru', value: googleStats.newUsers30d },
              { label: 'Sesi 30 Hari', value: googleStats.sessions30d },
              { label: 'Page View 30 Hari', value: googleStats.pageViews30d },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-blue-100 p-4 bg-blue-50">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{item.value.toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">Data pengunjung belum tampil di admin.</p>
            <p className="text-xs text-amber-800 mt-1">{googleMessage}</p>
            <p className="text-xs text-amber-800 mt-2">
              Untuk menampilkan angka di sini, isi Property ID GA4 numerik and environment service account Google.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Buka Google Analytics
          </a>
          <a
            href={analyticsSettings.googleSearchConsoleUrl || 'https://search.google.com/search-console'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Buka Google Search Console
          </a>
          <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800">
            Cek robots.txt
          </a>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Status Dashboard Internal</p>
          <p className="mt-1 text-sm text-slate-700">
            Ringkasan Google Analytics sekarang ditampilkan langsung di kartu dashboard agar layout admin tetap rapi tanpa iframe.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Aksi Cepat Admin</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/admin/artikel"
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl text-center transition-colors font-bold flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl">➕</span>
            Manajemen Artikel &amp; AI Writer
          </Link>
          <Link 
            href="/admin/ensiklopedia"
            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl text-center transition-colors font-bold flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl">🔄</span>
            Ensiklopedia &amp; NASA Sync
          </Link>
          <Link 
            href="/admin/pengaturan"
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl text-center transition-colors font-bold flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl">💾</span>
            Backup &amp; Restore Database
          </Link>
          <button 
            onClick={handleManualSyncR2}
            disabled={isSyncingR2}
            className="bg-cyan-600 hover:bg-cyan-700 text-white p-4 rounded-xl text-center transition-colors font-bold flex flex-col items-center justify-center gap-1 disabled:opacity-50"
          >
            <span className="text-2xl">☁️</span>
            {isSyncingR2 ? 'Menyinkronkan...' : 'Sinkronkan Firestore ke R2'}
          </button>
          <button 
            onClick={handleManualSyncD1}
            disabled={isSyncingD1}
            className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-xl text-center transition-colors font-bold flex flex-col items-center justify-center gap-1 disabled:opacity-50"
          >
            <span className="text-2xl">🗄️</span>
            {isSyncingD1 ? 'Menyinkronkan D1...' : 'Inisialisasi & Sinkron D1'}
          </button>
        </div>
      </div>


      {/* System Status indicators */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Status Integrasi Sistem</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping"></span>
            <div>
              <p className="text-xs text-slate-500 font-bold">FIREBASE FIRESTORE</p>
              <p className="text-green-600 font-extrabold text-sm">Terhubung (Online)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping"></span>
            <div>
              <p className="text-xs text-slate-500 font-bold">CLOUDFLARE R2</p>
              <p className="text-green-600 font-extrabold text-sm">S3 API Online</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping"></span>
            <div>
              <p className="text-xs text-slate-500 font-bold">CLOUDFLARE D1</p>
              <p className="text-green-600 font-extrabold text-sm">Database Online</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping"></span>
            <div>
              <p className="text-xs text-slate-500 font-bold">MIDTRANS SNAP</p>
              <p className="text-green-600 font-extrabold text-sm">Sandbox/Production Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
