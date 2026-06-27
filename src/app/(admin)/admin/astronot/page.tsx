"use client";

import { useEffect, useMemo, useState } from 'react';

interface Astronaut {
  id: string;
  name: string;
  craft: string;
  country: string;
  agency: string;
  role: string;
  launchDate: string;
  status: 'active' | 'upcoming' | 'returned';
  mission?: string;
  returnDate?: string;
  updatedAt?: string;
}

const SECRET = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';

const STATUS_COPY = {
  active: { label: 'Sedang di Antariksa', badge: 'bg-green-100 text-green-800 border-green-200' },
  upcoming: { label: 'Misi Mendatang', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  returned: { label: 'Pahlawan Antariksa', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200' }
};

export default function AstronautAdminPage() {
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [summary, setSummary] = useState({ active: 0, upcoming: 0, returned: 0, total: 0 });
  const [updatedAt, setUpdatedAt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | Astronaut['status']>('all');

  async function loadAstronauts() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/astronauts?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setAstronauts(data.astronauts || []);
      setSummary(data.summary || { active: 0, upcoming: 0, returned: 0, total: 0 });
      setUpdatedAt(data.updatedAt || '');
    } catch (error) {
      console.error(error);
      setAstronauts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAstronauts();
  }, []);

  const filteredAstronauts = useMemo(() => {
    if (activeFilter === 'all') return astronauts;
    return astronauts.filter((astronaut) => astronaut.status === activeFilter);
  }, [astronauts, activeFilter]);

  const handleTriggerAstronauts = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch(`/api/cron/astronot?secret=${encodeURIComponent(SECRET)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        alert(`Gagal memperbarui daftar astronot: ${data.details || data.error || 'Terjadi kesalahan'}`);
        return;
      }

      alert(`Sukses memperbarui daftar astronot. Aktif: ${data.summary?.active || 0}, mendatang: ${data.summary?.upcoming || 0}, alumni: ${data.summary?.returned || 0}.`);
      loadAstronauts();
    } catch (error) {
      console.error(error);
      alert('Error memicu pembaruan daftar astronot.');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Daftar Astronot</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola cache JSON R2 untuk kru aktif, misi mendatang, dan alumni yang pernah bertugas di ISS atau stasiun antariksa lain.
          </p>
        </div>
        <button
          onClick={handleTriggerAstronauts}
          disabled={isTriggering}
          className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-sm text-sm disabled:opacity-60"
        >
          {isTriggering ? 'Memperbarui R2...' : 'Picu Daftar Astronot'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Profil', value: summary.total, filter: 'all' as const },
          { label: 'Sedang di Antariksa', value: summary.active, filter: 'active' as const },
          { label: 'Misi Mendatang', value: summary.upcoming, filter: 'upcoming' as const },
          { label: 'Alumni / Returned', value: summary.returned, filter: 'returned' as const },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveFilter(item.filter)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              activeFilter === item.filter ? 'border-purple-400 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-200'
            }`}
          >
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">{item.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cache Astronot R2 ({filteredAstronauts.length} profil)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Disimpan di <span className="font-mono">data/astronauts/astronauts.json</span>
              {updatedAt ? ` • Update ${new Date(updatedAt).toLocaleString('id-ID')}` : ''}
            </p>
          </div>
          <button
            onClick={loadAstronauts}
            className="text-xs text-purple-700 hover:text-purple-900 font-semibold"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Memuat daftar astronot...</div>
        ) : filteredAstronauts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Belum ada data. Jalankan pemicu daftar astronot.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Misi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Agensi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAstronauts.map((astronaut) => {
                  const status = STATUS_COPY[astronaut.status] || STATUS_COPY.active;
                  return (
                    <tr key={astronaut.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">{astronaut.name}</div>
                        <div className="text-xs text-slate-400">{astronaut.role} • {astronaut.country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.badge}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {astronaut.mission || astronaut.craft}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {astronaut.agency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {astronaut.status === 'returned' && astronaut.returnDate ? astronaut.returnDate : astronaut.launchDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
