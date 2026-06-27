'use client';

import { useEffect, useState } from 'react';

interface NeoObject {
  id: string;
  name: string;
  estimated_diameter_min_km: number;
  estimated_diameter_max_km: number;
  is_potentially_hazardous: boolean;
  close_approach_date: string;
  miss_distance_km: number;
  relative_velocity_km_per_h: number;
}

function OrbitSVG({ hazardous }: { hazardous: boolean }) {
  return (
    <div className="relative w-24 h-24 flex-shrink-0 hidden sm:flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
        {/* Orbit rings */}
        <circle cx="50" cy="50" r="38" fill="none" stroke={hazardous ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,238,0.2)'} strokeWidth="1" strokeDasharray="4 2" />
        <circle cx="50" cy="50" r="55" fill="none" stroke={hazardous ? 'rgba(239,68,68,0.15)' : 'rgba(34,211,238,0.1)'} strokeWidth="1" strokeDasharray="3 4" />
        {/* Earth */}
        <circle cx="50" cy="50" r="7" fill="#1e40af" stroke="#3b82f6" strokeWidth="1" />
        <text x="50" y="54" textAnchor="middle" fontSize="8" fill="white">🌍</text>
      </svg>
      {/* Orbiting asteroid dot */}
      <div className={`orbit-dot ${hazardous ? 'orbit-dot-1' : 'orbit-dot-2'}`} />
    </div>
  );
}

function NeoCard({ neo }: { neo: NeoObject }) {
  const isHazardous = neo.is_potentially_hazardous;
  const distKmMillions = (neo.miss_distance_km / 1_000_000).toFixed(3);
  const distLD = (neo.miss_distance_km / 384_400).toFixed(1);
  const velKmh = (neo.relative_velocity_km_per_h / 1000).toFixed(0);
  const diamM = (neo.estimated_diameter_max_km * 1000).toFixed(0);

  return (
    <div className={`dashboard-card p-4 flex gap-4 items-center ${isHazardous ? 'hazard-card' : 'safe-card'}`}>
      <OrbitSVG hazardous={isHazardous} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${
              isHazardous
                ? 'bg-red-950/80 text-red-400 border border-red-500/40'
                : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30'
            }`}>
              {isHazardous ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 beacon-red inline-block" />
                  ⚠ Bahaya Melintas
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                  ✓ Melintas Aman
                </>
              )}
            </span>
            <h3 className="text-white font-semibold text-sm leading-tight truncate max-w-xs">
              {neo.name.replace(/[()]/g, '')}
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <p className="text-xs text-slate-500 mono-font">JARAK</p>
            <p className={`text-sm font-bold mono-font ${isHazardous ? 'text-red-400' : 'text-cyan-400'}`}>
              {distKmMillions}
            </p>
            <p className="text-xs text-slate-500">juta km ({distLD} LD)</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mono-font">KECEPATAN</p>
            <p className="text-sm font-bold text-amber-400 mono-font">{velKmh}K</p>
            <p className="text-xs text-slate-500">km/jam</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mono-font">DIAMETER</p>
            <p className="text-sm font-bold text-purple-400 mono-font">~{diamM}</p>
            <p className="text-xs text-slate-500">meter</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NeoTracker() {
  const [data, setData] = useState<NeoObject[]>([]);
  const [count, setCount] = useState(0);
  const [hazardousCount, setHazardousCount] = useState(0);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchNeo() {
      try {
        setLoading(true);
        const res = await fetch('/api/nasa/neo');
        if (!res.ok) throw new Error('Gagal memuat data asteroid');
        const json = await res.json();
        setData(json.data || []);
        setCount(json.count || 0);
        setDate(json.date || '');
        setHazardousCount((json.data || []).filter((n: NeoObject) => n.is_potentially_hazardous).length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error tidak diketahui');
      } finally {
        setLoading(false);
      }
    }
    fetchNeo();
  }, []);

  return (
    <div>
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total NEO Hari Ini', value: loading ? '...' : String(count), icon: '🛸', color: 'text-cyan-400' },
          { label: 'Berpotensi Berbahaya', value: loading ? '...' : String(hazardousCount), icon: '⚠️', color: 'text-red-400' },
          { label: 'Melintas Aman', value: loading ? '...' : String(count - hazardousCount), icon: '✅', color: 'text-emerald-400' },
          { label: 'Tanggal Data', value: date || '—', icon: '📅', color: 'text-slate-300' },
        ].map((stat) => (
          <div key={stat.label} className="dashboard-card p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className={`text-2xl font-black mono-font ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Alert banner for hazardous */}
      {!loading && hazardousCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0 float-anim">🚨</span>
          <div>
            <p className="text-red-400 font-bold text-sm">
              PERINGATAN: {hazardousCount} Asteroid Berpotensi Berbahaya Terdeteksi Hari Ini
            </p>
            <p className="text-xs text-red-300/70 mt-0.5">
              Asteroid ini dikategorikan berbahaya oleh NASA karena ukuran (&gt;140m) dan jarak lintasnya (&lt;7,5 juta km dari Bumi). Tidak ada ancaman tabrakan yang diperkirakan saat ini.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm mono-font">Mengambil data dari NASA NeoWs API...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-red-500/30 text-center py-12">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.map((neo) => (
            <NeoCard key={neo.id} neo={neo} />
          ))}
          {data.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-slate-500">Tidak ada data asteroid tersedia untuk hari ini.</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-600 mt-4 text-right mono-font">
        Sumber: NASA NeoWs API • LD = Lunar Distance (384,400 km)
      </p>
    </div>
  );
}
