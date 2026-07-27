'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught an exception:', error);

    const errorMessage = error?.message?.toLowerCase() || '';
    const errorName = error?.name?.toLowerCase() || '';

    const isChunkError =
      errorName.includes('chunkloaderror') ||
      errorMessage.includes('loading chunk') ||
      errorMessage.includes('failed to fetch dynamically imported module') ||
      errorMessage.includes('importing a module script failed') ||
      errorMessage.includes('loading css chunk');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('chunk_error_reload_timestamp');
      const now = Date.now();

      // Mencegah infinite loop reload jika ada masalah permanen (misal jeda reload minimal 15 detik)
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('chunk_error_reload_timestamp', String(now));
        console.warn('Deteksi pembaruan versi (ChunkLoadError). Melakukan reload otomatis...');
        window.location.reload();
      }
    }
  }, [error]);

  const handleHardReload = () => {
    try {
      sessionStorage.removeItem('chunk_error_reload_timestamp');
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.warn('Gagal membersihkan cache storage:', e);
    }
    window.location.href = window.location.pathname + '?v=' + Date.now();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-400 text-3xl">
          ⚠️
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Pembaruan Sistem / Kendala Koneksi
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Sistem kami mungkin baru saja melakukan pembaruan versi (*deployment*) atau terdapat kendala jaringan pada browser Anda.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleHardReload}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            🔄 Segarkan Halaman
          </button>

          <a
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all text-center inline-block"
          >
            🏠 Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
