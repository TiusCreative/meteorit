"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function AdminGlossariumPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  async function triggerGlossaryCron() {
    setIsRunning(true);
    setReport('');
    try {
      const secret = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const res = await fetch(`/api/cron/glossary?secret=${encodeURIComponent(secret)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Gagal menjalankan cron glossarium.');
      setReport(`Sukses: ${data.total} istilah diperbarui ke R2 (${data.r2Key}).`);
    } catch (error) {
      setReport(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Glossarium Sains</h1>
        <p className="text-sm text-slate-500 mt-1">
          Picu pembaruan katalog istilah BMKG dan NASA multi-bahasa ke Firestore dan Cloudflare R2.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-bold text-cyan-700 uppercase">Sumber publik</p>
            <p className="text-sm text-slate-700 mt-2">Pembaca memakai R2 dari `data/glossary/terms.json` bila tersedia.</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-bold text-amber-700 uppercase">Kategori</p>
            <p className="text-sm text-slate-700 mt-2">BMKG dan NASA dengan label `id/en/ms/zh/ja`.</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700 uppercase">Akses publik</p>
            <p className="text-sm text-slate-700 mt-2">Halaman `/glossarium` memakai pagination per 20 istilah.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={triggerGlossaryCron}
            disabled={isRunning || !user}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-sm"
          >
            {isRunning ? 'Memperbarui Glossarium...' : 'Picu Manual Glossarium'}
          </button>
          <a
            href="/glossarium"
            target="_blank"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-sm"
          >
            Lihat Halaman Publik
          </a>
        </div>

        {report && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
            {report}
          </div>
        )}
      </div>
    </div>
  );
}
