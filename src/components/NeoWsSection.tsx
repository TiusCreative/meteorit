"use client";

import { useEffect, useState } from 'react';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

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

const localeMap: Record<string, string> = {
  id: 'id-ID',
  en: 'en-US',
  ms: 'ms-MY',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ru: 'ru-RU',
  fr: 'fr-FR',
};

export default function NeoWsSection() {
  const language = useSiteLanguage();
  const t = landingText[language];
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

  const dateLocale = localeMap[language] || 'id-ID';

  // i18n labels for NeoWs section
  const neoLabels = {
    id: {
      title: 'Komet & Asteroid Melintas Minggu Ini',
      subtitle: (n: number) => `${n} objek terdekat dari NASA Near Earth Object Watch (NeoWs)`,
      nextDays: '7 Hari ke Depan',
      safe: 'Jarak Aman',
      size: 'Ukuran Est.',
      speed: 'Kecepatan',
      hazardous: 'Berpotensi Berbahaya',
      ldNote: 'LD = Lunar Distance (1 LD ≈ 384.400 km dari Bumi) · Data dari',
      loading: 'Memuat data NASA NEO minggu ini...',
      error: 'Data NEO tidak tersedia saat ini. NASA mungkin sedang maintenance. Coba lagi nanti.',
      errorLink: 'Lihat di NASA JPL Center for NEO Studies →',
    },
    en: {
      title: 'Comets & Asteroids Passing This Week',
      subtitle: (n: number) => `${n} closest objects from NASA Near Earth Object Watch (NeoWs)`,
      nextDays: 'Next 7 Days',
      safe: 'Safe Distance',
      size: 'Est. Size',
      speed: 'Speed',
      hazardous: 'Potentially Hazardous',
      ldNote: 'LD = Lunar Distance (1 LD ≈ 384,400 km from Earth) · Data from',
      loading: 'Loading NASA NEO data for this week...',
      error: 'NEO data unavailable right now. NASA may be under maintenance. Try again later.',
      errorLink: 'View at NASA JPL Center for NEO Studies →',
    },
    ms: {
      title: 'Komet & Asteroid Melintas Minggu Ini',
      subtitle: (n: number) => `${n} objek terdekat dari NASA Near Earth Object Watch (NeoWs)`,
      nextDays: '7 Hari ke Hadapan',
      safe: 'Jarak Selamat',
      size: 'Anggaran Saiz',
      speed: 'Kelajuan',
      hazardous: 'Berpotensi Berbahaya',
      ldNote: 'LD = Lunar Distance (1 LD ≈ 384,400 km dari Bumi) · Data dari',
      loading: 'Memuat data NASA NEO minggu ini...',
      error: 'Data NEO tidak tersedia sekarang. NASA mungkin sedang penyelenggaraan. Cuba lagi kemudian.',
      errorLink: 'Lihat di NASA JPL Center for NEO Studies →',
    },
    zh: {
      title: '本周经过的彗星和小行星',
      subtitle: (n: number) => `来自 NASA 近地天体监测 (NeoWs) 的 ${n} 个最近天体`,
      nextDays: '未来7天',
      safe: '安全距离',
      size: '估计尺寸',
      speed: '速度',
      hazardous: '潜在威胁',
      ldNote: 'LD = 月球距离 (1 LD ≈ 384,400 km) · 数据来自',
      loading: '正在加载本周 NASA NEO 数据...',
      error: 'NEO 数据目前不可用。NASA 可能正在维护中，请稍后再试。',
      errorLink: '在 NASA JPL 近地天体研究中心查看 →',
    },
    ja: {
      title: '今週接近する彗星と小惑星',
      subtitle: (n: number) => `NASA 地球近傍天体監視 (NeoWs) から ${n} 個の最接近天体`,
      nextDays: '今後7日間',
      safe: '安全距離',
      size: '推定サイズ',
      speed: '速度',
      hazardous: '潜在的に危険',
      ldNote: 'LD = 月距離 (1 LD ≈ 384,400 km) · データ提供元',
      loading: '今週の NASA NEO データを読み込み中...',
      error: 'NEO データは現在利用できません。NASA がメンテナンス中の可能性があります。後でお試しください。',
      errorLink: 'NASA JPL 地球近傍天体研究センターで確認 →',
    },
    ru: {
      title: 'Кометы и астероиды, пролетающие на этой неделе',
      subtitle: (n: number) => `${n} ближайших объектов из NASA Near Earth Object Watch (NeoWs)`,
      nextDays: 'Следующие 7 дней',
      safe: 'Безопасное расстояние',
      size: 'Оценочный размер',
      speed: 'Скорость',
      hazardous: 'Потенциально опасный',
      ldNote: 'LD = Лунное расстояние (1 LD ≈ 384 400 км от Земли) · Данные от',
      loading: 'Загрузка данных NASA NEO за эту неделю...',
      error: 'Данные NEO сейчас недоступны. NASA может проводить техобслуживание. Попробуйте позже.',
      errorLink: 'Просмотреть на сайте NASA JPL Center for NEO Studies →',
    },
    fr: {
      title: 'Comètes et astéroïdes passant cette semaine',
      subtitle: (n: number) => `${n} objets les plus proches du NASA Near Earth Object Watch (NeoWs)`,
      nextDays: '7 prochains jours',
      safe: 'Distance sécurisée',
      size: 'Taille est.',
      speed: 'Vitesse',
      hazardous: 'Potentiellement dangereux',
      ldNote: 'LD = Distance lunaire (1 LD ≈ 384 400 km de la Terre) · Données de',
      loading: 'Chargement des données NASA NEO pour cette semaine...',
      error: 'Données NEO indisponibles actuellement. La NASA est peut-être en maintenance. Réessayez plus tard.',
      errorLink: 'Voir sur le NASA JPL Center for NEO Studies →',
    },
  };

  const lbl = neoLabels[language] || neoLabels['en'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">{lbl.loading}</p>
      </div>
    );
  }

  if (error || neoData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-5xl">☄️</span>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          {lbl.error}
        </p>
        <a
          href="https://cneos.jpl.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-400 hover:text-cyan-300 underline"
        >
          {lbl.errorLink}
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{lbl.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {lbl.subtitle(neoData.length)}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
          {lbl.nextDays}
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
                        ? new Date(neo.close_approach_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
                        : '-'}
                    </p>
                  </div>
                </div>
                {isHazardous && (
                  <span className="text-xs bg-red-900/70 text-red-400 border border-red-700/50 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                    {lbl.hazardous}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">{lbl.safe}</p>
                  <p className="text-xs font-bold text-cyan-300">
                    {distLunar.toFixed(1)} LD
                  </p>
                  <p className="text-xs text-gray-600">
                    {(distKm / 1000000).toFixed(2)} {language === 'id' || language === 'ms' ? 'jt km' : language === 'zh' ? '百万km' : language === 'ja' ? '百万km' : language === 'ru' ? 'млн км' : language === 'fr' ? 'M km' : 'M km'}
                  </p>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">{lbl.size}</p>
                  <p className="text-xs font-bold text-amber-300">
                    {diamMin}–{diamMax}m
                  </p>
                  <p className="text-xs text-gray-600">{language === 'id' || language === 'ms' ? 'diameter' : language === 'zh' ? '直径' : language === 'ja' ? '直径' : language === 'ru' ? 'диаметр' : language === 'fr' ? 'diamètre' : 'diameter'}</p>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">{lbl.speed}</p>
                  <p className="text-xs font-bold text-green-300">
                    {(speedKmh / 1000).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-600">{language === 'id' || language === 'ms' ? 'ribu km/jam' : language === 'zh' ? '千km/h' : language === 'ja' ? '千km/h' : language === 'ru' ? 'тыс. км/ч' : language === 'fr' ? 'k km/h' : 'k km/h'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 text-center mt-6">
        {lbl.ldNote}{' '}
        <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-400">
          NASA NeoWs API
        </a>
      </p>
    </div>
  );
}
