"use client";

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

const HAZARD_COLORS = {
  true: 'border-red-500/40 bg-red-950/20',
  false: 'border-slate-700/40 bg-slate-900/40',
};

export default function NeoWsSection() {
  const [neoData, setNeoData] = useState<NeoObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNeo = async () => {
      try {
        const res = await fetch('/api/nasa/neo?days=7');
        if (!res.ok) throw new Error('NEO API error');
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          // Hanya tampilkan 8 terdekat
          setNeoData(json.data.slice(0, 8));
        } else {
          throw new Error('Format data tidak sesuai');
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchNeo();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Memuat data NASA NEO minggu ini...</p>
      </div>
    );
  }

  if (error || neoData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-5xl">☄️</span>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          Data NEO tidak tersedia saat ini. NASA mungkin sedang maintenance. Coba lagi nanti.
        </p>
        <a
          href="https://cneos.jpl.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-400 hover:text-cyan-300 underline"
        >
          Lihat di NASA JPL Center for NEO Studies →
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Komet & Asteroid Melintas Minggu Ini</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {neoData.length} objek terdekat dari NASA Near Earth Object Watch (NeoWs)
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
          7 Hari ke Depan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {neoData.map((neo) => {
          const distKm = neo.miss_distance_km;
          const distLunar = neo.miss_distance_km / 384400;
          const speedKmh = neo.relative_velocity_km_per_h;
          const diamMin = Math.round(neo.estimated_diameter_min_km * 1000);
          const diamMax = Math.round(neo.estimated_diameter_max_km * 1000);
          const isHazardous = neo.is_potentially_hazardous;

          return (
            <div
              key={neo.id}
              className={`rounded-xl p-4 border ${HAZARD_COLORS[String(isHazardous) as 'true' | 'false']} hover:scale-[1.01] transition-all duration-200`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{isHazardous ? '⚠️' : '☄️'}</span>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">
                      {neo.name.replace(/[()]/g, '').trim()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {neo.close_approach_date
                        ? new Date(neo.close_approach_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                </div>
                {isHazardous && (
                  <span className="text-xs bg-red-900/70 text-red-400 border border-red-700/50 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                    Berpotensi Berbahaya
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Jarak Aman</p>
                  <p className="text-xs font-bold text-cyan-300">
                    {distLunar.toFixed(1)} LD
                  </p>
                  <p className="text-xs text-gray-600">
                    {(distKm / 1000000).toFixed(2)} jt km
                  </p>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Ukuran Est.</p>
                  <p className="text-xs font-bold text-amber-300">
                    {diamMin}–{diamMax}m
                  </p>
                  <p className="text-xs text-gray-600">diameter</p>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Kecepatan</p>
                  <p className="text-xs font-bold text-green-300">
                    {(speedKmh / 1000).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-600">ribu km/jam</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 text-center mt-6">
        LD = Lunar Distance (1 LD ≈ 384.400 km dari Bumi) · Data dari{' '}
        <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-400">
          NASA NeoWs API
        </a>
      </p>
    </div>
  );
}
