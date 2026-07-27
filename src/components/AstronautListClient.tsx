"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';
import type { AstronautProfile, AstronautStatus } from '@/lib/astronautData';

interface AstronautListClientProps {
  initialDataset: {
    astronauts: AstronautProfile[];
    summary: {
      total: number;
      active: number;
      upcoming: number;
      returned: number;
    };
    updatedAt: string;
  };
  translationsMap: Record<string, Record<string, { biography?: string; role?: string; country?: string }>>;
  defaultTab?: AstronautStatus;
}

function calculateDays(launchDateStr: string, returnDateStr?: string): number {
  const launchDate = new Date(launchDateStr);
  const endDate = returnDateStr ? new Date(returnDateStr) : new Date();
  const diffTime = Math.abs(endDate.getTime() - launchDate.getTime());
  const diffDays = Math.ceil(diffTime / 86400000);
  return isNaN(diffDays) ? 0 : diffDays;
}

const roleDict: Record<string, Record<string, string>> = {
  'Commander': { en: 'Commander', ms: 'Komander', zh: '指令长', ja: 'コマンダー', id: 'Komandan' },
  'Flight Engineer': { en: 'Flight Engineer', ms: 'Jurutera Penerbangan', zh: '飞行工程师', ja: 'フライトエンジニア', id: 'Insinyur Penerbangan' },
  'Mission Specialist': { en: 'Mission Specialist', ms: 'Pakar Misi', zh: '任务专家', ja: 'ミッションスペシャリスト', id: 'Spesialis Misi' },
  'Pilot': { en: 'Pilot', ms: 'Juruterbang', zh: '飞行员', ja: 'パイロット', id: 'Pilot' },
};

const countryDict: Record<string, Record<string, string>> = {
  'Amerika Serikat': { en: 'United States', ms: 'Amerika Syarikat', zh: '美国', ja: 'アメリカ合衆国', id: 'Amerika Serikat' },
  'Rusia': { en: 'Russia', ms: 'Rusia', zh: '俄罗斯', ja: 'ロシア', id: 'Rusia' },
  'Jepang': { en: 'Japan', ms: 'Jepun', zh: '日本', ja: '日本', id: 'Jepang' },
  'Denmark': { en: 'Denmark', ms: 'Denmark', zh: '丹麦', ja: 'デンマーク', id: 'Denmark' },
  'Tiongkok': { en: 'China', ms: 'China', zh: '中国', ja: '中国', id: 'Tiongkok' },
};

function AstronautCard({ astro, t, language }: { astro: AstronautProfile; t: Record<string, string>; language: string }) {
  const days = calculateDays(astro.launchDate, astro.status === 'returned' ? astro.returnDate : undefined);
  const statusLbl =
    astro.status === 'active'
      ? (t.astroStatusActive || 'Sedang Bertugas')
      : astro.status === 'upcoming'
        ? (t.astroStatusUpcoming || 'Misi Mendatang')
        : (t.astroStatusReturned || 'Sudah Kembali');

  const displayRole = roleDict[astro.role]?.[language] || astro.role;
  const displayCountry = countryDict[astro.country]?.[language] || astro.country;

  return (
    <div className="astro-card bg-slate-50 dark:bg-slate-900/45 border border-slate-200 dark:border-purple-950/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-lg transition-all duration-300">
      <div className="relative aspect-[4/5] bg-slate-900 border-b border-slate-200 dark:border-purple-950/20 overflow-hidden">
        <SafeImage
          src={astro.imageUrl}
          alt={astro.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          fallback="https://placehold.co/400x500/020617/a855f7?text=Astronot"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-slate-950/90 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
            {statusLbl}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="bg-slate-950/90 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase line-clamp-1">
            {displayRole}
          </span>
          <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
            {astro.status === 'upcoming'
              ? (t.astroUpcomingText || 'Terjadwal')
              : `${days} ${t.daysUnit || 'Hari'}`}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
        <div>
          <h3 className="text-slate-800 dark:text-white font-bold text-base hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-1">
            {astro.name}
          </h3>
          <p className="text-slate-500 dark:text-gray-500 text-xs mt-1">
            {astro.agency} &bull; {displayCountry}
          </p>
          <p className="text-slate-500 dark:text-gray-500 text-xs mt-1">
            {astro.mission || `${t.missionLabel || 'Misi'} ${astro.craft}`}
          </p>
          <p className="text-slate-650 dark:text-slate-400 text-xs leading-relaxed mt-3 line-clamp-3">
            {astro.biography}
          </p>
        </div>

        <Link
          href={`/astronot/${astro.id}`}
          className="w-full text-center block bg-purple-100 dark:bg-purple-950/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30 hover:border-purple-400 dark:hover:border-purple-600/50 py-2.5 rounded-xl text-xs font-bold transition-all duration-300"
        >
          {t.readFullBio || 'Lihat Biografi Lengkap'} &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function AstronautListClient({ initialDataset, translationsMap, defaultTab = 'active' }: AstronautListClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [activeTab, setActiveTab] = useState<AstronautStatus>(defaultTab);
  const [localTranslations, setLocalTranslations] = useState<typeof translationsMap>(translationsMap);

  // Sync initial translationsMap prop
  useEffect(() => {
    setLocalTranslations(translationsMap);
  }, [translationsMap]);

  const TABS = useMemo(() => [
    {
      key: 'active' as AstronautStatus,
      label: t.astroTabActive || 'Sedang di Antariksa',
      title: t.astroTabActiveTitle || 'Kru yang Sedang Bertugas',
      description: t.astroTabActiveDesc || 'Astronot, kosmonot, dan taikonaut yang sedang menjalankan misi di orbit Bumi.'
    },
    {
      key: 'upcoming' as AstronautStatus,
      label: t.astroTabUpcoming || 'Misi Mendatang',
      title: t.astroTabUpcomingTitle || 'Kru yang Akan Meluncur',
      description: t.astroTabUpcomingDesc || 'Nama-nama kru yang sudah masuk jadwal misi berikutnya menuju stasiun antariksa atau program eksplorasi.'
    },
    {
      key: 'returned' as AstronautStatus,
      label: t.astroTabReturned || 'Pahlawan Antariksa',
      title: t.astroTabReturnedTitle || 'Alumni dan Kru yang Sudah Kembali',
      description: t.astroTabReturnedDesc || 'Arsip kru yang pernah bertugas di ISS, Tiangong, atau misi orbit lain dan sudah kembali ke Bumi.'
    }
  ], [t]);

  const currentTab = useMemo(() => TABS.find((tab) => tab.key === activeTab) || TABS[0], [TABS, activeTab]);

  // Background on-demand translation trigger loop for missing profiles
  useEffect(() => {
    if (language === 'id') return;

    const visibleAstronauts = initialDataset.astronauts.filter((astro) => astro.status === activeTab);
    const missingTranslations = visibleAstronauts.filter(
      (astro) => !localTranslations[astro.id]?.[language]
    );

    if (missingTranslations.length === 0) return;

    let cancelled = false;

    async function translateAll() {
      // Translate sequentially in the background
      for (const astro of missingTranslations) {
        if (cancelled) break;
        try {
          const query = new URLSearchParams({
            slug: astro.id,
            locale: language,
            biography: astro.biography,
            role: astro.role,
            country: astro.country
          });
          const res = await fetch(`/api/astronot/translate?${query.toString()}`);
          if (res.ok) {
            const data = await res.json();
            if (data && !data.error && !cancelled) {
              setLocalTranslations(prev => ({
                ...prev,
                [astro.id]: {
                  ...(prev[astro.id] || {}),
                  [language]: {
                    biography: data.biography,
                    role: data.role,
                    country: data.country
                  }
                }
              }));
            }
          }
        } catch (err) {
          console.warn(`[Background Translate] Failed translating ${astro.id}:`, err);
        }
        // Wait 300ms between calls to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    translateAll();

    return () => {
      cancelled = true;
    };
  }, [activeTab, language, initialDataset.astronauts, localTranslations]);

  // Melokalisasi daftar astronot secara dinamis di client-side
  const localizedAstronauts = useMemo(() => {
    const list = initialDataset.astronauts.filter((astro) => astro.status === activeTab);
    if (language === 'id') return list;

    return list.map((astro) => {
      const trans = localTranslations[astro.id]?.[language];
      if (trans) {
        return {
          ...astro,
          biography: trans.biography || astro.biography,
          role: trans.role || astro.role,
          country: trans.country || astro.country
        };
      }
      return astro;
    });
  }, [initialDataset.astronauts, activeTab, language, localTranslations]);

  const localeStr = language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'id-ID';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .astro-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .astro-card:hover {
          box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.2);
          transform: translateY(-3px);
        }
      ` }} />

      <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 text-xs font-semibold text-purple-600 dark:text-purple-400 tracking-wider uppercase">
              {t.astroLiveArchive || 'Live & arsip misi'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-500 via-pink-600 to-amber-500 bg-clip-text text-transparent">
              {t.astroPageTitle || 'Database Manusia di Antariksa'}
            </h1>
            <div className="text-slate-650 dark:text-slate-400 text-sm md:text-base max-w-3xl mx-auto leading-relaxed space-y-4">
              <p>{t.astroPageDesc1 || 'Halaman ini merangkum profil astronot, kosmonot, dan taikonaut dalam tiga kelompok.'}</p>
              <p>{t.astroPageDesc2 || 'Kru aktif biasanya tinggal di ISS atau Tiangong selama berbulan-bulan untuk menjalankan eksperimen mikrogravitasi.'}</p>
            </div>
          </div>

          <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 transition-colors">
              <p className="text-xs uppercase tracking-wider text-slate-450 dark:text-slate-500 font-bold">{t.astroTotalProfiles || 'Total Profil'}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{initialDataset.summary.total}</p>
            </div>
            <div className="rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-950/20 p-4 transition-colors">
              <p className="text-xs uppercase tracking-wider text-purple-600 dark:text-purple-300 font-bold">{t.astroActive || 'Aktif'}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{initialDataset.summary.active}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 transition-colors">
              <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-300 font-bold">{t.astroUpcomingStat || 'Mendatang'}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{initialDataset.summary.upcoming}</p>
            </div>
            <div className="rounded-2xl border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50 dark:bg-cyan-950/20 p-4 transition-colors">
              <p className="text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-300 font-bold">{t.astroAlumni || 'Alumni'}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{initialDataset.summary.returned}</p>
            </div>
          </div>

          <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold border transition-all ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-50 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white">{currentTab.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">{currentTab.description}</p>
              </div>
              <p className="text-xs text-slate-550 dark:text-slate-500">
                {t.updatedAt || 'Diperbarui'}: {new Date(initialDataset.updatedAt).toLocaleString(localeStr)}
              </p>
            </div>

            {localizedAstronauts.length === 0 ? (
              <div className="py-20 text-center text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/30">
                {t.astroNoData || 'Belum ada data untuk kategori ini.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {localizedAstronauts.map((astro) => (
                  <AstronautCard key={astro.id} astro={astro} t={t} language={language} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
