'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  SiteLanguage, 
  defaultLanguage, 
  isSiteLanguage, 
  LANGUAGE_COOKIE_KEY, 
  LANGUAGE_STORAGE_KEY 
} from '@/lib/i18n';

interface TEWSData {
  quake: { status: 'loading' | 'safe' | 'warn' | 'danger'; magnitude?: number; place?: string };
  hotspots: { status: 'loading' | 'safe' | 'warn' | 'danger'; count?: number };
  rain: { status: 'loading' | 'safe' };
  volcano: { status: 'loading' | 'safe' | 'warn' | 'danger'; name?: string; code?: string };
  enso: { status: 'loading' | 'safe' | 'warn'; ensoName?: string; anomaly?: number };
}

const localDict: Record<SiteLanguage, Record<string, string>> = {
  id: {
    badge: "Sistem Peringatan Dini Bencana",
    title: "LIVE EARTH TEWS DASHBOARD",
    desc: "Pemantauan satelit real-time aktivitas seismik, anomali kebakaran hutan, letusan gunung api, dan perubahan cuaca ekstrem Indonesia.",
    openMap: "Buka Peta Live →",
    loadingSeismic: "Memuat data seismik...",
    loadingFirms: "Menghubungi satelit FIRMS...",
    loadingGpm: "Memetakan awan hujan GPM...",
    loadingVolcano: "Memeriksa pos pengamatan...",
    loadingEnso: "Menghitung indeks ENSO...",
    
    labelSeismic: "SEISMIK",
    labelFirms: "TITIK API",
    labelGpm: "PRESIPITASI",
    labelVolcano: "VULKANIK",
    labelEnso: "ENSO",

    defaultQuakeTitle: "Gempa Bumi",
    defaultQuakeDetails: "Kondisi seismik terpantau aman.",
    quakeTitleDanger: "Gempa M {mag}",
    
    defaultHotspotsTitle: "Titik Api",
    defaultHotspotsDetails: "Nihil anomali titik api.",
    hotspotsTitleDanger: "{count} Titik Kebakaran",
    hotspotsDetailsDanger: "Siaga karhutla tinggi terdeteksi satelit.",
    hotspotsTitleWarn: "{count} Titik Api Aktif",
    hotspotsDetailsWarn: "Anomali suhu rendah/sedang terpantau.",

    rainTitle: "Rain Radar (NASA GPM)",
    rainDetails: "Laju presipitasi awan aktif 24 jam terakhir.",

    defaultVolcanoTitle: "Aktivitas Vulkanik",
    defaultVolcanoDetails: "Gunung api berstatus normal.",
    volcanoTitleDanger: "Erupsi Gunung {name}",
    volcanoDetailsDanger: "Kode penerbangan MERAH (Awas).",
    volcanoTitleWarn: "Aktivitas Gunung {name}",
    volcanoDetailsWarn: "Kode penerbangan ORANYE (Siaga).",

    defaultEnsoTitle: "Anomali ENSO",
    defaultEnsoDetails: "Indeks iklim samudra stabil.",
    ensoDescElNino: "El Niño terpantau aktif. Suhu permukaan laut Pasifik Tengah menghangat, berpotensi memicu kekeringan di Indonesia.",
    ensoDescLaNina: "La Niña terpantau aktif. Suhu permukaan laut Pasifik Tengah mendingin, berpotensi memicu peningkatan curah hujan & banjir.",

    navQuake: "Pantau Seismik →",
    navHotspots: "Peta Hotspot →",
    navRain: "Analisa Curah Hujan →",
    navVolcano: "Laporan Erupsi →",
    navEnso: "Analisa ENSO →",
  },
  en: {
    badge: "Disaster Early Warning System",
    title: "LIVE EARTH TEWS DASHBOARD",
    desc: "Real-time satellite monitoring of seismic activity, forest fire anomalies, volcanic eruptions, and extreme weather changes in Indonesia.",
    openMap: "Open Live Map →",
    loadingSeismic: "Loading seismic data...",
    loadingFirms: "Connecting to FIRMS satellite...",
    loadingGpm: "Mapping GPM rain clouds...",
    loadingVolcano: "Checking observatory posts...",
    loadingEnso: "Calculating ENSO index...",
    
    labelSeismic: "SEISMIC",
    labelFirms: "HOTSPOTS",
    labelGpm: "PRECIPITATION",
    labelVolcano: "VOLCANIC",
    labelEnso: "ENSO",

    defaultQuakeTitle: "Earthquake",
    defaultQuakeDetails: "Seismic conditions are monitored safe.",
    quakeTitleDanger: "Quake M {mag}",

    defaultHotspotsTitle: "Hotspots",
    defaultHotspotsDetails: "No hotspot anomalies detected.",
    hotspotsTitleDanger: "{count} Fire Hotspots",
    hotspotsDetailsDanger: "High wildfire alert detected by satellite.",
    hotspotsTitleWarn: "{count} Active Hotspots",
    hotspotsDetailsWarn: "Low/moderate temperature anomaly observed.",

    rainTitle: "Rain Radar (NASA GPM)",
    rainDetails: "Active precipitation rate over the last 24 hours.",

    defaultVolcanoTitle: "Volcanic Activity",
    defaultVolcanoDetails: "Volcano status is normal.",
    volcanoTitleDanger: "Eruption Mt. {name}",
    volcanoDetailsDanger: "Aviation color code RED (Warning).",
    volcanoTitleWarn: "Activity Mt. {name}",
    volcanoDetailsWarn: "Aviation color code ORANGE (Watch).",

    defaultEnsoTitle: "ENSO Anomaly",
    defaultEnsoDetails: "Oceanic climate index is stable.",
    ensoDescElNino: "El Niño is active. Central Pacific sea surface temperatures are warmer, potentially triggering drought in Indonesia.",
    ensoDescLaNina: "La Niña is active. Central Pacific sea surface temperatures are cooler, potentially triggering heavy rains & floods.",

    navQuake: "Monitor Seismic →",
    navHotspots: "Hotspot Map →",
    navRain: "Rainfall Analysis →",
    navVolcano: "Eruption Report →",
    navEnso: "ENSO Analysis →",
  },
  ms: {
    badge: "Sistem Amaran Awal Bencana",
    title: "LIVE EARTH TEWS DASHBOARD",
    desc: "Pemantauan satelit masa nyata aktiviti seismik, anomali kebakaran hutan, letusan gunung berapi, dan perubahan cuaca ekstrem di Indonesia.",
    openMap: "Buka Peta Langsung →",
    loadingSeismic: "Memuatkan data seismik...",
    loadingFirms: "Menghubungi satelit FIRMS...",
    loadingGpm: "Memetakan awan hujan GPM...",
    loadingVolcano: "Memeriksa pos pemerhatian...",
    loadingEnso: "Mengira indeks ENSO...",
    
    labelSeismic: "SEISMIK",
    labelFirms: "TITIK API",
    labelGpm: "PRESIPITASI",
    labelVolcano: "VULKANIK",
    labelEnso: "ENSO",

    defaultQuakeTitle: "Gempa Bumi",
    defaultQuakeDetails: "Keadaan seismik dipantau selamat.",
    quakeTitleDanger: "Gempa M {mag}",

    defaultHotspotsTitle: "Titik Api",
    defaultHotspotsDetails: "Tiada anomali titik api dikesan.",
    hotspotsTitleDanger: "{count} Titik Kebakaran",
    hotspotsDetailsDanger: "Amaran kebakaran hutan tinggi dikesan satelit.",
    hotspotsTitleWarn: "{count} Titik Api Aktif",
    hotspotsDetailsWarn: "Anomali suhu rendah/sederhana dikesan.",

    rainTitle: "Radar Hujan (NASA GPM)",
    rainDetails: "Kadar kerpasan aktif dalam tempoh 24 jam terakhir.",

    defaultVolcanoTitle: "Aktiviti Gunung Berapi",
    defaultVolcanoDetails: "Status gunung berapi adalah normal.",
    volcanoTitleDanger: "Letusan G. {name}",
    volcanoDetailsDanger: "Kod warna penerbangan MERAH (Amaran).",
    volcanoTitleWarn: "Aktiviti G. {name}",
    volcanoDetailsWarn: "Kod warna penerbangan JINGGA (Waspada).",

    defaultEnsoTitle: "Anomali ENSO",
    defaultEnsoDetails: "Indeks iklim lautan stabil.",
    ensoDescElNino: "El Niño aktif. Suhu permukaan laut Pasifik Tengah menghangat, berpotensi memicu kemarau di Indonesia.",
    ensoDescLaNina: "La Niña aktif. Suhu permukaan laut Pasifik Tengah mendingin, berpotensi memicu peningkatan hujan & banjir.",

    navQuake: "Pantau Seismik →",
    navHotspots: "Peta Hotspot →",
    navRain: "Analisis Hujan →",
    navVolcano: "Laporan Letusan →",
    navEnso: "Analisis ENSO →",
  },
  zh: {
    badge: "灾害预警系统",
    title: "地球实时 TEWS 仪表板",
    desc: "实时卫星监测印尼的地震活动、森林火灾异常、火山喷发和极端天气变化。",
    openMap: "打开实时地图 →",
    loadingSeismic: "加载地震数据...",
    loadingFirms: "正在连接 FIRMS 卫星...",
    loadingGpm: "正在绘制 GPM 雨云图...",
    loadingVolcano: "正在检查火山观测站...",
    loadingEnso: "正在计算 ENSO 指数...",
    
    labelSeismic: "地震",
    labelFirms: "热点",
    labelGpm: "降水",
    labelVolcano: "火山",
    labelEnso: "ENSO",

    defaultQuakeTitle: "地震",
    defaultQuakeDetails: "地震活动监测安全。",
    quakeTitleDanger: "地震 M {mag}",

    defaultHotspotsTitle: "热点",
    defaultHotspotsDetails: "未检测到热点异常。",
    hotspotsTitleDanger: "{count} 处火灾热点",
    hotspotsDetailsDanger: "卫星监测到高林火预警。",
    hotspotsTitleWarn: "{count} 处活动热点",
    hotspotsDetailsWarn: "监测到低/中度温度异常。",

    rainTitle: "降雨雷达 (NASA GPM)",
    rainDetails: "过去 24 小时的活动降水量。",

    defaultVolcanoTitle: "火山活动",
    defaultVolcanoDetails: "火山状态正常。",
    volcanoTitleDanger: "{name} 火山喷发",
    volcanoDetailsDanger: "航空颜色代码红色 (警报)。",
    volcanoTitleWarn: "{name} 火山活动",
    volcanoDetailsWarn: "航空颜色代码橙色 (注意)。",

    defaultEnsoTitle: "ENSO 异常",
    defaultEnsoDetails: "海洋气候指数稳定。",
    ensoDescElNino: "厄尔尼诺现象活跃。中太平洋海面温度偏暖，可能导致印尼干旱。",
    ensoDescLaNina: "拉尼娜现象活跃。中太平洋海面温度偏冷，可能导致降雨增加和洪涝。",

    navQuake: "监测地震 →",
    navHotspots: "热点地图 →",
    navRain: "降雨分析 →",
    navVolcano: "喷发报告 →",
    navEnso: "ENSO 分析 →",
  },
  ja: {
    badge: "災害早期警戒システム",
    title: "地球リアルタイム TEWS ダッシュボード",
    desc: "インドネシアの地震活動、森林火災異常、火山噴火、極端な気候変化をリアルタイムで衛星監視。",
    openMap: "ライブマップを開く →",
    loadingSeismic: "地震データを読み込み中...",
    loadingFirms: "FIRMS衛星に接続中...",
    loadingGpm: "GPM雨雲をマッピング中...",
    loadingVolcano: "火山観測所を確認中...",
    loadingEnso: "ENSO指数を計算中...",
    
    labelSeismic: "地震活動",
    labelFirms: "ホットスポット",
    labelGpm: "降水",
    labelVolcano: "火山",
    labelEnso: "ENSO",

    defaultQuakeTitle: "地震",
    defaultQuakeDetails: "地震活動は安全に監視されています。",
    quakeTitleDanger: "地震 M {mag}",

    defaultHotspotsTitle: "ホットスポット",
    defaultHotspotsDetails: "ホットスポット異常は検出されませんでした。",
    hotspotsTitleDanger: "{count} 件の火災",
    hotspotsDetailsDanger: "衛星が森林火災警報を検出しました。",
    hotspotsTitleWarn: "{count} 件の活動ホットスポット",
    hotspotsDetailsWarn: "低/中程度の温度異常が観測されました。",

    rainTitle: "降雨レーダー (NASA GPM)",
    rainDetails: "過去24時間の活動降水量。",

    defaultVolcanoTitle: "火山活動",
    defaultVolcanoDetails: "火山のステータスは正常です。",
    volcanoTitleDanger: "{name} 火山噴火",
    volcanoDetailsDanger: "航空カラーコード赤 (警告)。",
    volcanoTitleWarn: "{name} 火山活動",
    volcanoDetailsWarn: "航空カラーコード橙 (注意)。",

    defaultEnsoTitle: "ENSO 異常",
    defaultEnsoDetails: "海洋気候指数は安定しています。",
    ensoDescElNino: "エルニーニョ現象が活発です。太平洋中部の海面温度が上昇し、インドネシアでの干ばつを引き起こす可能性があります。",
    ensoDescLaNina: "ラニーニャ現象が活発です。太平洋中部の海面温度が低下し、大雨や洪水を誘発する可能性があります。",

    navQuake: "地震を監視 →",
    navHotspots: "ホットスポットマップ →",
    navRain: "降水量分析 →",
    navVolcano: "噴火レポート →",
    navEnso: "ENSO 分析 →",
  },
  ru: {
    badge: "Система Раннего Предупреждения",
    title: "ПАНЕЛЬ УГРОЗ ЗЕМЛИ TEWS LIVE",
    desc: "Мониторинг сейсмической активности, лесных пожаров, извержений вулканов и экстремальных погодных условий в Индонезии со спутников в реальном времени.",
    openMap: "Открыть Живую Карту →",
    loadingSeismic: "Загрузка сейсмических данных...",
    loadingFirms: "Подключение к спутнику FIRMS...",
    loadingGpm: "Картирование дождевых облаков GPM...",
    loadingVolcano: "Проверка обсерваторий...",
    loadingEnso: "Расчет индекса ENSO...",
    
    labelSeismic: "СЕЙСМИКА",
    labelFirms: "ПОЖАРЫ",
    labelGpm: "ОСАДКИ",
    labelVolcano: "ВУЛКАНЫ",
    labelEnso: "ЭЛЬ-НИНЬО",

    defaultQuakeTitle: "Землетрясение",
    defaultQuakeDetails: "Сейсмическая обстановка в норме.",
    quakeTitleDanger: "Землетрясение M {mag}",

    defaultHotspotsTitle: "Очаги пожаров",
    defaultHotspotsDetails: "Аномалий пожаров не обнаружено.",
    hotspotsTitleDanger: "{count} очагов пожара",
    hotspotsDetailsDanger: "Спутником обнаружена высокая пожарная опасность.",
    hotspotsTitleWarn: "{count} активных очагов",
    hotspotsDetailsWarn: "Наблюдается слабая/умеренная температурная аномалия.",

    rainTitle: "Дождевой радар (NASA GPM)",
    rainDetails: "Уровень активных осадков за последние 24 часа.",

    defaultVolcanoTitle: "Вулканическая активность",
    defaultVolcanoDetails: "Статус вулканов нормальный.",
    volcanoTitleDanger: "Извержение влк. {name}",
    volcanoDetailsDanger: "Авиационный код КРАСНЫЙ (Опасность).",
    volcanoTitleWarn: "Активность влк. {name}",
    volcanoDetailsWarn: "Авиационный код ОРАНЖЕВЫЙ (Внимание).",

    defaultEnsoTitle: "Аномалия ENSO",
    defaultEnsoDetails: "Океанический климатический индекс стабилен.",
    ensoDescElNino: "Эль-Ниньо активен. Температура поверхности моря в центральной части Тихого океана выше нормы, что может вызвать засуху в Индонезии.",
    ensoDescLaNina: "Ла-Нинья активна. Температура поверхности моря в центральной части Тихого океана ниже нормы, что может вызвать наводнения.",

    navQuake: "Сейсмомониторинг →",
    navHotspots: "Карта пожаров →",
    navRain: "Анализ осадков →",
    navVolcano: "Отчет об извержениях →",
    navEnso: "Анализ ENSO →",
  },
  fr: {
    badge: "Système d'Alerte Précoce",
    title: "TABLEAU DE BORD TEWS LIVE",
    desc: "Surveillance satellite en temps réel de l'activité sismique, des feux de forêt, des éruptions volcaniques et des conditions climatiques extrêmes en Indonésie.",
    openMap: "Ouvrir la Carte Live →",
    loadingSeismic: "Chargement des données sismologiques...",
    loadingFirms: "Connexion au satellite FIRMS...",
    loadingGpm: "Cartographie des nuages GPM...",
    loadingVolcano: "Vérification des observatoires...",
    loadingEnso: "Calcul de l'indice ENSO...",
    
    labelSeismic: "SISMIQUE",
    labelFirms: "FOYERS",
    labelGpm: "PRÉCIPITATIONS",
    labelVolcano: "VOLCANS",
    labelEnso: "ENSO",

    defaultQuakeTitle: "Tremblement de terre",
    defaultQuakeDetails: "Conditions sismiques normales.",
    quakeTitleDanger: "Séisme M {mag}",

    defaultHotspotsTitle: "Foyers d'incendie",
    defaultHotspotsDetails: "Aucune anomalie détectée.",
    hotspotsTitleDanger: "{count} foyers d'incendie",
    hotspotsDetailsDanger: "Alerte incendie élevée détectée par satellite.",
    hotspotsTitleWarn: "{count} foyers actifs",
    hotspotsDetailsWarn: "Anomalie thermique faible/modérée observée.",

    rainTitle: "Radar de pluie (NASA GPM)",
    rainDetails: "Taux de précipitation active des dernières 24 heures.",

    defaultVolcanoTitle: "Activité Volcanique",
    defaultVolcanoDetails: "Le statut des volcans est normal.",
    volcanoTitleDanger: "Éruption Mt. {name}",
    volcanoDetailsDanger: "Code couleur aviation ROUGE (Alerte).",
    volcanoTitleWarn: "Activité Mt. {name}",
    volcanoDetailsWarn: "Code couleur aviation ORANGE (Vigilance).",

    defaultEnsoTitle: "Anomalie ENSO",
    defaultEnsoDetails: "L'indice océanique est stable.",
    ensoDescElNino: "El Niño est actif. Les températures de surface de l'océan Pacifique central sont plus chaudes, risquant de déclencher une sécheresse en Indonésie.",
    ensoDescLaNina: "La Niña est active. Les températures de surface de l'océan Pacifique central sont plus froides, risquant de provoquer des inondations.",

    navQuake: "Surveillance Sismique →",
    navHotspots: "Carte des Incendies →",
    navRain: "Analyse des Pluies →",
    navVolcano: "Rapport d'Éruption →",
    navEnso: "Analyse ENSO →",
  }
};

export default function EarthTEWSWidget() {
  const [language, setLanguage] = useState<SiteLanguage>(defaultLanguage);
  const [data, setData] = useState<TEWSData>({
    quake: { status: 'loading' },
    hotspots: { status: 'loading' },
    rain: { status: 'safe' },
    volcano: { status: 'loading' },
    enso: { status: 'loading' }
  });
  const [loading, setLoading] = useState(true);

  // Sync language selection dynamically
  useEffect(() => {
    try {
      const storedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
      if (isSiteLanguage(storedLanguage)) {
        setLanguage(storedLanguage);
      } else {
        const cookieLocale = typeof document !== 'undefined'
          ? document.cookie
              .split('; ')
              .find((row) => row.startsWith(`${LANGUAGE_COOKIE_KEY}=`))
              ?.split('=')[1]
          : null;
        if (isSiteLanguage(cookieLocale || null)) {
          setLanguage(cookieLocale as SiteLanguage);
        }
      }
    } catch (err) {
      console.warn('Gagal membaca storage di EarthTEWSWidget:', err);
    }
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<SiteLanguage>).detail;
      if (isSiteLanguage(nextLanguage)) {
        setLanguage(nextLanguage);
      }
    };
    window.addEventListener('meteorit-language-change', handleLanguageChange);
    return () => {
      window.removeEventListener('meteorit-language-change', handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    async function loadTEWS() {
      try {
        // Fetch Quakes
        let quakeState: TEWSData['quake'] = { status: 'safe' };
        try {
          const res = await fetch('/api/earth-monitoring/usgs?scope=indonesia&limit=5');
          if (res.ok) {
            const json = await res.json();
            const quakes = json.earthquakes || [];
            const strong = quakes.find((q: any) => q.magnitude >= 4.8);
            if (strong) {
              quakeState = {
                status: 'danger',
                magnitude: strong.magnitude,
                place: strong.place
              };
            } else if (quakes.length > 0) {
              quakeState = {
                status: 'warn',
                magnitude: quakes[0].magnitude,
                place: quakes[0].place
              };
            }
          }
        } catch {}

        // Fetch Hotspots
        let hotspotState: TEWSData['hotspots'] = { status: 'safe' };
        try {
          const res = await fetch('/api/earth-monitoring/firms?source=VIIRS_SNPP_NRT&country=IDN&range=1');
          if (res.ok) {
            const json = await res.json();
            const count = json.count || 0;
            if (count > 15) {
              hotspotState = {
                status: 'danger',
                count
              };
            } else if (count > 0) {
              hotspotState = {
                status: 'warn',
                count
              };
            }
          }
        } catch {}

        // Fetch Volcano
        let volcanoState: TEWSData['volcano'] = { status: 'safe' };
        try {
          const res = await fetch('/api/earth-monitoring/magma');
          if (res.ok) {
            const json = await res.json();
            const vonas = json.vona || [];
            const red = vonas.find((v: any) => v.current_code === 'RED');
            const orange = vonas.find((v: any) => v.current_code === 'ORANGE');

            if (red) {
              volcanoState = {
                status: 'danger',
                name: red.volcano_name,
                code: 'RED'
              };
            } else if (orange) {
              volcanoState = {
                status: 'warn',
                name: orange.volcano_name,
                code: 'ORANGE'
              };
            }
          }
        } catch {}

        // Fetch ENSO
        let ensoState: TEWSData['enso'] = { status: 'safe' };
        try {
          const res = await fetch('/api/cuaca/enso');
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              const e = json.data;
              if (e.status === 'El Niño' || e.status === 'La Niña') {
                ensoState = {
                  status: 'warn',
                  ensoName: e.status,
                  anomaly: e.nino34_anomaly
                };
              }
            }
          }
        } catch {}

        setData({
          quake: quakeState,
          hotspots: hotspotState,
          rain: { status: 'safe' },
          volcano: volcanoState,
          enso: ensoState
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadTEWS();
  }, []);

  const t = localDict[language] || localDict['id'];

  // Card Level Computations
  const quakeLevel = data.quake.status === 'danger' ? 'danger' : data.quake.status === 'warn' ? 'warn' : 'info';
  const hotspotsLevel = data.hotspots.status === 'danger' ? 'danger' : data.hotspots.status === 'warn' ? 'warn' : 'info';
  const rainLevel = 'info';
  const volcanoLevel = data.volcano.status === 'danger' ? 'danger' : data.volcano.status === 'warn' ? 'warn' : 'info';
  const ensoLevel = data.enso.status === 'warn' ? 'warn' : 'info';

  const cardStyle = {
    info: 'border-cyan-500/20 bg-cyan-950/5 hover:border-cyan-500/40 text-cyan-400',
    warn: 'border-amber-500/20 bg-amber-950/5 hover:border-amber-500/40 text-amber-400',
    danger: 'border-red-500/25 bg-red-950/5 hover:border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
  };

  const badgeStyle = {
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    warn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
  };

  // Dynamic Translations
  const quakeTitle = data.quake.status === 'loading' ? t.loadingSeismic :
                     data.quake.status === 'safe' ? t.defaultQuakeTitle :
                     t.quakeTitleDanger.replace('{mag}', (data.quake.magnitude || 0).toFixed(1));
  const quakeDetails = data.quake.status === 'loading' ? t.loadingSeismic :
                       data.quake.status === 'safe' ? t.defaultQuakeDetails :
                       data.quake.place || '';

  const hotspotsTitle = data.hotspots.status === 'loading' ? t.loadingFirms :
                        data.hotspots.status === 'safe' ? t.defaultHotspotsTitle :
                        data.hotspots.status === 'danger' ? t.hotspotsTitleDanger.replace('{count}', String(data.hotspots.count || 0)) :
                        t.hotspotsTitleWarn.replace('{count}', String(data.hotspots.count || 0));
  const hotspotsDetails = data.hotspots.status === 'loading' ? t.loadingFirms :
                          data.hotspots.status === 'safe' ? t.defaultHotspotsDetails :
                          data.hotspots.status === 'danger' ? t.hotspotsDetailsDanger :
                          t.hotspotsDetailsWarn;

  const volcanoTitle = data.volcano.status === 'loading' ? t.loadingVolcano :
                       data.volcano.status === 'safe' ? t.defaultVolcanoTitle :
                       data.volcano.status === 'danger' ? t.volcanoTitleDanger.replace('{name}', data.volcano.name || '') :
                       t.volcanoTitleWarn.replace('{name}', data.volcano.name || '');
  const volcanoDetails = data.volcano.status === 'loading' ? t.loadingVolcano :
                         data.volcano.status === 'safe' ? t.defaultVolcanoDetails :
                         data.volcano.status === 'danger' ? t.volcanoDetailsDanger :
                         t.volcanoDetailsWarn;

  const ensoTitle = data.enso.status === 'loading' ? t.loadingEnso :
                     data.enso.status === 'safe' ? t.defaultEnsoTitle :
                     `${data.enso.ensoName} (${(data.enso.anomaly || 0) >= 0 ? '+' : ''}${(data.enso.anomaly || 0).toFixed(2)} °C)`;
  const ensoDetails = data.enso.status === 'loading' ? t.loadingEnso :
                       data.enso.status === 'safe' ? t.defaultEnsoDetails :
                       data.enso.ensoName === 'El Niño' ? t.ensoDescElNino : t.ensoDescLaNina;

  return (
    <section className="py-12 bg-slate-950 relative overflow-hidden">
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes tews-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg) translate(-1px, 0px); }
          75% { transform: rotate(3deg) translate(1px, -1px); }
        }
        @keyframes tews-flame {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.3); }
        }
        @keyframes tews-rain {
          0% { transform: translateY(-3px); opacity: 0.3; }
          50% { transform: translateY(3px); opacity: 1; }
          100% { transform: translateY(6px); opacity: 0; }
        }
        @keyframes tews-wave {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-2px) scaleY(1.1); }
        }
        @keyframes tews-smoke {
          0% { transform: scale(0.8) translateY(2px); opacity: 0.8; }
          100% { transform: scale(1.3) translateY(-6px); opacity: 0; }
        }
        .anim-shake { animation: tews-shake 0.4s ease-in-out infinite; }
        .anim-flame { animation: tews-flame 1.5s ease-in-out infinite; }
        .anim-rain { animation: tews-rain 1.2s linear infinite; }
        .anim-wave { animation: tews-wave 2.5s ease-in-out infinite; }
        .anim-smoke { animation: tews-smoke 2s ease-out infinite; }
      ` }} />

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/30 text-[10px] font-bold text-red-400 tracking-wider uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {t.badge}
            </div>
            <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-red-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-wide">
              {t.title}
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              {t.desc}
            </p>
          </div>
          <Link
            href="/cuaca?tab=disaster"
            className="self-start md:self-center px-5 py-2.5 bg-slate-900 hover:bg-slate-855 border border-slate-800 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-950/20"
          >
            {t.openMap}
          </Link>
        </div>

        {/* 5-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* GEMPA BUMI */}
          <Link
            href="/cuaca?tab=disaster&sub=quake"
            className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${cardStyle[quakeLevel]}`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  <span className={quakeLevel === 'danger' ? 'anim-shake inline-block' : ''}>🌋</span>
                </div>
                <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeStyle[quakeLevel]}`}>
                  {t.labelSeismic}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide truncate">
                {quakeTitle}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-3">
                {quakeDetails}
              </p>
            </div>
            <div className="text-[9px] font-bold text-gray-505 mt-4 group-hover:text-white transition-colors">
              {t.navQuake}
            </div>
          </Link>

          {/* TITIK API */}
          <Link
            href="/cuaca?tab=disaster&sub=hotspots"
            className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${cardStyle[hotspotsLevel]}`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  <span className="anim-flame inline-block">🔥</span>
                </div>
                <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeStyle[hotspotsLevel]}`}>
                  {t.labelFirms}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide truncate">
                {hotspotsTitle}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-3">
                {hotspotsDetails}
              </p>
            </div>
            <div className="text-[9px] font-bold text-gray-505 mt-4 group-hover:text-white transition-colors">
              {t.navHotspots}
            </div>
          </Link>

          {/* CURAH HUJAN */}
          <Link
            href="/cuaca?tab=disaster&sub=rain"
            className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${cardStyle[rainLevel]}`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 relative">
                  <span>🌧️</span>
                  <span className="anim-rain absolute text-xs opacity-0 left-3 top-5">💧</span>
                  <span className="anim-rain absolute text-xs opacity-0 left-6 top-6" style={{ animationDelay: '0.4s' }}>💧</span>
                </div>
                <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeStyle[rainLevel]}`}>
                  {t.labelGpm}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide truncate">
                {t.rainTitle}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-3">
                {t.rainDetails}
              </p>
            </div>
            <div className="text-[9px] font-bold text-gray-505 mt-4 group-hover:text-white transition-colors">
              {t.navRain}
            </div>
          </Link>

          {/* GUNUNG API */}
          <Link
            href="/cuaca?tab=disaster&sub=volcano"
            className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${cardStyle[volcanoLevel]}`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 relative">
                  <span>🏔️</span>
                  <span className="anim-smoke absolute w-1.5 h-1.5 rounded-full bg-gray-400/40 left-5 top-2 opacity-0" />
                  <span className="anim-smoke absolute w-2.5 h-2.5 rounded-full bg-gray-400/30 left-6 top-1 opacity-0" style={{ animationDelay: '0.8s' }} />
                </div>
                <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeStyle[volcanoLevel]}`}>
                  {t.labelVolcano}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide truncate">
                {volcanoTitle}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-3">
                {volcanoDetails}
              </p>
            </div>
            <div className="text-[9px] font-bold text-gray-505 mt-4 group-hover:text-white transition-colors">
              {t.navVolcano}
            </div>
          </Link>

          {/* IKLIM ENSO */}
          <Link
            href="/cuaca?tab=disaster&sub=enso"
            className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${cardStyle[ensoLevel]}`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  <span className="anim-wave inline-block">🌊</span>
                </div>
                <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeStyle[ensoLevel]}`}>
                  {t.labelEnso}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide truncate">
                {ensoTitle}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-3">
                {ensoDetails}
              </p>
            </div>
            <div className="text-[9px] font-bold text-gray-505 mt-4 group-hover:text-white transition-colors">
              {t.navEnso}
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
}
