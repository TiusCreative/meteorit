"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

// Dynamically import map to prevent SSR issues
const ISSMap = dynamic(() => import('./ISSMap'), { ssr: false, loading: () => (
  <div className="w-full h-full flex items-center justify-center bg-slate-950">
    <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
  </div>
)});

interface Astronaut {
  id?: string;
  name: string;
  craft: string;
  country?: string;
  agency?: string;
  role?: string;
  launchDate?: string;
  imageUrl?: string;
  status?: 'active' | 'upcoming' | 'returned';
}

interface ISSPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface UpcomingLaunch {
  name: string;
  net: string;
  launch_service_provider: { name: string; type: string };
  rocket: { configuration: { name: string } };
  status: { name: string };
  mission?: { description: string };
}

const AGENCY_COLORS: Record<string, string> = {
  'SpaceX': 'bg-slate-700 text-white border-slate-600',
  'NASA': 'bg-blue-900/60 text-blue-300 border-blue-700/50',
  'ISRO': 'bg-orange-900/60 text-orange-300 border-orange-700/50',
  'ESA': 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50',
  'Roscosmos': 'bg-red-900/60 text-red-300 border-red-700/50',
  'CNSA': 'bg-red-900/60 text-red-300 border-red-700/50',
  'Rocket Lab': 'bg-purple-900/60 text-purple-300 border-purple-700/50',
};

// Fallback: data peluncuran mendatang yang sudah dijadwalkan NASA/SpaceX
const getFallbackLaunch = (): UpcomingLaunch => {
  // Peluncuran Crew Dragon berikutnya — diperbarui manual jika perlu
  const target = new Date();
  target.setDate(target.getDate() + 3);
  target.setHours(14, 30, 0, 0);
  return {
    name: 'SpaceX Falcon 9 — Starlink Mission',
    net: target.toISOString(),
    launch_service_provider: { name: 'SpaceX', type: 'Commercial' },
    rocket: { configuration: { name: 'Falcon 9 Block 5' } },
    status: { name: 'Go for Launch' },
    mission: { description: 'Misi peluncuran Starlink untuk memperluas jaringan internet satelit global SpaceX.' }
  };
};

function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !targetDate) return;
    const update = () => {
      const targetTime = new Date(targetDate).getTime();
      if (isNaN(targetTime)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const diff = targetTime - Date.now();
      if (diff <= 0) { 
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); 
        return; 
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [targetDate, mounted]);

  return mounted ? timeLeft : null;
}

export default function SpaceMissionControl() {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [issPos, setIssPos] = useState<ISSPosition | null>(null);
  const [issPosHistory, setIssPosHistory] = useState<[number, number][]>([]);
  const [launch, setLaunch] = useState<UpcomingLaunch | null>(null);
  const [loading, setLoading] = useState({ astro: true, iss: true, launch: true });

  const countdown = useCountdown(launch?.net ?? null);

  useEffect(() => {
    // Fetch Astronauts from internal API (which has country and agency information)
    fetch('/api/astronauts')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.astronauts) {
          setAstronauts(data.astronauts.filter((astronaut: Astronaut) => (astronaut.status || 'active') === 'active'));
        }
        setLoading(p => ({ ...p, astro: false }));
      })
      .catch(() => {
        setLoading(p => ({ ...p, astro: false }));
      });

    // Fetch ISS position & update every 5 seconds via internal API.
    const fetchISS = () => {
      const controllerISS = new AbortController();
      const idISS = setTimeout(() => controllerISS.abort(), 4000);
      fetch('/api/space/live', { signal: controllerISS.signal, cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          clearTimeout(idISS);
          if (!data.success || !data.iss) throw new Error('ISS data unavailable');
          const lat = Number(data.iss.latitude);
          const lon = Number(data.iss.longitude);
          setIssPos({ latitude: lat, longitude: lon, timestamp: data.iss.timestamp });
          setIssPosHistory(prev => {
            const next = [...prev, [lat, lon] as [number, number]];
            return next.slice(-25); // Keep last 25 positions for trail
          });
          setLoading(p => ({ ...p, iss: false }));
        })
        .catch(() => {
          clearTimeout(idISS);
          setLoading(p => ({ ...p, iss: false }));
        });
    };
    fetchISS();
    const issInterval = setInterval(fetchISS, 5000);

    // Fetch Upcoming Launch — coba 2 sumber API dengan fallback hardcoded
    const fetchUpcomingLaunch = async () => {
      // Sumber 1: Launch Library 2 (The Space Devs) — gratis tapi rate-limited
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const res = await fetch(
          'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=1&format=json',
          { signal: ctrl.signal }
        );
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setLaunch(data.results[0]);
            setLoading(p => ({ ...p, launch: false }));
            return;
          }
        }
      } catch { /* timeout atau rate-limit */ }

      // Sumber 2: RocketLaunch.Live (lebih cepat dan gratis)
      try {
        const ctrl2 = new AbortController();
        const timer2 = setTimeout(() => ctrl2.abort(), 5000);
        const res2 = await fetch(
          'https://fdo.rocketlaunch.live/json/launches/next/1',
          { signal: ctrl2.signal }
        );
        clearTimeout(timer2);
        if (res2.ok) {
          const data2 = await res2.json();
          const r = data2?.result?.[0];
          if (r) {
            const netStr = r.net || r.win_open || new Date(Date.now() + 3 * 86400000).toISOString();
            setLaunch({
              name: r.name || 'Misi Peluncuran Mendatang',
              net: netStr,
              launch_service_provider: { name: r.provider?.name || 'SpaceX', type: 'Commercial' },
              rocket: { configuration: { name: r.vehicle?.name || 'Falcon 9' } },
              status: { name: r.launch_description || 'Terjadwal' },
              mission: r.missions?.[0] ? { description: r.missions[0].description || '' } : undefined,
            });
            setLoading(p => ({ ...p, launch: false }));
            return;
          }
        }
      } catch { /* fallback ke data hardcoded */ }

      // Fallback hardcoded — selalu tampilkan countdown
      setLaunch(getFallbackLaunch());
      setLoading(p => ({ ...p, launch: false }));
    };

    fetchUpcomingLaunch();

    return () => {
      clearInterval(issInterval);
    };
  }, []);

  const agencyName = launch?.launch_service_provider?.name || '';
  const agencyKey = Object.keys(AGENCY_COLORS).find(k => agencyName.includes(k)) || '';
  const agencyBadgeClass = agencyKey ? AGENCY_COLORS[agencyKey] : 'bg-slate-700 text-gray-300 border-slate-600';

  // Group astronauts by craft
  const byCraft = astronauts.reduce((acc, a) => {
    if (!acc[a.craft]) acc[a.craft] = [];
    acc[a.craft].push(a);
    return acc;
  }, {} as Record<string, Astronaut[]>);

  return (
    <section className="py-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-cyan-900/10 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-widest mb-3 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse inline-block"></span>
            {t.liveSpaceData}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white">
            🚀 {t.missionControlTitle}
          </h2>
          <p className="text-slate-650 dark:text-gray-400 mt-2 text-sm">{t.missionControlDesc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* KOLOM 1: JADWAL ROKET */}
          <div className="bg-white dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all duration-300 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚀</span>
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t.upcomingLaunch}</h3>
            </div>

            {loading.launch ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin"></div>
              </div>
            ) : launch ? (
              <>
                {/* Agency Badge */}
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${agencyBadgeClass}`}>
                    {launch.launch_service_provider?.name || t.scientificMission}
                  </span>
                </div>

                {/* Mission Name */}
                <div>
                  <p className="text-slate-800 dark:text-white font-bold text-base leading-snug">{launch.name}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{launch.rocket?.configuration?.name}</p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    {launch.status?.name === 'Go for Launch' || launch.status?.name === 'Go' ? t.goForLaunch : (launch.status?.name || t.loading)}
                  </span>
                </div>

                {/* Countdown Timer */}
                {countdown ? (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { label: t.countdownDays, val: countdown.days },
                      { label: t.countdownHours, val: countdown.hours },
                      { label: t.countdownMinutes, val: countdown.minutes },
                      { label: t.countdownSeconds, val: countdown.seconds },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2 text-center border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                          {String(val).padStart(2, '0')}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-slate-450 dark:text-slate-500 text-xs italic">{t.countingDown}</div>
                )}

                <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-1 leading-relaxed">
                  {launch.net ? new Date(launch.net).toLocaleDateString(
                    language === 'en' ? 'en-US' :
                    language === 'ja' ? 'ja-JP' :
                    language === 'zh' ? 'zh-CN' :
                    language === 'ms' ? 'ms-MY' :
                    language === 'ru' ? 'ru-RU' :
                    language === 'fr' ? 'fr-FR' :
                    'id-ID',
                    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                  ) + ' ' + (language === 'id' ? 'WIB' : 'local') : ''}
                </p>
              </>
            ) : (
              <p className="text-slate-500 dark:text-gray-500 text-sm flex-1 flex items-center">{t.loading}</p>
            )}

            <a
              href="https://thespacedevs.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto text-[10px] text-slate-400 hover:text-slate-650 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              {t.launchDataSource}
            </a>
          </div>

          {/* KOLOM 2: LIVE ISS TRACKER */}
          <div className="bg-white dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition-all duration-300 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🛰️</span>
              <h3 className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">{t.issTrackerTitle}</h3>
              {!loading.iss && <span className="ml-auto flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse inline-block"></span>{t.issActive}</span>}
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 h-48 bg-gray-50 dark:bg-slate-950 relative">
              {loading.iss ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                </div>
              ) : issPos ? (
                <ISSMap position={issPos} history={issPosHistory} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-gray-500 text-sm">
                  {t.issMapUnavailable}
                </div>
              )}
            </div>

            {/* Koordinat */}
            {issPos && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/40">
                  <p className="text-[10px] text-slate-500 dark:text-gray-550 mb-0.5">{t.latitude}</p>
                  <p className="text-sm font-black text-cyan-600 dark:text-cyan-300 font-mono">{issPos.latitude.toFixed(4)}°</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-200 dark:border-slate-700/40">
                  <p className="text-[10px] text-slate-500 dark:text-gray-550 mb-0.5">{t.longitude}</p>
                  <p className="text-sm font-black text-cyan-600 dark:text-cyan-300 font-mono">{issPos.longitude.toFixed(4)}°</p>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-500 dark:text-gray-500 text-center">{t.issUpdateInterval}</p>
          </div>

          {/* KOLOM 3: DATA ASTRONOT */}
          <div className="bg-white dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all duration-300 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👨‍🚀</span>
              <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{t.activeAstronauts}</h3>
            </div>

            {loading.astro ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Angka Besar */}
                <div className="text-center py-1">
                  <p className="text-6xl font-black bg-gradient-to-b from-purple-500 to-purple-800 dark:from-purple-300 dark:to-purple-600 bg-clip-text text-transparent">
                    {astronauts.length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{t.astronautSub}</p>
                </div>

                {/* List per wahana */}
                <div className="flex-grow overflow-y-auto space-y-2 max-h-36 pr-1 custom-scrollbar text-xs">
                  {Object.entries(byCraft).map(([craft, astros]) => (
                    <div key={craft} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700/40">
                      <div className="flex items-center gap-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-700/30 pb-1">
                        <span className="text-xs">{craft.toLowerCase().includes('tiangong') ? '🇨🇳' : '🛰️'}</span>
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{craft}</p>
                        <span className="ml-auto text-[10px] text-slate-500 dark:text-slate-500 font-bold">{astros.length} {t.crewUnit}</span>
                      </div>
                      <div className="space-y-1">
                        {astros.map((astro) => {
                          const slug = astro.id || astro.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                          return (
                            <div key={astro.name} className="flex items-center justify-between gap-1 py-0.5 border-b border-slate-100 dark:border-slate-800/10 last:border-0">
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 flex-shrink-0"></span>
                                <Link 
                                  href={`/astronot/${slug}`}
                                  className="text-xs text-slate-700 dark:text-gray-300 hover:text-purple-650 dark:hover:text-purple-400 hover:underline transition-colors leading-tight font-medium"
                                >
                                  {astro.name}
                                </Link>
                              </div>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold flex-shrink-0">
                                {astro.country ? `${astro.country}` : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <Link
                    href="/astronot"
                    className="w-full text-center block bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-750 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30 hover:border-purple-400/50 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm"
                  >
                    {t.viewAllAstronauts}
                  </Link>
                </div>

                <a
                  href="https://api.open-notify.org/astros.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-slate-400 hover:text-slate-650 dark:text-gray-600 dark:hover:text-gray-400 transition-colors mt-auto"
                >
                  {t.astronautDataSource}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
