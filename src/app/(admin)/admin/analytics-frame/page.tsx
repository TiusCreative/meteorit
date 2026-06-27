"use client";

import { useEffect, useState } from 'react';

interface GoogleAnalyticsStats {
  activeNow: number;
  activeUsers30d: number;
  newUsers30d: number;
  sessions30d: number;
  pageViews30d: number;
}

export default function AnalyticsFramePage() {
  const [stats, setStats] = useState<GoogleAnalyticsStats | null>(null);
  const [message, setMessage] = useState('Memuat Google Analytics...');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch('/api/admin/analytics/google', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Google Analytics belum terhubung.');
        }
        setStats(data.stats);
        setMessage('');
      } catch (error) {
        setStats(null);
        setMessage(error instanceof Error ? error.message : 'Gagal memuat Google Analytics.');
      }
    }

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5">
          <p className="text-sm font-black text-amber-100">Google Analytics belum tampil</p>
          <p className="mt-2 text-xs leading-relaxed text-amber-50/80">{message}</p>
        </div>
      </main>
    );
  }

  const cards = [
    { label: 'Aktif Sekarang', value: stats.activeNow },
    { label: 'Pengunjung 30 Hari', value: stats.activeUsers30d },
    { label: 'Pengunjung Baru', value: stats.newUsers30d },
    { label: 'Sesi 30 Hari', value: stats.sessions30d },
    { label: 'Page View 30 Hari', value: stats.pageViews30d },
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Google Analytics</p>
          <h1 className="text-xl font-black text-white">Pantauan Pengunjung</h1>
        </div>
        <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">
          Auto refresh 60 detik
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-cyan-100">{card.value.toLocaleString('id-ID')}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
