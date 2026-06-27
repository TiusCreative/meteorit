"use client";

import { useEffect, useState } from 'react';

export default function StatsBanner() {
  const [asteroidCount, setAsteroidCount] = useState<number | string>('Loading...');
  const [astronautCount, setAstronautCount] = useState<number | string>('Loading...');

  useEffect(() => {
    async function fetchAsteroidStats() {
      try {
        const res = await fetch(`/api/nasa/stats?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setAsteroidCount(data.count !== undefined ? data.count : 2);
        } else {
          setAsteroidCount(2); // Fallback
        }
      } catch (error) {
        setAsteroidCount(2); // Fallback on network issues
      }
    }
    fetchAsteroidStats();

    async function fetchAstronautStats() {
      try {
        const res = await fetch(`/api/astronauts?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setAstronautCount(data.summary?.active ?? data.astronauts?.filter((item: any) => item.status === 'active').length ?? 0);
        } else {
          setAstronautCount(0);
        }
      } catch {
        setAstronautCount(0);
      }
    }
    fetchAstronautStats();
  }, []);

  return (
    <section className="bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 border-y border-cyan-900/20 py-5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-around gap-6 text-center">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-3xl animate-pulse">🌠</span>
            <div>
              <p className="text-xl font-extrabold text-cyan-400">45,000+</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Meteorit Terdata Dunia</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-3xl animate-pulse">👥</span>
            <div>
              <p className="text-xl font-extrabold text-cyan-400">2,500+</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Kolektor Indonesia</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-3xl animate-pulse">🛰️</span>
            <div>
              <p className="text-xl font-extrabold text-cyan-400">{asteroidCount} Objek</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Asteroid Dekat Bumi Hari Ini</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-3xl animate-pulse">👨‍🚀</span>
            <div>
              <p className="text-xl font-extrabold text-cyan-400">{astronautCount} Kru</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Astronot di Orbit Saat Ini</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
