"use client";

import { useEffect, useState } from 'react';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

export default function StatsBanner() {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [asteroidCount, setAsteroidCount] = useState<number | string>(t.loading);
  const [astronautCount, setAstronautCount] = useState<number | string>(t.loading);
  const [ensoStatus, setEnsoStatus] = useState<string>('Memuat...');

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

    async function fetchEnsoStatus() {
      try {
        const res = await fetch(`/api/cuaca/enso?t=${Date.now()}`);
        if (res.ok) {
          const payload = await res.json();
          if (payload.success && payload.data) {
            setEnsoStatus(payload.data.status);
          } else {
            setEnsoStatus('Netral');
          }
        } else {
          setEnsoStatus('Netral');
        }
      } catch {
        setEnsoStatus('Netral');
      }
    }
    fetchEnsoStatus();
  }, []);

  return (
    <section className="bg-white border-y border-slate-200 py-6 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-around gap-6 text-center">
          <div className="flex items-center gap-3">
            <span className="text-amber-500 text-3xl animate-pulse">🌠</span>
            <div>
              <p className="text-xl font-extrabold text-slate-900">45,000+</p>
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">{t.statsMeteorites}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-500 text-3xl animate-pulse">👥</span>
            <div>
              <p className="text-xl font-extrabold text-slate-900">2,500+</p>
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">{t.statsCollectors}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-500 text-3xl animate-pulse">🛰️</span>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{asteroidCount} {t.objectUnit}</p>
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">{t.statsAsteroids}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-500 text-3xl animate-pulse">👨‍🚀</span>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{astronautCount} {t.crewUnit}</p>
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">{t.statsAstronauts}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-500 text-3xl animate-pulse">🌊</span>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{ensoStatus}</p>
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Status ENSO Iklim</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

