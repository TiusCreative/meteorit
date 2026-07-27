"use client";

import { useEffect, useState } from 'react';

interface GoogleAnalyticsStats {
  activeNow: number;
  activeUsers30d: number;
  newUsers30d: number;
  sessions30d: number;
  pageViews30d: number;
}

const LOOKER_STUDIO_EMBED_URL = 'https://datastudio.google.com/embed/reporting/e0cea7f8-3de0-4652-b7dd-8d5f9c5110ef/page/SGS2F';
const GA4_PROPERTY_ID = '543353784';

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

  const cards = [
    { label: 'Aktif Sekarang', value: stats?.activeNow ?? 0 },
    { label: 'Pengunjung 30 Hari', value: stats?.activeUsers30d ?? 0 },
    { label: 'Pengunjung Baru', value: stats?.newUsers30d ?? 0 },
    { label: 'Sesi 30 Hari', value: stats?.sessions30d ?? 0 },
    { label: 'Page View 30 Hari', value: stats?.pageViews30d ?? 0 },
  ];

  return (
    <main className="min-h-screen space-y-6 text-slate-900">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-cyan-600">Looker Studio / Google Analytics</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Pantauan Pengunjung</h1>
          <p className="mt-1 text-xs text-slate-500">GA4 Property ID: {GA4_PROPERTY_ID}</p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
          GA4 auto refresh 60 detik
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-cyan-700">{card.value.toLocaleString('id-ID')}</p>
          </div>
        ))}
      </div>

      {!stats && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-black text-amber-900">Ringkasan GA4 internal belum tampil</p>
          <p className="mt-2 text-xs leading-relaxed text-amber-800">{message}</p>
          <p className="mt-2 text-xs leading-relaxed text-amber-800">
            Iframe Looker Studio tetap tersedia di bawah. Untuk angka GA4 internal, pastikan service account Google diberi akses ke property {GA4_PROPERTY_ID}.
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Dashboard Looker Studio</h2>
            <p className="text-xs text-slate-500">Embed laporan publik dari Google Looker Studio.</p>
          </div>
          <a
            href={LOOKER_STUDIO_EMBED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Buka laporan di tab baru
          </a>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <iframe
            title="Looker Studio Meteorit Indonesia"
            width="600"
            height="450"
            src={LOOKER_STUDIO_EMBED_URL}
            frameBorder="0"
            style={{ border: 0 }}
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            className="h-[70vh] min-h-[450px] w-full"
          />
        </div>
      </section>
    </main>
  );
}
