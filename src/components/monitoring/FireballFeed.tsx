'use client';

import { useEffect, useState } from 'react';

interface FireballEvent {
  date: string;
  energy: string | null;
  impact_e: string | null;
  lat: string | null;
  lon: string | null;
  lat_dir: string | null;
  lon_dir: string | null;
  alt: string | null;
  vel: string | null;
}

function getEnergyLevel(energy: string | null): { label: string; color: string } {
  if (!energy) return { label: 'Tak Diketahui', color: 'text-slate-400' };
  const val = parseFloat(energy);
  if (val >= 1000) return { label: 'Ekstrem', color: 'text-red-400' };
  if (val >= 100) return { label: 'Sangat Besar', color: 'text-orange-400' };
  if (val >= 10) return { label: 'Besar', color: 'text-amber-400' };
  if (val >= 1) return { label: 'Sedang', color: 'text-yellow-400' };
  return { label: 'Kecil', color: 'text-cyan-400' };
}

function formatLatLon(lat: string | null, latDir: string | null, lon: string | null, lonDir: string | null): string {
  if (!lat || !lon) return '—';
  return `${parseFloat(lat).toFixed(1)}°${latDir || ''}, ${parseFloat(lon).toFixed(1)}°${lonDir || ''}`;
}

export default function FireballFeed() {
  const [data, setData] = useState<FireballEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'energy'>('date');

  useEffect(() => {
    async function fetchFireball() {
      try {
        setLoading(true);
        const res = await fetch('/api/nasa/fireball');
        if (!res.ok) throw new Error('Gagal memuat data bola api');
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error tidak diketahui');
      } finally {
        setLoading(false);
      }
    }
    fetchFireball();
  }, []);

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'energy') {
      return (parseFloat(b.energy || '0')) - (parseFloat(a.energy || '0'));
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const maxEnergy = Math.max(...data.map((d) => parseFloat(d.energy || '0')));

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="dashboard-card p-4 text-center">
          <div className="text-2xl mb-1">🔥</div>
          <p className="text-2xl font-black mono-font text-orange-400">{loading ? '...' : data.length}</p>
          <p className="text-xs text-slate-500">Kejadian 30 Hari Terakhir</p>
        </div>
        <div className="dashboard-card p-4 text-center">
          <div className="text-2xl mb-1">⚡</div>
          <p className="text-2xl font-black mono-font text-amber-400">
            {loading ? '...' : (maxEnergy > 0 ? maxEnergy.toFixed(0) : '—')}
          </p>
          <p className="text-xs text-slate-500">Energi Terbesar (GJ)</p>
        </div>
        <div className="dashboard-card p-4 text-center col-span-2 md:col-span-1">
          <div className="text-2xl mb-1">🌍</div>
          <p className="text-2xl font-black mono-font text-rose-400">
            {loading ? '...' : data.filter((d) => d.lat && d.lon).length}
          </p>
          <p className="text-xs text-slate-500">Dengan Data Koordinat</p>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-400">Urutkan:</span>
        {(['date', 'energy'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
              sortBy === s
                ? 'border-orange-400 text-orange-400 bg-orange-400/10'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {s === 'date' ? '📅 Terbaru' : '⚡ Energi Terbesar'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm mono-font">Mengambil data dari JPL Fireball API...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl border border-red-500/30 text-center py-12">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/80">
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold mono-font">TANGGAL & WAKTU (UTC)</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold mono-font">ENERGI (GJ)</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold mono-font hidden md:table-cell">DAMPAK (kt TNT)</th>
                  <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold mono-font hidden lg:table-cell">KOORDINAT</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold mono-font hidden md:table-cell">KECEPATAN (km/s)</th>
                  <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold">LEVEL</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((event, idx) => {
                  const energyInfo = getEnergyLevel(event.energy);
                  const energyVal = event.energy ? parseFloat(event.energy).toFixed(2) : '—';
                  const impactVal = event.impact_e ? parseFloat(event.impact_e).toFixed(3) : '—';
                  const velVal = event.vel ? parseFloat(event.vel).toFixed(1) : '—';
                  const coords = formatLatLon(event.lat, event.lat_dir, event.lon, event.lon_dir);
                  const dateStr = event.date ? new Date(event.date).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : '—';
                  
                  // Energy bar width
                  const energyNum = parseFloat(event.energy || '0');
                  const barWidth = maxEnergy > 0 ? (energyNum / maxEnergy) * 100 : 0;

                  return (
                    <tr
                      key={`${event.date}-${idx}`}
                      className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 mono-font text-xs text-slate-300">{dateStr}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`mono-font text-xs font-bold ${energyInfo.color}`}>{energyVal}</span>
                          {event.energy && (
                            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-600 to-red-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right mono-font text-xs text-slate-400 hidden md:table-cell">{impactVal}</td>
                      <td className="px-4 py-3 text-center mono-font text-xs text-slate-400 hidden lg:table-cell">{coords}</td>
                      <td className="px-4 py-3 text-right mono-font text-xs text-slate-400 hidden md:table-cell">{velVal}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold ${energyInfo.color}`}>{energyInfo.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      Tidak ada data bola api tersedia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600 mt-4 text-right mono-font">
        Sumber: JPL Fireball Data API • GJ = Gigajoule • kt = kiloton TNT
      </p>
    </div>
  );
}
