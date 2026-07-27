'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AlertState {
  type: 'quake' | 'volcano' | 'clear';
  title: string;
  detail: string;
  level: 'info' | 'warn' | 'danger';
}

export default function EarthAlertBanner() {
  const [alert, setAlert] = useState<AlertState>({
    type: 'clear',
    title: 'Sistem TEWS Aktif',
    detail: 'Memantau aktivitas seismik dan vulkanik seluruh Indonesia...',
    level: 'info'
  });

  useEffect(() => {
    async function checkAlerts() {
      try {
        // Fetch USGS earthquake
        const quakeRes = await fetch('/api/earth-monitoring/usgs?scope=indonesia&limit=5');
        let latestQuake: any = null;
        if (quakeRes.ok) {
          const quakeData = await quakeRes.json();
          const quakes = quakeData.earthquakes || [];
          // Find any earthquake > 4.8 in the last 24 hours
          const recentLarge = quakes.find((q: any) => q.magnitude >= 4.8);
          if (recentLarge) {
            latestQuake = recentLarge;
          }
        }

        // Fetch MAGMA volcano alerts
        const magmaRes = await fetch('/api/earth-monitoring/magma?type=vona');
        let latestRedVona: any = null;
        if (magmaRes.ok) {
          const magmaData = await magmaRes.json();
          const vonas = magmaData.vona || [];
          const redVonas = vonas.filter((v: any) => v.current_code === 'RED');
          if (redVonas.length > 0) {
            latestRedVona = redVonas[0];
          }
        }

        if (latestRedVona) {
          setAlert({
            type: 'volcano',
            title: `ERUPSI AKTIF: Gunung ${latestRedVona.volcano_name}`,
            detail: latestRedVona.volcanic_activity_summary || 'Status Awas / Red Aviation Code.',
            level: 'danger'
          });
        } else if (latestQuake) {
          setAlert({
            type: 'quake',
            title: `GEMPA BUMI TERKINI: M ${latestQuake.magnitude.toFixed(1)}`,
            detail: `${latestQuake.place} - Kedalaman ${latestQuake.depth} km.`,
            level: 'danger'
          });
        } else {
          // No critical alerts
          setAlert({
            type: 'clear',
            title: 'Sistem TEWS Aktif',
            detail: 'Kondisi seismik & vulkanik Indonesia terpantau normal 24 jam terakhir.',
            level: 'info'
          });
        }
      } catch (err) {
        console.warn('Failed to fetch real-time TEWS alerts:', err);
      }
    }

    checkAlerts();
    const interval = setInterval(checkAlerts, 120000); // refresh every 2 mins
    return () => clearInterval(interval);
  }, []);

  const badgeColors = {
    info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    warn: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    danger: 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
  };

  const beaconColors = {
    info: 'bg-cyan-400',
    warn: 'bg-amber-400',
    danger: 'bg-red-500'
  };

  return (
    <div className={`mt-6 rounded-2xl border p-4 backdrop-blur-md transition-all duration-300 ${badgeColors[alert.level]}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            {alert.level === 'danger' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${beaconColors[alert.level]}`}></span>
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider leading-none">
              {alert.title}
            </h4>
            <p className="text-[11px] text-gray-400 mt-1 leading-snug">
              {alert.detail}
            </p>
          </div>
        </div>

        <Link
          href="/cuaca"
          className="shrink-0 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors bg-slate-950/60 border border-cyan-500/20 px-4 py-2 rounded-xl text-center"
        >
          Buka Dashboard Monitoring &rarr;
        </Link>
      </div>
    </div>
  );
}
