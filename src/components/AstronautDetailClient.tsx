"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AstronautActions from '@/components/AstronautActions';
import SafeImage from '@/components/SafeImage';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';
import type { AstronautProfile } from '@/lib/astronautData';

interface AstronautDetailClientProps {
  initialAstro: AstronautProfile;
}

function calculateDays(launchDateStr: string, returnDateStr?: string): number {
  const launchDate = new Date(launchDateStr);
  const endDate = returnDateStr ? new Date(returnDateStr) : new Date();
  const diffTime = Math.abs(endDate.getTime() - launchDate.getTime());
  const diffDays = Math.ceil(diffTime / 86400000);
  return isNaN(diffDays) ? 0 : diffDays;
}

function statusCopy(astro: AstronautProfile, t: any) {
  if (astro.status === 'active') return { label: t.astroStatusActive || 'Sedang Bertugas', accent: 'text-green-600 dark:text-green-300', badge: 'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-300 border-green-200 dark:border-green-500/20' };
  if (astro.status === 'upcoming') return { label: t.astroStatusUpcoming || 'Misi Mendatang', accent: 'text-amber-600 dark:text-amber-300', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-850 dark:text-amber-300 border-amber-200 dark:border-amber-500/20' };
  return { label: t.astroStatusReturned || 'Sudah Kembali', accent: 'text-cyan-600 dark:text-cyan-300', badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-850 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/20' };
}

export default function AstronautDetailClient({ initialAstro }: AstronautDetailClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];

  const [astro, setAstro] = useState<AstronautProfile>(initialAstro);
  const [currentBiography, setCurrentBiography] = useState(initialAstro.biography);
  const [currentRole, setCurrentRole] = useState(initialAstro.role);
  const [currentCountry, setCurrentCountry] = useState(initialAstro.country);
  const [loading, setLoading] = useState(false);

  // Lokasi penyimpanan cache hasil translate di client-side
  const [translationsCache, setTranslationsCache] = useState<Record<string, { biography: string; role: string; country: string }>>({});

  useEffect(() => {
    if (language === 'id') {
      setCurrentBiography(initialAstro.biography);
      setCurrentRole(initialAstro.role);
      setCurrentCountry(initialAstro.country);
      return;
    }

    // Periksa dari cache client-side terlebih dahulu
    if (translationsCache[language]) {
      const cached = translationsCache[language];
      setCurrentBiography(cached.biography);
      setCurrentRole(cached.role);
      setCurrentCountry(cached.country);
      return;
    }

    // Jika belum di-cache, fetch on-demand secara aman dari server API
    setLoading(true);
    const query = new URLSearchParams({
      slug: initialAstro.id,
      locale: language,
      biography: initialAstro.biography,
      role: initialAstro.role,
      country: initialAstro.country
    });

    fetch(`/api/astronot/translate?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.biography && data.role && data.country) {
          setCurrentBiography(data.biography);
          setCurrentRole(data.role);
          setCurrentCountry(data.country);

          // Simpan ke cache client
          setTranslationsCache(prev => ({
            ...prev,
            [language]: {
              biography: data.biography,
              role: data.role,
              country: data.country
            }
          }));
        }
      })
      .catch(err => {
        console.error("Gagal menterjemahkan profil astronot:", err);
        setCurrentBiography(initialAstro.biography);
        setCurrentRole(initialAstro.role);
        setCurrentCountry(initialAstro.country);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [language, initialAstro.id]);

  const daysInMission = calculateDays(astro.launchDate, astro.status === 'returned' ? astro.returnDate : undefined);
  const status = statusCopy(astro, t);

  const activeAstro: AstronautProfile = {
    ...astro,
    biography: currentBiography,
    role: currentRole,
    country: currentCountry
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        <Link
          href={`/astronot?status=${astro.status}`}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden"
        >
          {t.backToAstronaut || '← Kembali ke Database Astronot'}
        </Link>

        <article id="printable-astronaut-content" className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-purple-950/20 rounded-3xl p-6 md:p-10 shadow-2xl transition-all print:border-0 print:bg-transparent print:p-0 print:shadow-none relative">
          
          {loading && (
            <span className="absolute right-6 top-6 text-xs text-purple-500 animate-pulse font-bold print:hidden">🔄 Translating...</span>
          )}

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
            <div className="w-48 h-60 rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex-shrink-0">
              <SafeImage
                src={astro.imageUrl}
                alt={astro.name}
                className="w-full h-full object-cover"
                fallback="https://placehold.co/400x500/020617/a855f7?text=Astronot"
              />
            </div>

            <div className="flex-grow text-center md:text-left space-y-3">
              <span className={`${status.badge} border text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider`}>
                {status.label}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 dark:text-white leading-tight">
                {astro.name}
              </h1>
              <p className={`font-semibold text-lg ${status.accent}`}>{currentRole}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{astro.mission || `Misi ${astro.craft}`}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 block uppercase font-bold tracking-wider">{t.astroCountry || 'Asal Negara'}</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-gray-200 mt-1 block">{currentCountry}</span>
                </div>
                <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 block uppercase font-bold tracking-wider">{t.astroAgency || 'Agensi'}</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-gray-200 mt-1 block">{astro.agency}</span>
                </div>
                <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 block uppercase font-bold tracking-wider">{t.astroMissionDuration || 'Durasi Misi'}</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                    {astro.status === 'upcoming' ? (t.astroUpcomingText || 'Terjadwal') : `${daysInMission} ${t.daysUnit || 'Hari'}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <AstronautActions astronaut={activeAstro} />

          <div className="space-y-6 text-left border-t border-slate-200 dark:border-purple-950/10 pt-8 mt-6">
            <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 border-b border-slate-200 dark:border-purple-950/10 pb-2">{t.astroBioTitle || 'Biografi & Misi'}</h2>
            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-gray-300 leading-relaxed text-sm md:text-base whitespace-pre-line">
              {currentBiography}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
