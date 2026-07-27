'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

// Dynamically import MapLibre map component to disable SSR
const MapLibreDisasterMap = dynamic(
  () => import('./kebencanaan/MapLibreDisasterMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] bg-slate-900/60 rounded-3xl flex items-center justify-center border border-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-extrabold animate-pulse">Memuat Peta Pemantauan Bencana...</p>
        </div>
      </div>
    )
  }
);

export default function DisasterMapSection() {
  const language = useSiteLanguage();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecords() {
      try {
        const today = new Date().toISOString().split('T')[0];
        // Fetch last 7 days of active alerts
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const res = await fetch(`/api/earth-monitoring/data-center?startDate=${sevenDaysAgo}&endDate=${today}&category=all&region=indonesia`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records || []);
        }
      } catch (err) {
        console.warn('Failed to load map records on landing page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, []);

  const sectionT: Record<string, { title: string; desc: string }> = {
    id: {
      title: "🗺️ Peta Pantauan Bencana Real-Time",
      desc: "Visualisasi sebaran gempa bumi, status letusan gunung api, pos siaga banjir, dan titik api kebakaran hutan di wilayah Indonesia."
    },
    en: {
      title: "🗺️ Real-Time Disaster Monitoring Map",
      desc: "Visualization of earthquakes, active volcanoes status, flood alert locations, and wildfire hotspots across Indonesia."
    },
    ms: {
      title: "🗺️ Peta Pemantauan Bencana Masa Nyata",
      desc: "Visualisasi taburan gempa bumi, status letusan gunung berapi, pos amaran banjir, dan titik panas kebakaran hutan di Indonesia."
    },
    zh: {
      title: "🗺️ 实时灾害监测地图",
      desc: "印度尼西亚地震、活火山状态、洪水警报位置和林火热点分布的可视化。"
    },
    ja: {
      title: "🗺️ リアルタイム災害監視マップ",
      desc: "インドネシア全域の地震、活火山、洪水警戒所、森林火災ホットスポットの分布図。"
    },
    ru: {
      title: "🗺️ Карта мониторинга бедствий в реальном времени",
      desc: "Визуализация землетрясений, активности вулканов, паводковых зон и лесных пожаров в Индонезии."
    },
    fr: {
      title: "🗺️ Carte de Surveillance des Catastrophes en Temps Réel",
      desc: "Visualisation des séismes, de l'activité volcanique, des zones inondables et des foyers de feux de forêt en Indonésie."
    }
  };

  const t = sectionT[language] || sectionT['id'];

  return (
    <section className="py-12 border-t border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 bg-clip-text text-transparent uppercase tracking-wide">
            {t.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
            {t.desc}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-3xl p-4 shadow-2xl transition-all">
          <MapLibreDisasterMap records={records} language={language} />
        </div>
      </div>
    </section>
  );
}
