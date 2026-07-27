'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import {
  Activity, AlertTriangle, Compass, Map, Info, Shield, Layers,
  RefreshCw, FileText, CheckCircle, Flame, CloudRain, Wind,
  ChevronRight, ArrowLeft, Thermometer, Navigation, Plane, Users, MapPin,
  Search, Mic, Sparkles
} from 'lucide-react';
import DisasterMap from './DisasterMap';

// ─── Translations & Dictionaries ─────────────────────────────────────────────
// ─── Translations & Dictionaries ─────────────────────────────────────────────
const dict: Record<string, Record<string, string>> = {
  id: {
    dashboardTitle: "DASBOR KEBENCANAAN NASIONAL",
    dashboardSubtitle: "Sistem Pemantauan Terpadu Seismik, Vulkanik, Karhutla & Cuaca Ekstrem",
    syncBtn: "Sinkronisasi Data",
    lastSync: "Terakhir disinkronkan:",
    tabQuake: "🌋 Gempa Bumi",
    tabHotspots: "🔥 Titik Api",
    tabRain: "🌧️ Curah Hujan",
    tabVolcano: "🏔️ Gunung Api",
    tabEnso: "🌊 La Niña & ENSO",
    
    // Volcano translations
    volcanoStatusTitle: "Status Gunung Api Terkini",
    nationalStatsTitle: "Statistik Gunung Api Nasional",
    activeCountLabel: "Gunung Berstatus Aktif",
    highestActivityLabel: "Aktivitas Tertinggi",
    eruptionsTodayLabel: "Erupsi Hari Ini",
    volcanicHotspotsLabel: "Hotspot Vulkanik Satelit",
    volcanoCompareTitle: "Perbandingan Parameter Gunung Api",
    volcanoCompareDesc: "Perbandingan berdampingan gunung api dengan aktivitas tinggi di Indonesia.",
    timelineTitle: "Garis Waktu & Log Aktivitas (30 Hari)",
    timelineDesc: "Riwayat kenaikan status dan rilisan VONA (Volcano Observatory Notice for Aviation) resmi.",
    riskDashboardTitle: "Dasbor Indikator Risiko",
    riskAviationLabel: "Risiko Penerbangan",
    riskResidentLabel: "Risiko Pemukiman Warga",
    riskHikerLabel: "Risiko Pendakian",
    riskHigh: "TINGGI (SIAGA/AWAS)",
    riskMedium: "SEDANG (WASPADA)",
    riskLow: "RENDAH / AMAN",
    userLocTitle: "Pencarian Gunung Api Terdekat",
    userLocBtn: "Gunakan Lokasi Saya",
    userLocLoading: "Menghubungi satelit GPS...",
    userLocSuccess: "Ditemukan gunung terdekat dari lokasi Anda!",
    userLocDistance: "Jarak:",
    userLocDirection: "Arah:",
    userLocClosest: "Gunung Terdekat:",
    eduTitle: "Pusat Edukasi & Siaga Mitigasi Vulkanik",
    eduDesc: "Pahami tingkatan status dan protokol keselamatan letusan gunung api.",
    aiSummaryTitle: "AI Ringkasan Kebencanaan",
    aiSummaryDesc: "Terjemahan otomatis data teknis magma menjadi ringkasan yang mudah dipahami.",
    
    // Layers
    mapLayerTitle: "Kontrol Layer Peta Satelit Multi-Layer",
    layerVolcano: "🏔️ Gunung Api",
    layerQuake: "🌋 Gempa Bumi",
    layerHotspots: "🔥 Hotspots FIRMS",
    layerRain: "🌧️ Radar Hujan GPM",
    layerHimawari: "☁️ Satelit Himawari",
    layerFlood: "🌊 Pos Banjir",
    layerCyclone: "🌀 Siklon Tropis",

    // UI Content Cards translations
    tblVolcano: "Gunung Api",
    tblStatus: "Status Letusan",
    tblAshHeight: "Kolom Abu",
    tblAshDirection: "Arah Abu",
    tblWeather: "Cuaca Puncak",
    tblNoData: "Tidak ada data",
    
    eduHeader1: "Tingkat Status Gunung Api (Level I-IV)",
    eduBody1_1: "🟢 Level I (Normal): Tidak ada perubahan aktivitas visual atau seismik secara signifikan.",
    eduBody1_2: "🟡 Level II (Waspada): Mulai terjadi peningkatan aktivitas di atas batas normal di sekitar kawah.",
    eduBody1_3: "🟠 Level III (Siaga): Peningkatan kegempaan yang jelas dan indikasi kuat menuju letusan.",
    eduBody1_4: "🔴 Level IV (Awas): Keadaan kritis di mana erupsi eksplosif sedang berlangsung atau akan terjadi.",
    
    eduHeader2: "Arti Warna Kode Aviasi (VONA)",
    eduBody2_1: "🔴 RED (Merah): Erupsi sedang terjadi dengan kolom abu vulkanik melambung tinggi ke udara.",
    eduBody2_2: "🟠 ORANGE (Oranye): Gunung api menunjukkan tingkat aktivitas tinggi dengan potensi abu membahayakan penerbangan.",
    eduBody2_3: "🟡 YELLOW (Kuning): Menunjukkan peningkatan aktivitas vulkanik di atas tingkat latar belakang normal.",
    
    eduHeader3: "Tips Keselamatan Saat Erupsi",
    eduBody3_1: "😷 Gunakan masker dan kacamata pelindung untuk menghindari abu vulkanik.",
    eduBody3_2: "🚫 Jauhi wilayah lembah sungai karena berisiko terjadi aliran lahar dingin.",
    eduBody3_3: "📻 Pantau terus arahan evakuasi dari petugas pos pengamatan gunung api setempat.",

    quakeHeader: "📋 Laporan Gempa Bumi Terbaru (USGS)",
    quakeDepth: "Kedalaman",
    quakeTsunami: "🚨 Peringatan Tsunami",
    
    hotspotsHeader: "🔥 Deteksi Titik Api Karhutla (NASA FIRMS)",
    hotspotsEmpty: "Nihil anomali termal titik api kebakaran di Indonesia saat ini.",
    hotspotsSat: "Satelit",
    hotspotsConf: "Kepercayaan",
    
    rainHeader: "🌧️ Pemantauan Curah Hujan & Banjir (NASA GPM / GFMS)",
    rainDesc: "Peta presipitasi global (IMERG) memantau akumulasi air di atas permukaan Indonesia untuk memberikan indikasi risiko banjir bandang lokal.",
    rainZoneTitle: "🌊 Wilayah Siaga Banjir Rob / Luapan",
    rainSemarang: "🌊 Semarang (Kota): Status rob tinggi pesisir pantura Jawa Tengah.",
    rainDemak: "🌊 Demak (Tanggul Wulan): Konstruksi tanggul darurat siaga limpasan air sungai.",
    rainLuwu: "🌊 Luwu Utara: Limpasan pegunungan memicu siaga genangan sawah.",
    rainAnalysisTitle: "📡 Analisis Satelit GPM",
    rainAnalysisDesc: "Data presipitasi core observatory diperbarui otomatis setiap 30 menit. Wilayah dengan intensitas di atas 50mm/jam berpotensi memicu banjir kilat (Flash Flood) di daerah aliran sungai.",
    
    ensoHeader: "🌊 Pemantauan Osilasi Iklim Samudra (ENSO)",
    ensoStatusTitle: "STATUS SIKLUS EL NIÑO / LA NIÑA",
    ensoNeutral: "KONDISI NETRAL",
    ensoDesc: "Indeks ONI (Oceanic Niño Index) saat ini berada pada anomali +0.12°C (dalam batas netral ±0.5°C). Hal ini mengindikasikan iklim cuaca di wilayah Indonesia normal tanpa adanya dorongan kemarau ekstrem (El Niño) maupun curah hujan berlebih (La Niña).",
    ensoAnom: "Anomali Niño 3.4",
    ensoSST: "SST Samudra Pasifik",
    ensoSeason: "Prediksi Musim",
    ensoTransition: "Transisi Kemarau",
    timelineEmpty: "Belum ada riwayat timeline bencana."
  },
  en: {
    dashboardTitle: "NATIONAL DISASTER DASHBOARD",
    dashboardSubtitle: "Integrated Monitoring of Seismic, Volcanic, Wildfire & Extreme Weather",
    syncBtn: "Sync Data",
    lastSync: "Last synced:",
    tabQuake: "🌋 Earthquakes",
    tabHotspots: "🔥 Hotspots",
    tabRain: "🌧️ Rainfall",
    tabVolcano: "🏔️ Volcanoes",
    tabEnso: "🌊 La Niña & ENSO",

    volcanoStatusTitle: "Current Volcano Status",
    nationalStatsTitle: "National Volcano Statistics",
    activeCountLabel: "Active Volcanoes",
    highestActivityLabel: "Highest Activity",
    eruptionsTodayLabel: "Eruptions Today",
    volcanicHotspotsLabel: "Satellite Volcanic Hotspots",
    volcanoCompareTitle: "Volcano Parameter Comparison",
    volcanoCompareDesc: "Side-by-side comparison of volcanoes with high activity in Indonesia.",
    timelineTitle: "Activity Timeline & Logs (30 Days)",
    timelineDesc: "History of level upgrades and official VONA releases.",
    riskDashboardTitle: "Risk Indicator Dashboard",
    riskAviationLabel: "Aviation Risk",
    riskResidentLabel: "Resident Risk",
    riskHikerLabel: "Hiking Risk",
    riskHigh: "HIGH (ALERT/WARNING)",
    riskMedium: "MEDIUM (WATCH)",
    riskLow: "LOW / SAFE",
    userLocTitle: "Nearest Volcano Locator",
    userLocBtn: "Use My Location",
    userLocLoading: "Connecting to GPS satellites...",
    userLocSuccess: "Found the nearest volcano from your location!",
    userLocDistance: "Distance:",
    userLocDirection: "Direction:",
    userLocClosest: "Nearest Volcano:",
    eduTitle: "Volcanic Education & Safety Center",
    eduDesc: "Understand status levels and eruption safety protocols.",
    aiSummaryTitle: "AI Disaster Summary",
    aiSummaryDesc: "Automated user-friendly translation of technical magma data.",

    mapLayerTitle: "Multi-Layer Satellite Map Controls",
    layerVolcano: "🏔️ Volcanoes",
    layerQuake: "🌋 Earthquakes",
    layerHotspots: "🔥 FIRMS Hotspots",
    layerRain: "🌧️ GPM Rain Radar",
    layerHimawari: "☁️ Himawari Satellite",
    layerFlood: "🌊 Flood Posts",
    layerCyclone: "🌀 Tropical Cyclone",

    tblVolcano: "Volcano",
    tblStatus: "Eruption Status",
    tblAshHeight: "Ash Column",
    tblAshDirection: "Ash Direction",
    tblWeather: "Peak Weather",
    tblNoData: "No data available",
    
    eduHeader1: "Volcano Status Levels (Level I-IV)",
    eduBody1_1: "🟢 Level I (Normal): No significant visual or seismic activity changes.",
    eduBody1_2: "🟡 Level II (Watch): Increased activity observed around the crater.",
    eduBody1_3: "🟠 Level III (Alert): Clear seismic increase and strong eruption indicators.",
    eduBody1_4: "🔴 Level IV (Warning): Critical state with ongoing or imminent explosive eruption.",
    
    eduHeader2: "Aviation Color Codes (VONA)",
    eduBody2_1: "🔴 RED (Red): Eruption in progress with a high ash column in the atmosphere.",
    eduBody2_2: "🟠 ORANGE (Orange): High activity with ash clouds potentially hazarding aviation.",
    eduBody2_3: "🟡 YELLOW (Yellow): Volcanic activity above normal background levels.",
    
    eduHeader3: "Eruption Safety Tips",
    eduBody3_1: "😷 Wear masks and protective goggles to avoid inhaling volcanic ash.",
    eduBody3_2: "🚫 Keep away from river valleys due to potential cold lava mudflows.",
    eduBody3_3: "📻 Stay tuned to evacuation advisories from local volcano observers.",

    quakeHeader: "📋 Latest Earthquakes Report (USGS)",
    quakeDepth: "Depth",
    quakeTsunami: "🚨 Tsunami Warning",
    
    hotspotsHeader: "🔥 Wildfire Hotspot Detection (NASA FIRMS)",
    hotspotsEmpty: "No thermal hotspot anomalies detected in Indonesia at this time.",
    hotspotsSat: "Satellite",
    hotspotsConf: "Confidence",
    
    rainHeader: "🌧️ Precipitation & Flood Monitoring (NASA GPM / GFMS)",
    rainDesc: "Global precipitation maps (IMERG) monitor water accumulation over Indonesia to evaluate flash flood risks.",
    rainZoneTitle: "🌊 Flood Alert Areas",
    rainSemarang: "🌊 Semarang (City): Coastal tidal flood alert in northern Central Java.",
    rainDemak: "🌊 Demak (Wulan Dam): Temporary dam works under high river runoff load.",
    rainLuwu: "🌊 Luwu North: Mountain runoff triggering agricultural inundation alerts.",
    rainAnalysisTitle: "📡 GPM Satellite Analysis",
    rainAnalysisDesc: "Precipitation data from the core observatory updates every 30 minutes. Regions with intensity exceeding 50mm/hr risk flash floods in river systems.",
    
    ensoHeader: "🌊 Oceanic Climate Oscillation Monitoring (ENSO)",
    ensoStatusTitle: "EL NIÑO / LA NIÑA CYCLE STATUS",
    ensoNeutral: "NEUTRAL CONDITIONS",
    ensoDesc: "The ONI (Oceanic Niño Index) currently stands at +0.12°C (within neutral ±0.5°C boundaries). This indicates normal climate conditions in Indonesia without El Niño drought or La Niña excessive rainfall.",
    ensoAnom: "Niño 3.4 Anomaly",
    ensoSST: "Pacific Ocean SST",
    ensoSeason: "Season Forecast",
    ensoTransition: "Dry Transition",
    timelineEmpty: "No disaster timeline log history available."
  },
  ms: {
    dashboardTitle: "PAPAN PEMUKA KEBENCANAAN NASIONAL",
    dashboardSubtitle: "Sistem Pemantauan Bersepadu Seismik, Vulkanik, Kebakaran Hutan & Cuaca Ekstrem",
    syncBtn: "Sinkronisasi Data",
    lastSync: "Terakhir disinkronkan:",
    tabQuake: "🌋 Gempa Bumi",
    tabHotspots: "🔥 Titik Api",
    tabRain: "🌧️ Curah Hujan",
    tabVolcano: "🏔️ Gunung Berapi",
    tabEnso: "🌊 La Niña & ENSO",

    volcanoStatusTitle: "Status Gunung Berapi Terkini",
    nationalStatsTitle: "Statistik Gunung Berapi Nasional",
    activeCountLabel: "Gunung Berstatus Aktif",
    highestActivityLabel: "Aktiviti Tertinggi",
    eruptionsTodayLabel: "Letusan Hari Ini",
    volcanicHotspotsLabel: "Titik Panas Satelit",
    volcanoCompareTitle: "Perbandingan Parameter Gunung Berapi",
    volcanoCompareDesc: "Perbandingan bersebelahan gunung berapi dengan aktiviti tinggi di Indonesia.",
    timelineTitle: "Garis Masa & Log Aktiviti (30 Hari)",
    timelineDesc: "Sejarah kenaikan status dan keluaran rasmi VONA.",
    riskDashboardTitle: "Papan Pemuka Penunjuk Risiko",
    riskAviationLabel: "Risiko Penerbangan",
    riskResidentLabel: "Risiko Penduduk Sekitar",
    riskHikerLabel: "Risiko Pendakian",
    riskHigh: "TINGGI (SIAGA/AWAS)",
    riskMedium: "SEDANG (WASPADA)",
    riskLow: "RENDAH / SELAMAT",
    userLocTitle: "Pencarian Gunung Berapi Terdekat",
    userLocBtn: "Gunakan Lokasi Saya",
    userLocLoading: "Menghubungi satelit GPS...",
    userLocSuccess: "Menemui gunung berapi terdekat dari lokasi anda!",
    userLocDistance: "Jarak:",
    userLocDirection: "Arah:",
    userLocClosest: "Gunung Berapi Terdekat:",
    eduTitle: "Pusat Mitigasi & Edukasi Vulkanik",
    eduDesc: "Fahami tahap status dan protokol keselamatan letusan gunung berapi.",
    aiSummaryTitle: "AI Ringkasan Kebencanaan",
    aiSummaryDesc: "Terjemahan automatik data teknikal magma kepada ringkasan ringkas.",

    mapLayerTitle: "Kawalan Lapisan Peta Satelit Multi-Lapisan",
    layerVolcano: "🏔️ Gunung Berapi",
    layerQuake: "🌋 Gempa Bumi",
    layerHotspots: "🔥 Titik Api FIRMS",
    layerRain: "🌧️ Radar Hujan GPM",
    layerHimawari: "☁️ Satelit Himawari",
    layerFlood: "🌊 Pos Banjir",
    layerCyclone: "🌀 Siklon Tropika",

    tblVolcano: "Gunung Berapi",
    tblStatus: "Status Letusan",
    tblAshHeight: "Lajur Abu",
    tblAshDirection: "Arah Abu",
    tblWeather: "Cuaca Puncak",
    tblNoData: "Tiada data",
    
    eduHeader1: "Tahap Status Gunung Berapi (Tahap I-IV)",
    eduBody1_1: "🟢 Tahap I (Normal): Tiada perubahan aktiviti visual atau seismik secara signifikan.",
    eduBody1_2: "🟡 Tahap II (Waspada): Peningkatan aktiviti mula dikesan di sekitar kawah.",
    eduBody1_3: "🟠 Tahap III (Siaga): Peningkatan seismik yang jelas dan petunjuk kuat letusan.",
    eduBody1_4: "🔴 Tahap IV (Awas): Keadaan kritikal dengan letusan berterusan atau akan berlaku.",
    
    eduHeader2: "Maksud Kod Warna Penerbangan (VONA)",
    eduBody2_1: "🔴 RED (Merah): Letusan sedang berlaku dengan lajur abu tinggi di atmosfera.",
    eduBody2_2: "🟠 ORANGE (Jingga): Aktiviti tinggi dengan abu berisiko kepada penerbangan.",
    eduBody2_3: "🟡 YELLOW (Kuning): Aktiviti gunung berapi melebihi tahap normal latar belakang.",
    
    eduHeader3: "Tips Keselamatan Letusan",
    eduBody3_1: "😷 Pakai topeng muka dan gogal pelindung untuk mengelakkan habuk abu.",
    eduBody3_2: "🚫 Jauhi lembah sungai kerana risiko aliran lahar sejuk.",
    eduBody3_3: "📻 Dengar arahan pemindahan daripada pihak berkuasa tempatan.",

    quakeHeader: "📋 Laporan Gempa Bumi Terkini (USGS)",
    quakeDepth: "Kedalaman",
    quakeTsunami: "🚨 Amaran Tsunami",
    
    hotspotsHeader: "🔥 Pengesanan Titik Api Kebakaran Hutan (NASA FIRMS)",
    hotspotsEmpty: "Tiada anomali titik api dikesan di Indonesia pada masa ini.",
    hotspotsSat: "Satelit",
    hotspotsConf: "Kepercayaan",
    
    rainHeader: "🌧️ Pemantauan Curah Hujan & Banjir (NASA GPM / GFMS)",
    rainDesc: "Peta pemendakan global (IMERG) memantau pengumpulan air untuk menilai risiko banjir kilat.",
    rainZoneTitle: "🌊 Kawasan Amaran Banjir",
    rainSemarang: "🌊 Semarang (Bandar): Amaran banjir pasang surut di pesisir Jawa Tengah.",
    rainDemak: "🌊 Demak (Tanggul Wulan): Pembaikan empangan di bawah beban aliran sungai tinggi.",
    rainLuwu: "🌊 Luwu Utara: Aliran gunung mencetuskan amaran banjir pertanian.",
    rainAnalysisTitle: "📡 Analisis Satelit GPM",
    rainAnalysisDesc: "Data pemendakan dikemas kini setiap 30 minit. Kawasan melebihi 50mm/jam berisiko banjir kilat.",
    
    ensoHeader: "🌊 Pemantauan Ayunan Iklim Lautan (ENSO)",
    ensoStatusTitle: "STATUS KITARAN EL NIÑO / LA NIÑA",
    ensoNeutral: "KEADAAN NEUTRAL",
    ensoDesc: "Indeks ONI kini berada pada +0.12°C (dalam batas neutral ±0.5°C), menunjukkan cuaca normal di Indonesia tanpa kesan melampau.",
    ensoAnom: "Anomali Niño 3.4",
    ensoSST: "SST Lautan Pasifik",
    ensoSeason: "Ramalan Musim",
    ensoTransition: "Peralihan Kering",
    timelineEmpty: "Tiada sejarah log garis masa bencana tersedia."
  },
  zh: {
    dashboardTitle: "国家防灾减灾控制台",
    dashboardSubtitle: "地震活动、火山喷发、森林火点及极端天气综合监测系统",
    syncBtn: "同步数据",
    lastSync: "最后同步时间:",
    tabQuake: "🌋 地震活动",
    tabHotspots: "🔥 林火热点",
    tabRain: "🌧️ 降雨监测",
    tabVolcano: "🏔️ 活火山",
    tabEnso: "🌊 厄尔尼诺/ENSO",

    volcanoStatusTitle: "当前火山活动状态",
    nationalStatsTitle: "全国火山监测统计",
    activeCountLabel: "活跃火山数量",
    highestActivityLabel: "最高活动度",
    eruptionsTodayLabel: "今日喷发次数",
    volcanicHotspotsLabel: "卫星监测火山热点",
    volcanoCompareTitle: "火山关键参数对比",
    volcanoCompareDesc: "印尼境内高活动性火山的各项指标横向对比。",
    timelineTitle: "活动时间线与VONA日志 (30天)",
    timelineDesc: "历史警报级别变更及官方航空警报 (VONA) 发布记录。",
    riskDashboardTitle: "风险评估面板",
    riskAviationLabel: "航空安全风险",
    riskResidentLabel: "周边居民风险",
    riskHikerLabel: "登山探险风险",
    riskHigh: "高风险 (二级/一级)",
    riskMedium: "中等风险 (三级)",
    riskLow: "低风险 / 安全",
    userLocTitle: "最近活火山定位",
    userLocBtn: "获取我的位置",
    userLocLoading: "正在连接GPS卫星...",
    userLocSuccess: "已成功定位离您最近的活火山！",
    userLocDistance: "距离:",
    userLocDirection: "方位:",
    userLocClosest: "最近的火山:",
    eduTitle: "火山防灾科普与安全中心",
    eduDesc: "了解火山警报级别及喷发时的自救逃生指南。",
    aiSummaryTitle: "AI 防灾数据总结",
    aiSummaryDesc: "自动将繁琐的火山监测数据编译为通俗易懂的简明报告。",

    mapLayerTitle: "多图层卫星地图控制器",
    layerVolcano: "🏔️ 活火山",
    layerQuake: "🌋 地震活动",
    layerHotspots: "🔥 FIRMS 火点",
    layerRain: "🌧️ GPM 降水雷达",
    layerHimawari: "☁️ 向日葵卫星云图",
    layerFlood: "🌊 洪水监测点",
    layerCyclone: "🌀 热带气旋",

    tblVolcano: "火山名称",
    tblStatus: "警报级别",
    tblAshHeight: "喷发烟柱",
    tblAshDirection: "火山灰飘向",
    tblWeather: "山顶天气",
    tblNoData: "暂无数据",
    
    eduHeader1: "火山活动警报级别 (一级至四级)",
    eduBody1_1: "🟢 一级 (正常): 无明显的视觉或地震活动异常。",
    eduBody1_2: "🟡 二级 (注意): 火山口周围观测到活动度超过背景值。",
    eduBody1_3: "🟠 三级 (准备): 地震频次明显上升，有强烈的喷发迹象。",
    eduBody1_4: "🔴 四级 (警报): 临界状态，喷发已发生或随时可能爆发。",
    
    eduHeader2: "航空警报颜色代码 (VONA)",
    eduBody2_1: "🔴 红色 (RED): 喷发正在进行，火山灰柱大量进入大气层。",
    eduBody2_2: "🟠 橙色 (ORANGE): 火山高度活跃，烟尘可能危及航空航线。",
    eduBody2_3: "🟡 黄色 (YELLOW): 活动超过常规状态，正在密切监视中。",
    
    eduHeader3: "火山喷发防灾自救提示",
    eduBody3_1: "😷 佩戴防尘口罩与护目镜，避免吸入火山灰与有害气体。",
    eduBody3_2: "🚫 远离河谷与低洼地带，防范泥石流及冷火山浆冲击。",
    eduBody3_3: "📻 持续收听当地防灾部门发布的最新疏散指令。",

    quakeHeader: "📋 最新全球地震报告 (USGS)",
    quakeDepth: "震源深度",
    quakeTsunami: "🚨 海啸预警",
    
    hotspotsHeader: "🔥 卫星森林火灾热点 (NASA FIRMS)",
    hotspotsEmpty: "目前在印尼境内未检测到明显的热点异常。",
    hotspotsSat: "监测卫星",
    hotspotsConf: "置信度",
    
    rainHeader: "🌧️ 卫星降雨与气象防汛监测 (NASA GPM / GFMS)",
    rainDesc: "利用 GPM 卫星全球降水绘图(IMERG)实时跟踪印尼全境的累积降水量，用以预测潜在的山洪爆发风险。",
    rainZoneTitle: "🌊 汛情与洪涝警报区域",
    rainSemarang: "🌊 三宝垄 (市区): 爪哇北部沿海高潮位海水倒灌引发防汛警报。",
    rainDemak: "🌊 德马克 (乌兰水坝): 强径流汇入下，应急大坝处于高水位承压运行。",
    rainLuwu: "🌊 北路乌: 山区地表水大量汇集，部分农田面临积水风险。",
    rainAnalysisTitle: "📡 GPM 卫星降水分析",
    rainAnalysisDesc: "核心气象卫星数据每30分钟自动更新。降雨强度超过50毫米/小时的区域，河道系统发生暴洪的概率显著增加。",
    
    ensoHeader: "🌊 厄尔尼诺/拉尼娜南方涛动监测 (ENSO)",
    ensoStatusTitle: "南方涛动(ENSO)气候周期状态",
    ensoNeutral: "中性状态",
    ensoDesc: "当前海洋厄尔尼诺指数(ONI)为 +0.12°C（处于 ±0.5°C 的正常中性范围内）。这表明印尼目前处于正常气候，未受到拉尼娜多雨或厄尔尼诺干旱的显著影响。",
    ensoAnom: "Niño 3.4 异常值",
    ensoSST: "太平洋海面温度 (SST)",
    ensoSeason: "季度预测",
    ensoTransition: "干季过渡期",
    timelineEmpty: "暂无历史灾害事件日志记录。"
  },
  ja: {
    dashboardTitle: "防災・災害情報ダッシュボード",
    dashboardSubtitle: "地震・火山・林野火災・異常気象の統合監視システム",
    syncBtn: "データ同期",
    lastSync: "最終更新:",
    tabQuake: "🌋 地震情報",
    tabHotspots: "🔥 火点情報",
    tabRain: "🌧️ 降水量情報",
    tabVolcano: "🏔️ 活火山",
    tabEnso: "🌊 エルニーニョ/ENSO",

    volcanoStatusTitle: "最新の火山活動状況",
    nationalStatsTitle: "国内火山活動統計",
    activeCountLabel: "活動中の火山",
    highestActivityLabel: "最高活動レベル",
    eruptionsTodayLabel: "本日の噴火数",
    volcanicHotspotsLabel: "衛星検出火山熱点",
    volcanoCompareTitle: "火山活動パラメーター比較",
    volcanoCompareDesc: "インドネシア国内の主要な活火山の状態一覧比較。",
    timelineTitle: "活動タイムラインと航空警報 (30日間)",
    timelineDesc: "警戒レベルの移行履歴および公式航空火山情報 (VONA) の配信履歴。",
    riskDashboardTitle: "リスクインジケーター",
    riskAviationLabel: "航空危険度",
    riskResidentLabel: "住民安全リスク",
    riskHikerLabel: "登山禁止レベル",
    riskHigh: "高リスク (レベル4/3)",
    riskMedium: "中リスク (レベル2)",
    riskLow: "低リスク / 安全",
    userLocTitle: "最寄り火山検索",
    userLocBtn: "現在地を使用する",
    userLocLoading: "GPS衛星に接続中...",
    userLocSuccess: "現在地から最も近い火山を検出しました！",
    userLocDistance: "距離:",
    userLocDirection: "方位:",
    userLocClosest: "最寄りの火山:",
    eduTitle: "火山防災・教育センター",
    eduDesc: "火山の警戒レベルと噴火時の避難・安全確保手順について学びます。",
    aiSummaryTitle: "AI 防災要約レポート",
    aiSummaryDesc: "専門的な火山観測データをわかりやすい要約に自動翻訳します。",

    mapLayerTitle: "マルチレイヤー衛星地図コントロール",
    layerVolcano: "🏔️ 活火山",
    layerQuake: "🌋 地震活動",
    layerHotspots: "🔥 FIRMS 火点",
    layerRain: "🌧️ GPM 降水レーダー",
    layerHimawari: "☁️ ひまわり雲画像",
    layerFlood: "🌊 洪水警戒ポスト",
    layerCyclone: "🌀 熱帯低気圧",

    tblVolcano: "火山名",
    tblStatus: "警戒レベル",
    tblAshHeight: "噴煙高",
    tblAshDirection: "風下方向",
    tblWeather: "山頂気象",
    tblNoData: "データなし",
    
    eduHeader1: "火山噴火警戒レベル (レベル1〜4)",
    eduBody1_1: "🟢 レベル1 (活火山であることに留意): 目立った変化なし。",
    eduBody1_2: "🟡 レベル2 (火口周辺規制): 火口周辺で基準値を超える活動を観測。",
    eduBody1_3: "🟠 レベル3 (入山規制): 地震活動の明らかな増加、噴火の兆候。",
    eduBody1_4: "🔴 レベル4 (避難準備/避難): 重大な噴火が発生、または差し迫っている状態。",
    
    eduHeader2: "航空カラーコード (VONA)",
    eduBody2_1: "🔴 RED (赤): 噴火が発生中で、大量の火山灰が上空へ放出されています。",
    eduBody2_2: "🟠 ORANGE (橙): 高い火山活動を観測。航路に影響を与える恐れがあります。",
    eduBody2_3: "🟡 YELLOW (黄): 通常の背景レベルを超える火山活動を観測。",
    
    eduHeader3: "噴火時の安全対策アドバイス",
    eduBody3_1: "😷 火山灰の吸入を防ぐため、マスクと保護用ゴーグルを着用してください。",
    eduBody3_2: "🚫 土石流やラハールを避けるため、川沿いの谷間から避難してください。",
    eduBody3_3: "📻 防災機関が提供する公式の避難指示に常時注意してください。",

    quakeHeader: "📋 最新地震情報 (USGS)",
    quakeDepth: "震源の深さ",
    quakeTsunami: "🚨 津波警報",
    
    hotspotsHeader: "🔥 衛星森林火災ホットスポット (NASA FIRMS)",
    hotspotsEmpty: "現在インドネシア国内に目立った熱源異常は検出されていません。",
    hotspotsSat: "観測衛星",
    hotspotsConf: "信頼度",
    
    rainHeader: "🌧️ 降水量・水害監視 (NASA GPM / GFMS)",
    rainDesc: "気象衛星GPMによる観測データ(IMERG)を用い、洪水・浸水のリスクを評価します。",
    rainZoneTitle: "🌊 洪水・高潮警戒エリア",
    rainSemarang: "🌊 スマラン (市街地): ジャワ北部沿岸部での高潮による冠水警戒。",
    rainDemak: "🌊 デマック (ウラン堰): 河川流量増大による緊急堤防の水圧監視。",
    rainLuwu: "🌊 北ルウ: 山間部からの地表流出に伴う農地冠水への注意。",
    rainAnalysisTitle: "📡 GPM 衛星雨量分析",
    rainAnalysisDesc: "コア衛星雨量データは30分ごとに更新されます。降雨強度が50mm/hを超える地域では、河川流域でフラッシュフラッド（急激な増水）が発生するリスクが著しく高まります。",
    
    ensoHeader: "🌊 海洋気候振動監視 (ENSO)",
    ensoStatusTitle: "エルニーニョ / ラニーニャ サイクル状況",
    ensoNeutral: "中立状態",
    ensoDesc: "現在のONI（海洋エルニーニョ指数）は+0.12℃で、中立基準（±0.5℃）内です。インドネシアの気候は平年並みで、エルニーニョによる干ばつやラニーニャによる大雨の懸念はありません。",
    ensoAnom: "Niño 3.4 偏差",
    ensoSST: "太平洋海面水温 (SST)",
    ensoSeason: "季節予測",
    ensoTransition: "乾季移行期",
    timelineEmpty: "災害履歴ログはありません。"
  },
  ru: {
    dashboardTitle: "НАЦИОНАЛЬНАЯ ПАНЕЛЬ СТИХИЙНЫХ БЕДСТВИЙ",
    dashboardSubtitle: "Интегрированный мониторинг сейсмической, вулканической активности, лесных пожаров и экстремальной погоды",
    syncBtn: "Синхронизировать данные",
    lastSync: "Последняя синхронизация:",
    tabQuake: "🌋 Землетрясения",
    tabHotspots: "🔥 Точки возгорания",
    tabRain: "🌧️ Осадки",
    tabVolcano: "🏔️ Вулканы",
    tabEnso: "🌊 Эль-Ниньо и ENSO",

    volcanoStatusTitle: "Текущий статус вулканов",
    nationalStatsTitle: "Национальная статистика вулканов",
    activeCountLabel: "Активные вулканы",
    highestActivityLabel: "Наивысшая активность",
    eruptionsTodayLabel: "Извержения сегодня",
    volcanicHotspotsLabel: "Спутниковые тепловые точки вулканов",
    volcanoCompareTitle: "Сравнение параметров вулканов",
    volcanoCompareDesc: "Сравнение вулканов с высокой активностью в Индонезии бок о бок.",
    timelineTitle: "Хронология и логи активности (30 дней)",
    timelineDesc: "История изменения уровней активности и официальных выпусков VONA.",
    riskDashboardTitle: "Панель индикаторов риска",
    riskAviationLabel: "Авиационный риск",
    riskResidentLabel: "Риск для населения",
    riskHikerLabel: "Риск для туристов",
    riskHigh: "ВЫСОКИЙ (УГРОЗА/ОПАСНОСТЬ)",
    riskMedium: "СРЕДНИЙ (ПРЕДУПРЕЖДЕНИЕ)",
    riskLow: "НИЗКИЙ / БЕЗОПАСНО",
    userLocTitle: "Поиск ближайшего вулкана",
    userLocBtn: "Использовать мое местоположение",
    userLocLoading: "Подключение к спутникам GPS...",
    userLocSuccess: "Найден ближайший вулкан к вашему местоположению!",
    userLocDistance: "Расстояние:",
    userLocDirection: "Направление:",
    userLocClosest: "Ближайший вулкан:",
    eduTitle: "Образовательный центр и центр безопасности при извержениях",
    eduDesc: "Понимание уровней активности и протоколов безопасности при извержении вулкана.",
    aiSummaryTitle: "ИИ-сводка стихийных бедствий",
    aiSummaryDesc: "Автоматический понятный перевод технических данных магмы.",

    mapLayerTitle: "Управление многослойной спутниковой картой",
    layerVolcano: "🏔️ Вулканы",
    layerQuake: "🌋 Землетрясения",
    layerHotspots: "🔥 Очаги FIRMS",
    layerRain: "🌧️ Радар осадков GPM",
    layerHimawari: "☁️ Спутник Himawari",
    layerFlood: "🌊 Гидропосты",
    layerCyclone: "🌀 Тропический циклон",

    tblVolcano: "Вулкан",
    tblStatus: "Статус извержения",
    tblAshHeight: "Высота пепла",
    tblAshDirection: "Направление пепла",
    tblWeather: "Погода на вершине",
    tblNoData: "Нет доступных данных",
    
    eduHeader1: "Уровни статуса вулкана (Уровень I-IV)",
    eduBody1_1: "🟢 Уровень I (Нормальный): Нет значительных визуальных или сейсмических изменений.",
    eduBody1_2: "🟡 Уровень II (Внимание): Повышенная активность вокруг кратера.",
    eduBody1_3: "🟠 Уровень III (Тревога): Явное увеличение сейсмики и сильные признаки извержения.",
    eduBody1_4: "🔴 Уровень IV (Опасность): Критическое состояние с продолжающимся или неизбежным извержением.",
    
    eduHeader2: "Авиационные цветовые коды (VONA)",
    eduBody2_1: "🔴 RED (Красный): Извержение в процессе, высокий столб пепла в атмосфере.",
    eduBody2_2: "🟠 ORANGE (Оранжевый): Высокая активность с облаками пепла, потенциально опасными для авиации.",
    eduBody2_3: "🟡 YELLOW (Желтый): Вулканическая активность выше нормального фонового уровня.",
    
    eduHeader3: "Советы по безопасности при извержении",
    eduBody3_1: "😷 Носите маски и защитные очки, чтобы избежать вдыхания вулканического пепла.",
    eduBody3_2: "🚫 Держитесь подальше от речных долин из-за возможных селей.",
    eduBody3_3: "📻 Следите за рекомендациями по эвакуации от местных наблюдателей за вулканами.",

    quakeHeader: "📋 Последний отчет о землетрясениях (USGS)",
    quakeDepth: "Глубина",
    quakeTsunami: "🚨 Предупреждение о цунами",
    
    hotspotsHeader: "🔥 Обнаружение очагов лесных пожаров (NASA FIRMS)",
    hotspotsEmpty: "На данный момент тепловых аномалий в Индонезии не обнаружено.",
    hotspotsSat: "Спутник",
    hotspotsConf: "Доверие",
    
    rainHeader: "🌧️ Мониторинг осадков и наводнений (NASA GPM / GFMS)",
    rainDesc: "Глобальные карты осадков (IMERG) контролируют скопление воды над Индонезией для оценки риска внезапных наводнений.",
    rainZoneTitle: "🌊 Зоны подтоплений",
    rainSemarang: "🌊 Семаранг (город): Угроза приливных наводнений (Роб) на севере Явы.",
    rainDemak: "🌊 Демак (Дамба Вулан): Экстренные работы по укреплению плотины.",
    rainLuwu: "🌊 Северный Луву: Угроза затопления сельскохозяйственных угодий.",
    rainAnalysisTitle: "📡 Спутниковый анализ осадков GPM",
    rainAnalysisDesc: "Информация обновляется раз в 30 минут. При осадках более 50 мм/ч возникает риск селей.",
    
    ensoHeader: "🌊 Мониторинг колебаний климата океана (ENSO)",
    ensoStatusTitle: "СТАТУС КЛИМАТИЧЕСКИХ КОЛЕБАНИЙ EL NIÑO / LA NIÑA",
    ensoNeutral: "НЕЙТРАЛЬНЫЕ УСЛОВИЯ",
    ensoDesc: "Текущий индекс ONI составляет +0.12°C. Климатические условия в Индонезии соответствуют норме, засуха El Niño или наводнения La Niña не прогнозируются.",
    ensoAnom: "Аномалия Niño 3.4",
    ensoSST: "Температура океана SST",
    ensoSeason: "Прогноз сезона",
    ensoTransition: "Переход к суху",
    timelineEmpty: "История логов событий отсутствует."
  },
  fr: {
    dashboardTitle: "TABLEAU DE BORD NATIONAL DES CATASTROPHES",
    dashboardSubtitle: "Système de Surveillance Intégré Sismique, Volcanique, Feux de Forêt & Climat",
    syncBtn: "Synchroniser",
    lastSync: "Dernière synchro:",
    tabQuake: "🌋 Séismes",
    tabHotspots: "🔥 Foyers Actifs",
    tabRain: "🌧️ Précipitations",
    tabVolcano: "🏔️ Volcans",
    tabEnso: "🌊 La Niña & ENSO",

    volcanoStatusTitle: "Statut Actuel des Volcans",
    nationalStatsTitle: "Statistiques Volcaniques Nationales",
    activeCountLabel: "Volcans en Activité",
    highestActivityLabel: "Activité Maximale",
    eruptionsTodayLabel: "Éruptions Aujourd'hui",
    volcanicHotspotsLabel: "Points Chauds Volcaniques",
    volcanoCompareTitle: "Comparaison des Paramètres Volcaniques",
    volcanoCompareDesc: "Tableau comparatif des volcans à forte activité en Indonésie.",
    timelineTitle: "Chronologie & Journal d'Activité (30 Jours)",
    timelineDesc: "Historique des changements de niveau d'alerte et des avis VONA officiels.",
    riskDashboardTitle: "Indicateurs de Risque",
    riskAviationLabel: "Risque de l'Aviation",
    riskResidentLabel: "Risque des Riverains",
    riskHikerLabel: "Risque de Randonnée",
    riskHigh: "ÉLEVÉ (ALERTE ROUGE)",
    riskMedium: "MODÉRÉ (ATTENTION)",
    riskLow: "FAIBLE / SÉCURISÉ",
    userLocTitle: "Détecteur de Volcan Proche",
    userLocBtn: "Utiliser Ma Position",
    userLocLoading: "Connexion aux satellites GPS...",
    userLocSuccess: "Volcan actif le plus proche de chez vous localisé !",
    userLocDistance: "Distance:",
    userLocDirection: "Direction:",
    userLocClosest: "Volcan le plus proche:",
    eduTitle: "Centre d'Éducation & de Prévention Volcanique",
    eduDesc: "Comprendre les niveaux d'alerte et les consignes de sécurité.",
    aiSummaryTitle: "AI Résumé des Risques",
    aiSummaryDesc: "Traduction automatique intelligente des rapports volcaniques par l'IA.",

    mapLayerTitle: "Contrôle des Couches de Carte Satellite",
    layerVolcano: "🏔️ Volcans",
    layerQuake: "🌋 Séismes",
    layerHotspots: "🔥 Foyers FIRMS",
    layerRain: "🌧️ Radar Pluie GPM",
    layerHimawari: "☁️ Satellite Himawari",
    layerFlood: "🌊 Vigilance Crue",
    layerCyclone: "🌀 Cyclones Tropiques",

    tblVolcano: "Volcan",
    tblStatus: "Statut d'Alerte",
    tblAshHeight: "Colonne de Cendres",
    tblAshDirection: "Direction des Cendres",
    tblWeather: "Météo au Sommet",
    tblNoData: "Aucune donnée disponible",
    
    eduHeader1: "Niveaux d'Alerte Volcanique (Niveaux I-IV)",
    eduBody1_1: "🟢 Niveau I (Normal): Pas de modification notable de l'activité visuelle ou sismique.",
    eduBody1_2: "🟡 Niveau II (Vigilance): Début d'augmentation de l'activité autour du cratère.",
    eduBody1_3: "🟠 Niveau III (Alerte): Augmentation sismique évidente et signes forts d'éruption.",
    eduBody1_4: "🔴 Niveau IV (Danger): Éruption majeure en cours ou imminente.",
    
    eduHeader2: "Codes Couleur pour l'Aviation (VONA)",
    eduBody2_1: "🔴 RED (Rouge): Éruption en cours avec panache de cendres s'élevant dans l'atmosphère.",
    eduBody2_2: "🟠 ORANGE (Orange): Forte activité présentant un danger potentiel pour les moteurs d'avions.",
    eduBody2_3: "🟡 YELLOW (Jaune): Activité supérieure au niveau de fond normal, surveillance active.",
    
    eduHeader3: "Consignes de Sécurité lors d'une Éruption",
    eduBody3_1: "😷 Portez un masque et des lunettes de protection pour éviter d'inhaler les poussières de cendre.",
    eduBody3_2: "🚫 Évitez les lits de rivières en raison du danger des coulées de boue volcaniques (lahars).",
    eduBody3_3: "📻 Suivez attentivement les consignes d'évacuation diffusées par les autorités locales.",

    quakeHeader: "📋 Derniers Séismes Enregistrés (USGS)",
    quakeDepth: "Profondeur",
    quakeTsunami: "🚨 Alerte Tsunami",
    
    hotspotsHeader: "🔥 Détection des Feux de Forêt (NASA FIRMS)",
    hotspotsEmpty: "Aucun foyer thermique détecté en Indonésie actuellement.",
    hotspotsSat: "Satellite",
    hotspotsConf: "Fiabilité",
    
    rainHeader: "🌧️ Surveillance des Pluies & Crue (NASA GPM / GFMS)",
    rainDesc: "Le suivi de précipitations globales (IMERG) estime l'accumulation d'eau pour évaluer le risque d'inondation soudaine.",
    rainZoneTitle: "🌊 Zones en Alerte Inondation",
    rainSemarang: "🌊 Semarang (Ville): Alerte inondation de marée sur la côte nord de Java.",
    rainDemak: "🌊 Demak (Digue de Wulan): Travaux d'urgence sous forte pression fluviale.",
    rainLuwu: "🌊 Luwu Nord: Crues subites inondant les plaines agricoles.",
    rainAnalysisTitle: "📡 Analyse Satellite GPM",
    rainAnalysisDesc: "Données de pluie actualisées toutes les 30 minutes. Risque d'inondation flash dès 50mm/h.",
    
    ensoHeader: "🌊 Suivi des Oscillations Climatiques (ENSO)",
    ensoStatusTitle: "STATUT DU CYCLE CLIMATIQUE EL NIÑO / LA NIÑA",
    ensoNeutral: "CONDITIONS NEUTRES",
    ensoDesc: "L'indice ONI actuel affiche +0.12°C (dans la plage neutre de ±0.5°C). Les conditions en Indonésie restent de saison, sans perturbation majeure.",
    ensoAnom: "Anomalie Niño 3.4",
    ensoSST: "Température Mer SST",
    ensoSeason: "Prévision de Saison",
    ensoTransition: "Transition Sèche",
    timelineEmpty: "Aucun historique des risques disponible."
  }
};

const lblDict: Record<string, Record<string, string>> = {
  id: {
    lblCoordinates: "Koordinat",
    lblAshDirection: "Arah Abu",
    lblWeather: "Cuaca",
    lblNone: "Nihil"
  },
  en: {
    lblCoordinates: "Coordinates",
    lblAshDirection: "Ash Direction",
    lblWeather: "Weather",
    lblNone: "None"
  },
  ms: {
    lblCoordinates: "Koordinat",
    lblAshDirection: "Arah Abu",
    lblWeather: "Cuaca",
    lblNone: "Tiada"
  },
  zh: {
    lblCoordinates: "坐标",
    lblAshDirection: "火山灰飘向",
    lblWeather: "天气",
    lblNone: "无"
  },
  ja: {
    lblCoordinates: "座標",
    lblAshDirection: "風下方向",
    lblWeather: "天気",
    lblNone: "なし"
  },
  ru: {
    lblCoordinates: "Координаты",
    lblAshDirection: "Направление пепла",
    lblWeather: "Погода",
    lblNone: "Нет"
  },
  fr: {
    lblCoordinates: "Coordonnées",
    lblAshDirection: "Direction des cendres",
    lblWeather: "Météo",
    lblNone: "Aucun"
  }
};

const dcDict: Record<string, Record<string, string>> = {
  id: {
    tabDataCenter: "🗄️ Pusat Data & Arsip",
    dcTitle: "Portal Big Data & Arsip Kebencanaan Terpadu",
    dcSubtitle: "Pencarian, Analisis Tren AI, dan Ekspor Data Laporan Historis Bencana",
    dcFilterCat: "Kategori Bencana",
    dcFilterAll: "Semua Kategori",
    dcFilterQuake: "Gempa Bumi",
    dcFilterVolcano: "Gunung Api",
    dcFilterHotspots: "Titik Api / Karhutla",
    dcFilterCyclone: "Siklon Tropis",
    dcFilterFlood: "Banjir",
    dcFilterTsunami: "Tsunami",
    dcFilterWeather: "Cuaca Indonesia / Ekstrem",
    dcFilterRegion: "Wilayah Cakupan",
    dcFilterRegionAll: "Global & Indonesia",
    dcFilterRegionId: "Indonesia Only",
    dcFilterStartDate: "Tanggal Mulai",
    dcFilterEndDate: "Tanggal Selesai",
    dcSearchPlaceholder: "Cari berdasarkan nama lokasi atau detail...",
    dcBtnVoice: "Cari dengan Suara",
    dcBtnVoiceListening: "Mendengarkan...",
    dcBtnVoiceNoMatch: "Suara kurang jelas, coba lagi.",
    dcTableColType: "Tipe",
    dcTableColTitle: "Kejadian & Parameter",
    dcTableColLocation: "Lokasi",
    dcTableColSeverity: "Tingkat Bahaya",
    dcTableColTime: "Waktu Kejadian",
    dcTableEmpty: "Tidak ditemukan rekaman bencana untuk kriteria filter ini.",
    dcBtnExportJSON: "Ekspor JSON",
    dcBtnExportCSV: "Ekspor CSV",
    dcBtnExportGeoJSON: "Ekspor GeoJSON",
    dcBtnExportExcel: "Ekspor Excel",
    dcBtnExportPDF: "Unduh Laporan PDF",
    dcAISumTitle: "Analisis AI Tren Kebencanaan",
    dcAISumDesc: "Rangkuman otomatis tren kebencanaan berdasarkan kriteria pencarian aktif Anda.",
    dcAISumBtn: "Generate Ringkasan AI",
    dcAISumLoading: "Menganalisis data..."
  },
  en: {
    tabDataCenter: "🗄️ Data Center & Archives",
    dcTitle: "Integrated Big Data & Disaster Archives",
    dcSubtitle: "Search, AI Trend Analysis, and Historical Disaster Report Export",
    dcFilterCat: "Disaster Category",
    dcFilterAll: "All Categories",
    dcFilterQuake: "Earthquakes",
    dcFilterVolcano: "Volcanoes",
    dcFilterHotspots: "Wildfire Hotspots",
    dcFilterCyclone: "Tropical Cyclones",
    dcFilterFlood: "Flooding",
    dcFilterTsunami: "Tsunami Warning",
    dcFilterWeather: "Indonesian / Extreme Weather",
    dcFilterRegion: "Region Scope",
    dcFilterRegionAll: "Global & Indonesia",
    dcFilterRegionId: "Indonesia Only",
    dcFilterStartDate: "Start Date",
    dcFilterEndDate: "End Date",
    dcSearchPlaceholder: "Search by location name or details...",
    dcBtnVoice: "Voice Search",
    dcBtnVoiceListening: "Listening...",
    dcBtnVoiceNoMatch: "Voice unclear, try again.",
    dcTableColType: "Type",
    dcTableColTitle: "Event & Parameters",
    dcTableColLocation: "Location",
    dcTableColSeverity: "Severity",
    dcTableColTime: "Event Time",
    dcTableEmpty: "No disaster records found for this filter criteria.",
    dcBtnExportJSON: "Export JSON",
    dcBtnExportCSV: "Export CSV",
    dcBtnExportGeoJSON: "Export GeoJSON",
    dcBtnExportExcel: "Export Excel",
    dcBtnExportPDF: "Download PDF Report",
    dcAISumTitle: "AI Disaster Trend Analysis",
    dcAISumDesc: "Automatic summary of disaster trends based on your active search criteria.",
    dcAISumBtn: "Generate AI Summary",
    dcAISumLoading: "Analyzing historical data..."
  },
  ms: {
    tabDataCenter: "🗄️ Pusat Data & Arkib",
    dcTitle: "Big Data & Arkib Kebencanaan Bersepadu",
    dcSubtitle: "Carian, Analisis Trend IA, dan Eksport Laporan Kebencanaan Historis",
    dcFilterCat: "Kategori Bencana",
    dcFilterAll: "Semua Kategori",
    dcFilterQuake: "Gempa Bumi",
    dcFilterVolcano: "Gunung Berapi",
    dcFilterHotspots: "Titik Api / Karhutla",
    dcFilterCyclone: "Siklon Tropika",
    dcFilterFlood: "Banjir",
    dcFilterTsunami: "Amaran Tsunami",
    dcFilterWeather: "Cuaca Indonesia / Melampau",
    dcFilterRegion: "Wilayah Liputan",
    dcFilterRegionAll: "Global & Indonesia",
    dcFilterRegionId: "Indonesia Sahaja",
    dcFilterStartDate: "Tarikh Mula",
    dcFilterEndDate: "Tarikh Tamat",
    dcSearchPlaceholder: "Cari berdasarkan nama lokasi atau butiran...",
    dcBtnVoice: "Cari dengan Suara",
    dcBtnVoiceListening: "Mendengar...",
    dcBtnVoiceNoMatch: "Suara kurang jelas, cuba lagi.",
    dcTableColType: "Jenis",
    dcTableColTitle: "Kejadian & Parameter",
    dcTableColLocation: "Lokasi",
    dcTableColSeverity: "Tahap Bahaya",
    dcTableColTime: "Waktu Kejadian",
    dcTableEmpty: "Tiada rekod bencana ditemui untuk kriteria penapis ini.",
    dcBtnExportJSON: "Eksport JSON",
    dcBtnExportCSV: "Eksport CSV",
    dcBtnExportGeoJSON: "Eksport GeoJSON",
    dcBtnExportExcel: "Eksport Excel",
    dcBtnExportPDF: "Muat Turun Laporan PDF",
    dcAISumTitle: "Analisis AI Trend Kebencanaan",
    dcAISumDesc: "Rangkuman automatik trend kebencanaan berdasarkan kriteria carian aktif anda.",
    dcAISumBtn: "Jana Ringkasan AI",
    dcAISumLoading: "Menganalisis data sejarah..."
  },
  zh: {
    tabDataCenter: "🗄️ 数据中心与档案",
    dcTitle: "防灾大数据与历史档案库",
    dcSubtitle: "搜索、AI趋势分析和历史灾害报告导出",
    dcFilterCat: "灾害类别",
    dcFilterAll: "所有类别",
    dcFilterQuake: "地震活动",
    dcFilterVolcano: "火山活动",
    dcFilterHotspots: "林火热点",
    dcFilterCyclone: "热带气旋",
    dcFilterFlood: "洪水",
    dcFilterTsunami: "海啸预警",
    dcFilterWeather: "印尼天气 / 极端天气",
    dcFilterRegion: "区域范围",
    dcFilterRegionAll: "全球与印尼",
    dcFilterRegionId: "仅印尼",
    dcFilterStartDate: "开始日期",
    dcFilterEndDate: "结束日期",
    dcSearchPlaceholder: "按位置名称或详情搜索...",
    dcBtnVoice: "语音搜索",
    dcBtnVoiceListening: "正在聆听...",
    dcBtnVoiceNoMatch: "语音不清晰，请重试。",
    dcTableColType: "类别",
    dcTableColTitle: "事件与参数",
    dcTableColLocation: "位置",
    dcTableColSeverity: "危险度",
    dcTableColTime: "发生时间",
    dcTableEmpty: "未找到符合筛选条件的灾害记录。",
    dcBtnExportJSON: "导出 JSON",
    dcBtnExportCSV: "导出 CSV",
    dcBtnExportGeoJSON: "导出 GeoJSON",
    dcBtnExportExcel: "导出 Excel",
    dcBtnExportPDF: "下载 PDF 报告",
    dcAISumTitle: "AI灾害趋势分析",
    dcAISumDesc: "基于您当前搜索条件的自动灾害趋势汇总分析报告。",
    dcAISumBtn: "生成 AI 总结",
    dcAISumLoading: "正在分析历史数据..."
  },
  ja: {
    tabDataCenter: "🗄️ データセンターとアーカイブ",
    dcTitle: "総合防災ビッグデータ＆アーカイブ",
    dcSubtitle: "検索、AIトレンド分析、歴史的災害報告書の出力",
    dcFilterCat: "災害カテゴリ",
    dcFilterAll: "すべてのカテゴリ",
    dcFilterQuake: "地震活動",
    dcFilterVolcano: "火山活動",
    dcFilterHotspots: "森林火災熱点",
    dcFilterCyclone: "熱帯性低気圧",
    dcFilterFlood: "洪水",
    dcFilterTsunami: "津波警報",
    dcFilterWeather: "インドネシアの気象 / 極端な気象",
    dcFilterRegion: "地域範囲",
    dcFilterRegionAll: "グローバル＆インドネシア",
    dcFilterRegionId: "インドネシアのみ",
    dcFilterStartDate: "開始日",
    dcFilterEndDate: "終了日",
    dcSearchPlaceholder: "場所名または詳細で検索...",
    dcBtnVoice: "音声検索",
    dcBtnVoiceListening: "聞き取り中...",
    dcBtnVoiceNoMatch: "音声が不明瞭です。もう一度お試しください。",
    dcTableColType: "タイプ",
    dcTableColTitle: "イベントとパラメータ",
    dcTableColLocation: "場所",
    dcTableColSeverity: "危険度",
    dcTableColTime: "発生日時",
    dcTableEmpty: "この検索条件に該当する災害データはありません。",
    dcBtnExportJSON: "JSON出力",
    dcBtnExportCSV: "CSV出力",
    dcBtnExportGeoJSON: "GeoJSON出力",
    dcBtnExportExcel: "Excel出力",
    dcBtnExportPDF: "PDFレポートをダウンロード",
    dcAISumTitle: "AI災害トレンド分析",
    dcAISumDesc: "現在のアкティブな検索条件に基づく災害状況のAI要約レポート。",
    dcAISumBtn: "AI要約を作成",
    dcAISumLoading: "履歴データを分析中..."
  },
  ru: {
    tabDataCenter: "🗄️ Центр данных и архивы",
    dcTitle: "Интегрированные Биг Дата и Архивы Катаклизмов",
    dcSubtitle: "Поиск, ИИ-анализ трендов и экспорт исторических отчетов о бедствиях",
    dcFilterCat: "Категория катаклизма",
    dcFilterAll: "Все категории",
    dcFilterQuake: "Землетрясения",
    dcFilterVolcano: "Вулканы",
    dcFilterHotspots: "Лесные пожары",
    dcFilterCyclone: "Тропические циклоны",
    dcFilterFlood: "Наводнения",
    dcFilterTsunami: "Предупреждение о цунами",
    dcFilterWeather: "Погода Индонезии / Экстремальная",
    dcFilterRegion: "Регион покрытия",
    dcFilterRegionAll: "Глобальный и Индонезия",
    dcFilterRegionId: "Только Индонезия",
    dcFilterStartDate: "Дата начала",
    dcFilterEndDate: "Дата окончания",
    dcSearchPlaceholder: "Поиск по названию места или деталям...",
    dcBtnVoice: "Голосовой поиск",
    dcBtnVoiceListening: "Слушаю...",
    dcBtnVoiceNoMatch: "Речь не распознана, попробуйте еще раз.",
    dcTableColType: "Тип",
    dcTableColTitle: "Событие и параметры",
    dcTableColLocation: "Местоположение",
    dcTableColSeverity: "Уровень опасности",
    dcTableColTime: "Время события",
    dcTableEmpty: "Не найдено записей катаклизмов по указанным фильтрам.",
    dcBtnExportJSON: "Экспорт JSON",
    dcBtnExportCSV: "Экспорт CSV",
    dcBtnExportGeoJSON: "Экспорт GeoJSON",
    dcBtnExportExcel: "Экспорт Excel",
    dcBtnExportPDF: "Скачать PDF отчет",
    dcAISumTitle: "AI Анализ трендов бедствий",
    dcAISumDesc: "Автоматическая сводка ИИ о текущих катаклизмах на основе ваших критериев поиска.",
    dcAISumBtn: "Создать AI сводку",
    dcAISumLoading: "Анализ исторических данных..."
  },
  fr: {
    tabDataCenter: "🗄️ Centre de Données & Archives",
    dcTitle: "Big Data & Archives des Catastrophes",
    dcSubtitle: "Recherche, Analyse de Tendances IA, et Exportation de Rapports Historiques",
    dcFilterCat: "Catégorie de Risque",
    dcFilterAll: "Toutes Catégories",
    dcFilterQuake: "Séismes",
    dcFilterVolcano: "Volcans",
    dcFilterHotspots: "Foyers de Feux",
    dcFilterCyclone: "Cyclones Tropicaux",
    dcFilterFlood: "Inondations",
    dcFilterTsunami: "Alerte Tsunami",
    dcFilterWeather: "Météo Indonésie / Extrême",
    dcFilterRegion: "Champ d'action",
    dcFilterRegionAll: "Mondial & Indonésie",
    dcFilterRegionId: "Indonésie Uniquement",
    dcFilterStartDate: "Date de Début",
    dcFilterEndDate: "Date de Fin",
    dcSearchPlaceholder: "Rechercher par lieu ou détails...",
    dcBtnVoice: "Recherche Vocale",
    dcBtnVoiceListening: "Écoute en cours...",
    dcBtnVoiceNoMatch: "Voix peu claire, réessayez.",
    dcTableColType: "Type",
    dcTableColTitle: "Événement & Paramètres",
    dcTableColLocation: "Emplacement",
    dcTableColSeverity: "Sévérité",
    dcTableColTime: "Heure de l'Événement",
    dcTableEmpty: "Aucun enregistrement trouvé pour ces critères.",
    dcBtnExportJSON: "Exporter JSON",
    dcBtnExportCSV: "Exporter CSV",
    dcBtnExportGeoJSON: "Exporter GeoJSON",
    dcBtnExportExcel: "Exporter Excel",
    dcBtnExportPDF: "Télécharger le rapport PDF",
    dcAISumTitle: "Analyse IA des Tendances",
    dcAISumDesc: "Résumé automatique des tendances de catastrophes selon vos filtres actifs.",
    dcAISumBtn: "Générer Résumé IA",
    dcAISumLoading: "Analyse des données historiques..."
  }
};

function getLocalizedVolcanoName(name: string, lang: string) {
  if (lang === 'zh' || lang === 'ja') return `${name}火山`;
  if (lang === 'ru') return `Вулкан ${name}`;
  if (lang === 'fr') return `Mont ${name}`;
  if (lang === 'en') return `Mount ${name}`;
  return `Gunung ${name}`;
}

function getLocalizedStatusLevel(level: string, lang: string) {
  const levels: Record<string, Record<string, string>> = {
    id: { Awas: 'Level IV (Awas)', Siaga: 'Level III (Siaga)', Waspada: 'Level II (Waspada)', Normal: 'Level I (Normal)' },
    en: { Awas: 'Level IV (Warning)', Siaga: 'Level III (Alert)', Waspada: 'Level II (Watch)', Normal: 'Level I (Normal)' },
    ms: { Awas: 'Tahap IV (Awas)', Siaga: 'Tahap III (Siaga)', Waspada: 'Tahap II (Waspada)', Normal: 'Tahap I (Normal)' },
    zh: { Awas: '四级 (警报)', Siaga: '三级 (准备)', Waspada: '二级 (注意)', Normal: '一级 (正常)' },
    ja: { Awas: 'レベル4 (避難)', Siaga: 'レベル3 (入山規制)', Waspada: 'レベル2 (火口周辺規制)', Normal: 'レベル1 (平常)' },
    ru: { Awas: 'Уровень IV (Тревога)', Siaga: 'Уровень III (Опасность)', Waspada: 'Уровень II (Внимание)', Normal: 'Уровень I (Норма)' },
    fr: { Awas: 'Niveau IV (Danger)', Siaga: 'Niveau III (Alerte)', Waspada: 'Niveau II (Vigilance)', Normal: 'Niveau I (Normal)' }
  };
  return levels[lang]?.[level] || levels['id']?.[level] || level;
}

function getLocalizedWeather(weather: string, lang: string) {
  if (!weather) return '';
  const clean = weather.toLowerCase().trim();
  const weatherDict: Record<string, Record<string, string>> = {
    cerah: { id: 'Cerah', en: 'Clear', ms: 'Cerah', zh: '晴朗', ja: '晴れ', ru: 'Ясно', fr: 'Clair' },
    mendung: { id: 'Mendung', en: 'Overcast', ms: 'Mendung', zh: '阴天', ja: '曇り', ru: 'Пасмурно', fr: 'Nuageux' },
    hujan: { id: 'Hujan', en: 'Rainy', ms: 'Hujan', zh: '有雨', ja: '雨', ru: 'Дождь', fr: 'Pluvieux' },
    berawan: { id: 'Berawan', en: 'Cloudy', ms: 'Berawan', zh: '多云', ja: '曇りがち', ru: 'Облачно', fr: 'Nuageux' },
    gerimis: { id: 'Gerimis', en: 'Drizzle', ms: 'Gerimis', zh: '毛毛雨', ja: '小雨', ru: 'Морось', fr: 'Bruine' }
  };

  for (const [key, trans] of Object.entries(weatherDict)) {
    if (clean.includes(key)) {
      return trans[lang] || trans['id'];
    }
  }
  return weather;
}

function getLocalizedAshDirection(dir: string, lang: string, noneLabel: string) {
  if (!dir || dir.toLowerCase().trim() === 'nihil' || dir.trim() === '') return noneLabel;
  const clean = dir.toLowerCase().trim();
  const dirDict: Record<string, Record<string, string>> = {
    utara: { id: 'Utara', en: 'North', ms: 'Utara', zh: '北', ja: '北', ru: 'Север', fr: 'Nord' },
    selatan: { id: 'Selatan', en: 'South', ms: 'Selatan', zh: '南', ja: '南', ru: 'Юг', fr: 'Sud' },
    timur: { id: 'Timur', en: 'East', ms: 'Timur', zh: '东', ja: '東', ru: 'Восток', fr: 'Est' },
    barat: { id: 'Barat', en: 'West', ms: 'Barat', zh: '西', ja: '西', ru: 'Запад', fr: 'Ouest' },
    tenggara: { id: 'Tenggara', en: 'Southeast', ms: 'Tenggara', zh: '东南', ja: '南東', ru: 'Юго-восток', fr: 'Sud-Est' },
    baratdaya: { id: 'Barat Daya', en: 'Southwest', ms: 'Barat Daya', zh: '西南', ja: '南西', ru: 'Юго-запад', fr: 'Sud-Ouest' },
    baratlaut: { id: 'Barat Laut', en: 'Northwest', ms: 'Barat Laut', zh: '西北', ja: '北西', ru: 'Северо-запад', fr: 'Nord-Ouest' },
    timurlaut: { id: 'Timur Laut', en: 'Northeast', ms: 'Timur Laut', zh: '东北', ja: '北東', ru: 'Северо-восток', fr: 'Nord-Est' }
  };

  for (const [key, trans] of Object.entries(dirDict)) {
    if (clean.includes(key)) {
      return trans[lang] || trans['id'];
    }
  }
  return dir;
}

// ─── Compass and Distance helpers ──────────────────────────────────────────
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function getDirectionName(bearing: number, lang: string) {
  const directions = lang === 'id' || lang === 'ms' 
    ? ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut']
    : ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

const dcDataDict: Record<string, Record<string, string>> = {
  id: {
    quakeTitle: "Gempa Bumi",
    hotspotTitle: "Titik Api Karhutla",
    volcanoTitle: "Aktivitas Vulkanik",
    magnitude: "Magnitudo",
    depth: "Kedalaman",
    tsunami: "Berpotensi Tsunami",
    satellite: "Satelit",
    confidence: "Kepercayaan",
    thermalPower: "Kekuatan Termal",
    km: "km",
    high: "Tinggi",
    medium: "Sedang",
    low: "Rendah",
    nominal: "Nominal",
    source: "Sumber",
    category: "Kategori",
    coordinates: "Koordinat",
    description: "Deskripsi",
    noDescription: "Tidak ada deskripsi tambahan.",
    ashHeight: "Tinggi Kolom Abu",
    ashDir: "Arah Abu",
    weather: "Cuaca Sekitar",
    aviationCode: "Kode Aviasi",
    riskAviation: "Risiko Penerbangan",
    riskResident: "Risiko Penduduk",
    riskHiker: "Risiko Pendaki",
    temperature: "Suhu",
    humidity: "Kelembapan",
    windSpeed: "Kecepatan Angin",
    precipitation: "Presipitasi",
    condition: "Kondisi",
    notObserved: "Tidak teramati",
    'Cerah': 'Cerah',
    'Cerah Berawan': 'Cerah Berawan',
    'Berawan': 'Berawan',
    'Mendung': 'Mendung',
    'Kabut': 'Kabut',
    'Kabut Rime': 'Kabut Rime',
    'Gerimis Ringan': 'Gerimis Ringan',
    'Gerimis Sedang': 'Gerimis Sedang',
    'Gerimis Lebat': 'Gerimis Lebat',
    'Gerimis Beku Ringan': 'Gerimis Beku Ringan',
    'Gerimis Beku Lebat': 'Gerimis Beku Lebat',
    'Hujan Ringan': 'Hujan Ringan',
    'Hujan Sedang': 'Hujan Sedang',
    'Hujan Lebat': 'Hujan Lebat',
    'Hujan Beku Ringan': 'Hujan Beku Ringan',
    'Hujan Beku Lebat': 'Hujan Beku Lebat',
    'Salju Ringan': 'Salju Ringan',
    'Salju Sedang': 'Salju Sedang',
    'Salju Lebat': 'Salju Lebat',
    'Butiran Salju': 'Butiran Salju',
    'Hujan Shower Ringan': 'Hujan Shower Ringan',
    'Hujan Shower Sedang': 'Hujan Shower Sedang',
    'Hujan Shower Lebat': 'Hujan Shower Lebat',
    'Hujan Salju Ringan': 'Hujan Salju Ringan',
    'Hujan Salju Lebat': 'Hujan Salju Lebat',
    'Badai Petir': 'Badai Petir',
    'Badai Petir dengan Es Ringan': 'Badai Petir dengan Es Ringan',
    'Badai Petir dengan Es Lebat': 'Badai Petir dengan Es Lebat',
    indonesiaEonet: "Indonesia (Wilayah Spasial EONET)",
    global: "Global",
  },
  en: {
    quakeTitle: "Earthquake",
    hotspotTitle: "Wildfire Hotspot",
    volcanoTitle: "Volcanic Activity",
    magnitude: "Magnitude",
    depth: "Depth",
    tsunami: "Tsunami Potential",
    satellite: "Satellite",
    confidence: "Confidence",
    thermalPower: "Thermal Power",
    km: "km",
    high: "High",
    medium: "Medium",
    low: "Low",
    nominal: "Nominal",
    source: "Source",
    category: "Category",
    coordinates: "Coordinates",
    description: "Description",
    noDescription: "No additional description.",
    ashHeight: "Ash Column Height",
    ashDir: "Ash Direction",
    weather: "Surrounding Weather",
    aviationCode: "Aviation Code",
    riskAviation: "Aviation Risk",
    riskResident: "Resident Risk",
    riskHiker: "Hiking Risk",
    temperature: "Temperature",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    precipitation: "Precipitation",
    condition: "Condition",
    notObserved: "Not observed",
    'Cerah': 'Clear',
    'Cerah Berawan': 'Partly Cloudy',
    'Berawan': 'Cloudy',
    'Mendung': 'Overcast',
    'Kabut': 'Fog',
    'Kabut Rime': 'Depositing Rime Fog',
    'Gerimis Ringan': 'Light Drizzle',
    'Gerimis Sedang': 'Moderate Drizzle',
    'Gerimis Lebat': 'Dense Drizzle',
    'Gerimis Beku Ringan': 'Light Freezing Drizzle',
    'Gerimis Beku Lebat': 'Dense Freezing Drizzle',
    'Hujan Ringan': 'Slight Rain',
    'Hujan Sedang': 'Moderate Rain',
    'Hujan Lebat': 'Heavy Rain',
    'Hujan Beku Ringan': 'Light Freezing Rain',
    'Hujan Beku Lebat': 'Heavy Freezing Rain',
    'Salju Ringan': 'Slight Snow Fall',
    'Salju Sedang': 'Moderate Snow Fall',
    'Salju Lebat': 'Heavy Snow Fall',
    'Butiran Salju': 'Snow Grains',
    'Hujan Shower Ringan': 'Slight Rain Showers',
    'Hujan Shower Sedang': 'Moderate Rain Showers',
    'Hujan Shower Lebat': 'Violent Rain Showers',
    'Hujan Salju Ringan': 'Slight Snow Showers',
    'Hujan Salju Lebat': 'Heavy Snow Showers',
    'Badai Petir': 'Thunderstorm',
    'Badai Petir dengan Es Ringan': 'Thunderstorm with Slight Hail',
    'Badai Petir dengan Es Lebat': 'Thunderstorm with Heavy Hail',
    indonesiaEonet: "Indonesia (EONET Spatial)",
    global: "Global",
  },
  ms: {
    quakeTitle: "Gempa Bumi",
    hotspotTitle: "Titik Api Karhutla",
    volcanoTitle: "Aktiviti Vulkanik",
    magnitude: "Magnitud",
    depth: "Kedalaman",
    tsunami: "Berpotensi Tsunami",
    satellite: "Satelit",
    confidence: "Kepercayaan",
    thermalPower: "Kuasa Termal",
    km: "km",
    high: "Tinggi",
    medium: "Sederhana",
    low: "Rendah",
    nominal: "Nominal",
    source: "Sumber",
    category: "Kategori",
    coordinates: "Koordinat",
    description: "Huraian",
    noDescription: "Tiada huraian tambahan.",
    ashHeight: "Tinggi Lajur Abu",
    ashDir: "Arah Abu",
    weather: "Cuaca Sekitar",
    aviationCode: "Kod Penerbangan",
    riskAviation: "Risiko Penerbangan",
    riskResident: "Risiko Penduduk",
    riskHiker: "Risiko Pendaki",
    temperature: "Suhu",
    humidity: "Kelembapan",
    windSpeed: "Kelajuan Angin",
    precipitation: "Presipitasi",
    condition: "Keadaan",
    notObserved: "Tidak diperhatikan",
    'Cerah': 'Cerah',
    'Cerah Berawan': 'Cerah Berawan',
    'Berawan': 'Berawan',
    'Mendung': 'Mendung',
    'Kabut': 'Kabus',
    'Kabut Rime': 'Kabus Rime',
    'Gerimis Ringan': 'Gerimis Ringan',
    'Gerimis Sedang': 'Gerimis Sederhana',
    'Gerimis Lebat': 'Gerimis Lebat',
    'Gerimis Beku Ringan': 'Gerimis Beku Ringan',
    'Gerimis Beku Lebat': 'Gerimis Beku Lebat',
    'Hujan Ringan': 'Hujan Ringan',
    'Hujan Sedang': 'Hujan Sederhana',
    'Hujan Lebat': 'Hujan Lebat',
    'Hujan Beku Ringan': 'Hujan Beku Ringan',
    'Hujan Beku Lebat': 'Hujan Beku Lebat',
    'Salju Ringan': 'Salji Ringan',
    'Salju Sedang': 'Salji Sederhana',
    'Salju Lebat': 'Salji Lebat',
    'Butiran Salju': 'Butir Salji',
    'Hujan Shower Ringan': 'Hujan Shower Ringan',
    'Hujan Shower Sedang': 'Hujan Shower Sederhana',
    'Hujan Shower Lebat': 'Hujan Shower Lebat',
    'Hujan Salju Ringan': 'Hujan Salji Ringan',
    'Hujan Salju Lebat': 'Hujan Salji Lebat',
    'Badai Petir': 'Ribut Petir',
    'Badai Petir dengan Es Ringan': 'Ribut Petir dengan Hujan Batu Ringan',
    'Badai Petir dengan Es Lebat': 'Ribut Petir dengan Hujan Batu Lebat',
    indonesiaEonet: "Indonesia (Kawasan Spasial EONET)",
    global: "Global",
  },
  zh: {
    quakeTitle: "地震活动",
    hotspotTitle: "林火热点",
    volcanoTitle: "火山活动",
    magnitude: "震级",
    depth: "深度",
    tsunami: "海啸预警",
    satellite: "卫星",
    confidence: "置信度",
    thermalPower: "热辐射功率",
    km: "千米",
    high: "高",
    medium: "中",
    low: "低",
    nominal: "正常",
    source: "来源",
    category: "类别",
    coordinates: "坐标",
    description: "描述",
    noDescription: "无附加说明。",
    ashHeight: "喷发烟柱高度",
    ashDir: "火山灰飘向",
    weather: "周边天气",
    aviationCode: "航空警报级别",
    riskAviation: "航空安全风险",
    riskResident: "周边居民风险",
    riskHiker: "登山安全风险",
    temperature: "温度",
    humidity: "湿度",
    windSpeed: "风速",
    precipitation: "降水量",
    condition: "天候状态",
    notObserved: "未观测到",
    'Cerah': '晴朗',
    'Cerah Berawan': '多云',
    'Berawan': '阴天',
    'Mendung': '阴沉',
    'Kabut': '雾',
    'Kabut Rime': '雾凇',
    'Gerimis Ringan': '小毛毛雨',
    'Gerimis Sedang': '毛毛雨',
    'Gerimis Lebat': '大毛毛雨',
    'Gerimis Beku Ringan': '轻微冻毛毛雨',
    'Gerimis Beku Lebat': '严重冻毛毛雨',
    'Hujan Ringan': '小雨',
    'Hujan Sedang': '中雨',
    'Hujan Lebat': '大雨',
    'Hujan Beku Ringan': '轻微冻雨',
    'Hujan Beku Lebat': '严重冻雨',
    'Salju Ringan': '小雪',
    'Salju Sedang': '中雪',
    'Salju Lebat': '大雪',
    'Butiran Salju': '米雪',
    'Hujan Shower Ringan': '阵雨',
    'Hujan Shower Sedang': '中度阵雨',
    'Hujan Shower Lebat': '强阵雨',
    'Hujan Salju Ringan': '小阵雪',
    'Hujan Salju Lebat': '大阵雪',
    'Badai Petir': '雷阵雨',
    'Badai Petir dengan Es Ringan': '伴有小冰雹的雷暴',
    'Badai Petir dengan Es Lebat': '伴有大冰雹的雷暴',
    indonesiaEonet: "印度尼西亚 (EONET空间)",
    global: "全球",
  },
  ja: {
    quakeTitle: "地震活動",
    hotspotTitle: "森林火災熱点",
    volcanoTitle: "火山活動",
    magnitude: "マグニチュード",
    depth: "深さ",
    tsunami: "津波の可能性あり",
    satellite: "人工衛星",
    confidence: "信頼度",
    thermalPower: "熱出力",
    km: "km",
    high: "高",
    medium: "中",
    low: "低",
    nominal: "正常",
    source: "情報源",
    category: "カテゴリ",
    coordinates: "座標",
    description: "説明",
    noDescription: "追加の説明はありません。",
    ashHeight: "噴煙高度",
    ashDir: "風下方向",
    weather: "周辺気象",
    aviationCode: "航空カラーコード",
    riskAviation: "航空危険度",
    riskResident: "住民安全リスク",
    riskHiker: "登山禁止レベル",
    temperature: "気温",
    humidity: "湿度",
    windSpeed: "風速",
    precipitation: "降水量",
    condition: "天候状態",
    notObserved: "観測されず",
    'Cerah': '晴れ',
    'Cerah Berawan': '晴れ時々曇り',
    'Berawan': '曇り',
    'Mendung': '本曇り',
    'Kabut': '霧',
    'Kabut Rime': '樹氷霧',
    'Gerimis Ringan': '霧雨',
    'Gerimis Sedang': '小雨',
    'Gerimis Lebat': '強い霧雨',
    'Gerimis Beku Ringan': '弱い着氷性の霧雨',
    'Gerimis Beku Lebat': '強い着氷性の霧雨',
    'Hujan Ringan': '小雨',
    'Hujan Sedang': '雨',
    'Hujan Lebat': '大雨',
    'Hujan Beku Ringan': '弱い着氷性の雨',
    'Hujan Beku Lebat': '強い着氷性の雨',
    'Salju Ringan': '小雪',
    'Salju Sedang': '雪',
    'Salju Lebat': '大雪',
    'Butiran Salju': '霧雪',
    'Hujan Shower Ringan': 'しゅう雨性降水',
    'Hujan Shower Sedang': 'にわか雨',
    'Hujan Shower Lebat': '豪雨',
    'Hujan Salju Ringan': 'にわか雪',
    'Hujan Salju Lebat': '大にわか雪',
    'Badai Petir': '雷雨',
    'Badai Petir dengan Es Ringan': '小雹を伴う雷雨',
    'Badai Petir dengan Es Lebat': '大雹を伴у雷雨',
    indonesiaEonet: "インドネシア (EONET空間)",
    global: "グローバル",
  },
  ru: {
    quakeTitle: "Землетрясение",
    hotspotTitle: "Лесной пожар",
    volcanoTitle: "Вулканическая активность",
    magnitude: "Магнитуда",
    depth: "Глубина",
    tsunami: "Опасность цунами",
    satellite: "Спутник",
    confidence: "Достоверность",
    thermalPower: "Тепловая мощность",
    km: "км",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
    nominal: "Номинальный",
    source: "Источник",
    category: "Категория",
    coordinates: "Координаты",
    description: "Описание",
    noDescription: "Нет дополнительного описания.",
    ashHeight: "Высота пепла",
    ashDir: "Направление пепла",
    weather: "Окружающая погода",
    aviationCode: "Авиационный код",
    riskAviation: "Авиационный риск",
    riskResident: "Риск для населения",
    riskHiker: "Риск для туристов",
    temperature: "Температура",
    humidity: "Влажность",
    windSpeed: "Скорость ветра",
    precipitation: "Осадки",
    condition: "Состояние",
    notObserved: "Не наблюдалось",
    'Cerah': 'Ясно',
    'Cerah Berawan': 'Переменная облачность',
    'Berawan': 'Облачно',
    'Mendung': 'Пасмурно',
    'Kabut': 'Туман',
    'Kabut Rime': 'Изморозь',
    'Gerimis Ringan': 'Легкая морось',
    'Gerimis Sedang': 'Морось',
    'Gerimis Lebat': 'Сильная морось',
    'Gerimis Beku Ringan': 'Слабый замерзающий моросящий дождь',
    'Gerimis Beku Lebat': 'Сильный замерзающий моросящий дождь',
    'Hujan Ringan': 'Небольшой дождь',
    'Hujan Sedang': 'Умеренный дождь',
    'Hujan Lebat': 'Сильный дождь',
    'Hujan Beku Ringan': 'Слабый ледяной дождь',
    'Hujan Beku Lebat': 'Сильный ледяной дождь',
    'Salju Ringan': 'Небольшой снег',
    'Salju Sedang': 'Снегопад',
    'Salju Lebat': 'Сильный снегопад',
    'Butiran Salju': 'Снежная крупа',
    'Hujan Shower Ringan': 'Небольшой ливень',
    'Hujan Shower Sedang': 'Ливень',
    'Hujan Shower Lebat': 'Сильный ливень',
    'Hujan Salju Ringan': 'Небольшой снегопад',
    'Hujan Salju Lebat': 'Сильный снегопад',
    'Badai Petir': 'Гроза',
    'Badai Petir dengan Es Ringan': 'Гроза со слабым градом',
    'Badai Petir dengan Es Lebat': 'Гроза с сильным градом',
    indonesiaEonet: "Индонезия (Зона EONET)",
    global: "Глобально",
  },
  fr: {
    quakeTitle: "Séisme",
    hotspotTitle: "Foyer de feu",
    volcanoTitle: "Activité volcanique",
    magnitude: "Magnitude",
    depth: "Profondeur",
    tsunami: "Potentiel de Tsunami",
    satellite: "Satellite",
    confidence: "Confiance",
    thermalPower: "Puissance thermique",
    km: "km",
    high: "Élevé",
    medium: "Moyen",
    low: "Faible",
    nominal: "Nominal",
    source: "Source",
    category: "Catégorie",
    coordinates: "Coordonnées",
    description: "Description",
    noDescription: "Pas de description supplémentaire.",
    ashHeight: "Hauteur de colonne",
    ashDir: "Direction des cendres",
    weather: "Météo environnante",
    aviationCode: "Code d'aviation",
    riskAviation: "Risque de l'aviation",
    riskResident: "Risque des riverains",
    riskHiker: "Risque de randonnée",
    temperature: "Température",
    humidity: "Humidité",
    windSpeed: "Vitesse du vent",
    precipitation: "Précipitations",
    condition: "Condition",
    notObserved: "Non observé",
    'Cerah': 'Clair',
    'Cerah Berawan': 'Partiellement nuageux',
    'Berawan': 'Nuageux',
    'Mendung': 'Couvert',
    'Kabut': 'Brouillard',
    'Kabut Rime': 'Brouillard givrant',
    'Gerimis Ringan': 'Légère bruine',
    'Gerimis Sedang': 'Bruine',
    'Gerimis Lebat': 'Bruine dense',
    'Gerimis Beku Ringan': 'Bruine verglaçante légère',
    'Gerimis Beku Lebat': 'Bruine verglaçante dense',
    'Hujan Ringan': 'Pluie légère',
    'Hujan Sedang': 'Pluie modérée',
    'Hujan Lebat': 'Pluie forte',
    'Hujan Beku Ringan': 'Pluie verglaçante légère',
    'Hujan Beku Lebat': 'Pluie verglaçante forte',
    'Salju Ringan': 'Neige légère',
    'Salju Sedang': 'Neige',
    'Salju Lebat': 'Neige forte',
    'Butiran Salju': 'Neige en grains',
    'Hujan Shower Ringan': 'Averses de pluie légères',
    'Hujan Shower Sedang': 'Averses de pluie',
    'Hujan Shower Lebat': 'Averses de pluie violentes',
    'Hujan Salju Ringan': 'Averses de neige légères',
    'Hujan Salju Lebat': 'Averses de neige fortes',
    'Badai Petir': 'Orage',
    'Badai Petir dengan Es Ringan': 'Orage avec grêle légère',
    'Badai Petir dengan Es Lebat': 'Orage avec grêle forte',
    indonesiaEonet: "Indonésie (Espace EONET)",
    global: "Global",
  }
};

export default function DisasterDashboard({ initialTab = 'volcano' }: { initialTab?: string }) {
  const language = useSiteLanguage();
  const t = dict[language] || dict['id'];
  const lbl = lblDict[language] || lblDict['id'];

  const [activeTab, setActiveTab] = useState(initialTab);
  const [volcanoes, setVolcanoes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [quakes, setQuakes] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Translation cache for dynamic text
  const [translatedCache, setTranslatedCache] = useState<Record<string, string>>({});
  const pendingTranslations = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (language === 'id' || loading) return;

    // Translate volcano descriptions
    volcanoes.forEach(async (v) => {
      const descKey = `${v.id}-desc-${language}`;
      if (v.description && !translatedCache[descKey] && !pendingTranslations.current.has(descKey)) {
        pendingTranslations.current.add(descKey);
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: v.description, target: language })
          });
          if (res.ok) {
            const data = await res.json();
            setTranslatedCache(prev => ({ ...prev, [descKey]: data.translated }));
          }
        } catch (err) {
          console.warn('Failed to translate volcano desc:', err);
        }
      }
    });

    // Translate timeline logs
    logs.forEach(async (log) => {
      const logKey = `${log.id}-desc-${language}`;
      if (log.description && !translatedCache[logKey] && !pendingTranslations.current.has(logKey)) {
        pendingTranslations.current.add(logKey);
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: log.description, target: language })
          });
          if (res.ok) {
            const data = await res.json();
            setTranslatedCache(prev => ({ ...prev, [logKey]: data.translated }));
          }
        } catch (err) {
          console.warn('Failed to translate log desc:', err);
        }
      }
    });
  }, [language, volcanoes, logs, loading]);

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5, 118.0]);
  const [activeLayers, setActiveLayers] = useState({
    volcano: true,
    quake: true,
    hotspots: false,
    rain: false,
    himawari: false,
    flood: false,
    cyclone: false,
  });

  // User location states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [closestVolcano, setClosestVolcano] = useState<any | null>(null);

  // Data Center States & Functions
  const dcT = dcDict[language] || dcDict['id'];
  const [dcStartDate, setDcStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dcEndDate, setDcEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dcCategory, setDcCategory] = useState('all');
  const [dcRegion, setDcRegion] = useState('all');
  const [dcSearchQuery, setDcSearchQuery] = useState('');
  const [dcRecords, setDcRecords] = useState<any[]>([]);
  const [dcLoading, setDcLoading] = useState(false);
  const [dcAiSummary, setDcAiSummary] = useState('');
  const [dcAiLoading, setDcAiLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const fetchDcRecords = useCallback(async () => {
    setDcLoading(true);
    setDcAiSummary('');
    try {
      const params = new URLSearchParams({
        startDate: dcStartDate,
        endDate: dcEndDate,
        category: dcCategory,
        region: dcRegion,
        searchQuery: dcSearchQuery
      });
      const res = await fetch(`/api/earth-monitoring/data-center?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDcRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch data center records:', err);
    } finally {
      setDcLoading(false);
    }
  }, [dcStartDate, dcEndDate, dcCategory, dcRegion, dcSearchQuery]);

  useEffect(() => {
    if (activeTab === 'data-center') {
      fetchDcRecords();
    }
  }, [activeTab, fetchDcRecords]);

  const getLocalizedRecord = useCallback((r: any, lang: string, customCache?: Record<string, string>) => {
    const activeCache = { ...translatedCache, ...(customCache || {}) };
    const d = dcDataDict[lang] || dcDataDict['id'];
    const record = { ...r };

    // Get translated title
    const cacheKeyTitle = `${record.id}-title-${lang}`;
    const isStructuredType = ['quake', 'tsunami', 'volcano', 'hotspots'].includes(record.type);

    if (isStructuredType) {
      // Always use local template for structured types — never machine translation
      if (record.type === 'quake' || record.type === 'tsunami') {
        const magStr = record.title.match(/M\s*([\d.]+)/)?.[1] || '';
        const place = record.location;
        const cacheKeyPlace = `place-${place.replace(/\s+/g, '-')}-${lang}`;
        const translatedPlace = activeCache[cacheKeyPlace] || place;
        if (record.type === 'tsunami') {
          record.title = `🚨 ${d.tsunamiTitle || 'Tsunami Warning'}: M ${magStr} - ${translatedPlace}`;
        } else {
          record.title = `${d.quakeTitle || 'Earthquake'} M ${magStr} - ${translatedPlace}`;
        }
      } else if (record.type === 'volcano') {
        const volName = record.location;
        const localizedVolName = getLocalizedVolcanoName(volName, lang);
        record.title = `${localizedVolName} - ${d.volcanoTitle || 'Volcano'}`;
      } else if (record.type === 'hotspot' || record.type === 'hotspots') {
        const frpStr = record.title.match(/FRP:\s*([\d.]+)/)?.[1] || record.title.match(/([\d.]+)\s*MW/)?.[1] || '';
        record.title = frpStr
          ? `${d.hotspotTitle} — FRP: ${frpStr} MW`
          : d.hotspotTitle;
      }
      // hotspots title localized above
    } else if (activeCache[cacheKeyTitle]) {
      // For other types (weather/cyclone/flood) use cached machine translation
      record.title = activeCache[cacheKeyTitle];
    } else {
      // Local weather title reconstruction
      if (record.type === 'weather') {
        const match = record.title.match(/Cuaca di ([^:]+):\s*([\d.-]+)°C,\s*(.+)$/);
        if (match) {
          const city = match[1];
          const temp = match[2];
          const condIndo = match[3].trim();
          const condTrans = d[condIndo] || condIndo;
          record.title = lang === 'id' ? `Cuaca di ${city}: ${temp}°C, ${condTrans}` : `Weather in ${city}: ${temp}°C, ${condTrans}`;
        }
      }
    }

    // Get translated details if cached
    const cacheKeyDesc = `${record.id}-desc-${lang}`;
    if (activeCache[cacheKeyDesc]) {
      record.details = activeCache[cacheKeyDesc];
    } else {
      let detailsText = record.details || '';
      
      if (record.type === 'quake') {
        const magStr = record.title.match(/M\s*([\d.]+)/)?.[1] || '';
        const depthStr = record.details.match(/Kedalaman:\s*(\d+)\s*km/)?.[1] || '0';
        const hasTsunami = record.details.includes('🚨') || record.details.includes('Tsunami');
        detailsText = `${d.magnitude}: ${magStr} M &bull; ${d.depth}: ${depthStr} ${d.km}.${hasTsunami ? ` 🚨 ${d.tsunami}` : ''}`;
      } else if (record.type === 'hotspots') {
        const frpStr = record.title.match(/FRP:\s*([\d.]+)/)?.[1] || '';
        const satellite = record.details.match(/Satelit:\s*([a-zA-Z0-9_]+)/)?.[1] || 'VIIRS';
        const confidence = record.details.match(/Kepercayaan:\s*([a-zA-Z0-9]+)/)?.[1] || 'low';
        const localizedConfidence = d[confidence.toLowerCase()] || confidence;
        detailsText = `${d.satellite}: ${satellite} &bull; ${d.confidence}: ${localizedConfidence} &bull; ${d.thermalPower}: ${frpStr} MW`;
      } else if (record.type === 'volcano') {
        detailsText = detailsText
          .replace(/Tinggi Kolom Abu:/g, `${d.ashHeight}:`)
          .replace(/Arah Abu:/g, `${d.ashDir}:`)
          .replace(/Cuaca Sekitar:/g, `${d.weather}:`)
          .replace(/Kode Aviasi:/g, `${d.aviationCode}:`)
          .replace(/Risiko Penerbangan:/g, `${d.riskAviation}:`)
          .replace(/Risiko Penduduk:/g, `${d.riskResident}:`)
          .replace(/Risiko Pendaki:/g, `${d.riskHiker}:`)
          .replace(/Sumber:/g, `${d.source}:`)
          .replace(/Tidak teramati/g, d.notObserved);
      } else if (record.type === 'weather') {
        detailsText = detailsText
          .replace(/Suhu:/g, `${d.temperature}:`)
          .replace(/Kelembapan:/g, `${d.humidity}:`)
          .replace(/Kecepatan Angin:/g, `${d.windSpeed}:`)
          .replace(/Presipitasi:/g, `${d.precipitation}:`)
          .replace(/Kondisi:/g, `${d.condition}:`)
          .replace(/Sumber:/g, `${d.source}:`)
          .replace(/km\/jam/g, lang === 'id' ? 'km/jam' : 'km/h');

        // Translate specific weather condition word inside details
        const condMatch = detailsText.match(/(Kondisi|Condition):\s*([^&•\n]+)/);
        if (condMatch) {
          const condText = condMatch[2].trim();
          const translatedCond = d[condText] || condText;
          detailsText = detailsText.replace(condMatch[0], `${condMatch[1]}: ${translatedCond}`);
        }
      } else if (record.type === 'cyclone' || record.type === 'flood') {
        detailsText = detailsText
          .replace(/Sumber:/g, `${d.source}:`)
          .replace(/Kategori:/g, `${d.category}:`)
          .replace(/Koordinat:/g, `${d.coordinates}:`)
          .replace(/Deskripsi:/g, `${d.description}:`)
          .replace(/Tidak ada deskripsi tambahan\./g, d.noDescription);
      }
      
      record.details = detailsText;
    }

    // Also translate location field
    if (record.location) {
      const cacheKeyPlace = `place-${record.location.replace(/\s+/g, '-')}-${lang}`;
      if (activeCache[cacheKeyPlace]) {
        record.location = activeCache[cacheKeyPlace];
      } else {
        if (record.location.includes('Wilayah Spasial EONET')) {
          record.location = d.indonesiaEonet || record.location;
        } else if (record.location.startsWith('Global')) {
          record.location = record.location.replace('Global', d.global || 'Global');
        }
      }
    }

    return record;
  }, [translatedCache]);

  useEffect(() => {
    if (language === 'id' || dcLoading || dcRecords.length === 0) return;

    dcRecords.slice(0, 15).forEach(async (r) => {
      // 1. Translate Location if present
      if (r.location) {
        const place = r.location;
        const cacheKeyPlace = `place-${place.replace(/\s+/g, '-')}-${language}`;
        if (!translatedCache[cacheKeyPlace] && !pendingTranslations.current.has(cacheKeyPlace)) {
          pendingTranslations.current.add(cacheKeyPlace);
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: place, target: language })
            });
            if (res.ok) {
              const data = await res.json();
              setTranslatedCache(prev => ({ ...prev, [cacheKeyPlace]: data.translated }));
            }
          } catch (err) {
            console.warn('Failed to translate place:', err);
          }
        }
      }

      // 2. Structured details (like 'Suhu: 25°C • Kelembapan: 80%') are NOT sent to /api/translate
      // because machine translation corrupts formatting/tags. Instead, getLocalizedRecord translates them
      // dynamically using a local clean dictionary mapping.

      // 3. Translate Title if present (skip types already handled by local template in getLocalizedRecord)
      const structuredTypes = ['quake', 'tsunami', 'volcano', 'hotspots'];
      if (r.title && !structuredTypes.includes(r.type)) {
        const cacheKeyTitle = `${r.id}-title-${language}`;
        if (!translatedCache[cacheKeyTitle] && !pendingTranslations.current.has(cacheKeyTitle)) {
          pendingTranslations.current.add(cacheKeyTitle);
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: r.title, target: language })
            });
            if (res.ok) {
              const data = await res.json();
              setTranslatedCache(prev => ({ ...prev, [cacheKeyTitle]: data.translated }));
            }
          } catch (err) {
            console.warn('Failed to translate title:', err);
          }
        }
      }
    });
  }, [language, dcRecords, dcLoading]);

  const generateDcAiSummary = async () => {
    if (dcRecords.length === 0) return;
    setDcAiLoading(true);
    try {
      const res = await fetch('/api/earth-monitoring/data-center/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: dcRecords, target: language })
      });
      if (res.ok) {
        const data = await res.json();
        setDcAiSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to generate AI summary:', err);
    } finally {
      setDcAiLoading(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung pencarian suara (Web Speech API).");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'id' ? 'id-ID' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onerror = (event: any) => {
      console.error('[Speech Recognition Error]:', event);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setDcSearchQuery(speechToText);
    };

    recognition.start();
  };

  const translateAllRecordsForExport = async (targetLang: string): Promise<Record<string, string>> => {
    if (targetLang === 'id' || dcRecords.length === 0) return {};

    const uniqueTextsSet = new Set<string>();
    const structuredTypes = ['quake', 'tsunami', 'volcano', 'hotspots'];

    dcRecords.forEach(r => {
      if (r.location) {
        const cacheKeyPlace = `place-${r.location.replace(/\s+/g, '-')}-${targetLang}`;
        if (!translatedCache[cacheKeyPlace]) {
          uniqueTextsSet.add(r.location);
        }
      }
      if (r.title && !structuredTypes.includes(r.type)) {
        const cacheKeyTitle = `${r.id}-title-${targetLang}`;
        if (!translatedCache[cacheKeyTitle]) {
          uniqueTextsSet.add(r.title);
        }
      }
    });

    const uniqueTexts = Array.from(uniqueTextsSet).filter(t => t && t.trim() !== '');
    if (uniqueTexts.length === 0) return {};

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: uniqueTexts, target: targetLang })
      });
      if (res.ok) {
        const data = await res.json();
        const results = data.translated || [];
        const localCache: Record<string, string> = {};

        uniqueTexts.forEach((text, idx) => {
          const transVal = results[idx] || text;
          localCache[`place-${text.replace(/\s+/g, '-')}-${targetLang}`] = transVal;
          localCache[`${text}-${targetLang}`] = transVal;
        });

        // Merge to state cache for future reuse
        setTranslatedCache(prev => ({ ...prev, ...localCache }));
        return localCache;
      }
    } catch (err) {
      console.warn('Failed to batch translate for export:', err);
    }
    return {};
  };

  const handleExportJSON = async () => {
    const filename = `meteorit-disaster-export-${dcStartDate}-to-${dcEndDate}.json`;
    const transCache = await translateAllRecordsForExport(language);
    const localizedRecords = dcRecords.map(r => getLocalizedRecord(r, language, transCache));
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(localizedRecords, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    await fetch('/api/earth-monitoring/data-center/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, fileFormat: 'JSON', recordCount: dcRecords.length })
    });
  };

  const handleExportCSV = async () => {
    const filename = `meteorit-disaster-export-${dcStartDate}-to-${dcEndDate}.csv`;
    const headers = ['id', 'type', 'title', 'location', 'latitude', 'longitude', 'severity', 'timestamp', 'details'];
    const csvRows = [headers.join(',')];
    const transCache = await translateAllRecordsForExport(language);
    const localizedRecords = dcRecords.map(r => getLocalizedRecord(r, language, transCache));
    
    localizedRecords.forEach(r => {
      const values = headers.map(header => {
        const val = r[header] || '';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    await fetch('/api/earth-monitoring/data-center/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, fileFormat: 'CSV', recordCount: dcRecords.length })
    });
  };

  const handleExportGeoJSON = async () => {
    const filename = `meteorit-disaster-export-${dcStartDate}-to-${dcEndDate}.geojson`;
    const transCache = await translateAllRecordsForExport(language);
    const localizedRecords = dcRecords.map(r => getLocalizedRecord(r, language, transCache));
    const features = localizedRecords.map(r => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [r.longitude, r.latitude]
      },
      properties: {
        id: r.id,
        type: r.type,
        title: r.title,
        location: r.location,
        severity: r.severity,
        timestamp: r.timestamp,
        details: r.details
      }
    }));

    const geoJson = {
      type: 'FeatureCollection',
      features
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    await fetch('/api/earth-monitoring/data-center/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, fileFormat: 'GeoJSON', recordCount: dcRecords.length })
    });
  };

  const handleExportExcel = async () => {
    const filename = `meteorit-disaster-export-${dcStartDate}-to-${dcEndDate}.xls`;
    const transCache = await translateAllRecordsForExport(language);
    const localizedRecords = dcRecords.map(r => getLocalizedRecord(r, language, transCache));

    // ── Multilingual export labels ──────────────────────────────────────────
    const exportLabels: Record<string, Record<string, string>> = {
      id: { colType: 'Tipe', colTitle: 'Kejadian', colLoc: 'Lokasi', colSev: 'Bahaya', colTime: 'Waktu', colDetail: 'Detail' },
      en: { colType: 'Type', colTitle: 'Event', colLoc: 'Location', colSev: 'Severity', colTime: 'Time', colDetail: 'Details' },
      ms: { colType: 'Jenis', colTitle: 'Kejadian', colLoc: 'Lokasi', colSev: 'Bahaya', colTime: 'Masa', colDetail: 'Butiran' },
      zh: { colType: '类型', colTitle: '事件', colLoc: '地点', colSev: '级别', colTime: '时间', colDetail: '详情' },
      ja: { colType: '種別', colTitle: '事象', colLoc: '場所', colSev: '危険度', colTime: '時刻', colDetail: '詳細' },
      ru: { colType: 'Тип', colTitle: 'Событие', colLoc: 'Место', colSev: 'Уровень', colTime: 'Время', colDetail: 'Детали' },
      fr: { colType: 'Type', colTitle: 'Événement', colLoc: 'Lieu', colSev: 'Niveau', colTime: 'Heure', colDetail: 'Détails' },
    };
    const lbl = exportLabels[language] || exportLabels['en'];

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Disaster Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>`;
    html += `<table border="1">`;
    html += `<tr style="background-color:#0f172a; color:#38bdf8; font-weight:bold;">`;
    html += `<th>${lbl.colType}</th><th>${lbl.colTitle}</th><th>${lbl.colLoc}</th><th>${lbl.colSev}</th><th>${lbl.colTime}</th><th>${lbl.colDetail}</th>`;
    html += `</tr>`;

    localizedRecords.forEach(r => {
      const plainDetails = r.details.replace(/&bull;/g, '•').replace(/<[^>]+>/g, '');
      html += `<tr>`;
      html += `<td>${r.type}</td>`;
      html += `<td>${r.title}</td>`;
      html += `<td>${r.location}</td>`;
      html += `<td>${r.severity}</td>`;
      html += `<td>${r.timestamp}</td>`;
      html += `<td>${plainDetails}</td>`;
      html += `</tr>`;
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    await fetch('/api/earth-monitoring/data-center/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, fileFormat: 'Excel', recordCount: dcRecords.length })
    });
  };

  const handleExportPDF = async () => {
    // ── Full multilingual label dictionary ─────────────────────────────────
    const pdfLabels: Record<string, {
      reportTitle: string; subtitle: string;
      rangeLabel: string; totalLabel: string; downloadLabel: string;
      colType: string; colTitle: string; colLoc: string; colSev: string; colTime: string;
      pageLabel: string; summaryLabel: string;
      dateLocale: string;
    }> = {
      id: {
        reportTitle: 'LAPORAN DATA KEBENCANAAN NASIONAL',
        subtitle: 'Meteorit Indonesia - Pusat Observasi & Data Center',
        rangeLabel: 'Rentang Waktu', totalLabel: 'Total Kejadian', downloadLabel: 'Tanggal Unduh',
        colType: 'Tipe', colTitle: 'Judul Kejadian', colLoc: 'Lokasi', colSev: 'Tingkat', colTime: 'Waktu',
        pageLabel: 'Halaman', summaryLabel: 'RINGKASAN EKSEKUTIF AI',
        dateLocale: 'id-ID',
      },
      en: {
        reportTitle: 'NATIONAL DISASTER DATA REPORT',
        subtitle: 'Meteorit Indonesia - Observation & Data Center',
        rangeLabel: 'Date Range', totalLabel: 'Total Events', downloadLabel: 'Downloaded',
        colType: 'Type', colTitle: 'Event Title', colLoc: 'Location', colSev: 'Severity', colTime: 'Time',
        pageLabel: 'Page', summaryLabel: 'AI EXECUTIVE SUMMARY',
        dateLocale: 'en-US',
      },
      ms: {
        reportTitle: 'LAPORAN DATA BENCANA NASIONAL',
        subtitle: 'Meteorit Indonesia - Pusat Pemantauan & Pusat Data',
        rangeLabel: 'Julat Tarikh', totalLabel: 'Jumlah Kejadian', downloadLabel: 'Tarikh Muat Turun',
        colType: 'Jenis', colTitle: 'Tajuk Kejadian', colLoc: 'Lokasi', colSev: 'Tahap', colTime: 'Masa',
        pageLabel: 'Halaman', summaryLabel: 'RINGKASAN EKSEKUTIF AI',
        dateLocale: 'ms-MY',
      },
      zh: {
        reportTitle: '全国灾害数据报告',
        subtitle: 'Meteorit Indonesia - 观测与数据中心',
        rangeLabel: '日期范围', totalLabel: '事件总数', downloadLabel: '下载日期',
        colType: '类型', colTitle: '事件标题', colLoc: '地点', colSev: '级别', colTime: '时间',
        pageLabel: '第 {n} 页', summaryLabel: 'AI 执行摘要',
        dateLocale: 'zh-CN',
      },
      ja: {
        reportTitle: '全国災害データレポート',
        subtitle: 'Meteorit Indonesia - 観測・データセンター',
        rangeLabel: '期間', totalLabel: '総件数', downloadLabel: 'ダウンロード日',
        colType: '種別', colTitle: '事象タイトル', colLoc: '場所', colSev: '危険度', colTime: '時刻',
        pageLabel: 'ページ', summaryLabel: 'AI エグゼクティブサマリー',
        dateLocale: 'ja-JP',
      },
      ru: {
        reportTitle: 'НАЦИОНАЛЬНЫЙ ОТЧЕТ О СТИХИЙНЫХ БЕДСТВИЯХ',
        subtitle: 'Meteorit Indonesia - Центр наблюдения и данных',
        rangeLabel: 'Период', totalLabel: 'Всего событий', downloadLabel: 'Дата загрузки',
        colType: 'Тип', colTitle: 'Заголовок события', colLoc: 'Место', colSev: 'Уровень', colTime: 'Время',
        pageLabel: 'Стр.', summaryLabel: 'КРАТКОЕ РЕЗЮМЕ AI',
        dateLocale: 'ru-RU',
      },
      fr: {
        reportTitle: 'RAPPORT NATIONAL SUR LES CATASTROPHES',
        subtitle: 'Meteorit Indonesia - Centre d\'Observation & de Données',
        rangeLabel: 'Plage de dates', totalLabel: 'Total événements', downloadLabel: 'Téléchargé le',
        colType: 'Type', colTitle: 'Titre de l\'événement', colLoc: 'Lieu', colSev: 'Niveau', colTime: 'Heure',
        pageLabel: 'Page', summaryLabel: 'RÉSUMÉ EXÉCUTIF AI',
        dateLocale: 'fr-FR',
      },
    };

    const isUnicodeLang = ['ru', 'zh', 'ja'].includes(language);
    const activePdfLang = isUnicodeLang ? 'en' : language;
    const fontNotices: Record<string, string> = {
      ru: ' [Отчет на английском языке из-за шрифтов PDF]',
      zh: ' [由于PDF字体限制，报告以英文生成]',
      ja: ' [PDFフォント制限のため、レポートは英語で作成されています]'
    };
    const fontNotice = fontNotices[language] || '';

    const lbl = pdfLabels[activePdfLang] || pdfLabels['en'];
    const filename = `meteorit-disaster-report-${dcStartDate}-to-${dcEndDate}.pdf`;
    const transCache = await translateAllRecordsForExport(activePdfLang);
    const localizedRecords = dcRecords.map(r => getLocalizedRecord(r, activePdfLang, transCache));

    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;

      // ── Header background band ──
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 40, 'F');

      // ── Title ──
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(lbl.reportTitle, pageW / 2, 14, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(lbl.subtitle + fontNotice, pageW / 2, 20, { align: 'center' });

      // ── Info row ──
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      const infoY = 28;
      doc.text(`${lbl.rangeLabel}: ${dcStartDate} - ${dcEndDate}`, margin, infoY);
      doc.text(`${lbl.totalLabel}: ${dcRecords.length}`, pageW / 2, infoY, { align: 'center' });
      doc.text(`${lbl.downloadLabel}: ${new Date().toLocaleDateString(lbl.dateLocale)}`, pageW - margin, infoY, { align: 'right' });

      let startY = 48;

      // ── AI Summary block ──
      if (dcAiSummary) {
        doc.setFillColor(240, 253, 250);
        doc.setDrawColor(20, 184, 166);
        doc.roundedRect(margin, startY, pageW - margin * 2, 8, 2, 2, 'FD');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 148, 136);
        doc.text(lbl.summaryLabel, margin + 3, startY + 5);
        startY += 10;

        const summaryLines = doc.splitTextToSize(dcAiSummary, pageW - margin * 2 - 4);
        const summaryH = summaryLines.length * 4 + 6;
        doc.setFillColor(240, 253, 250);
        doc.setDrawColor(20, 184, 166);
        doc.roundedRect(margin, startY, pageW - margin * 2, summaryH, 2, 2, 'FD');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(summaryLines, margin + 3, startY + 5);
        startY += summaryH + 6;
      }

      const colHeaders = [[lbl.colType, lbl.colTitle, lbl.colLoc, lbl.colSev, lbl.colTime]];

      const rows = localizedRecords.map(r => {
        const plainDetails = r.details.replace(/&bull;/g, '•').replace(/<[^>]+>/g, '');
        return [
          r.type.toUpperCase(),
          `${r.title}\n${plainDetails.substring(0, 100)}${plainDetails.length > 100 ? '…' : ''}`,
          r.location,
          r.severity,
          new Date(r.timestamp).toLocaleString(lbl.dateLocale, { dateStyle: 'short', timeStyle: 'short' })
        ];
      });

      const severityColor = (sev: string) => {
        if (sev === 'CRITICAL') return [239, 68, 68];
        if (sev === 'HIGH') return [249, 115, 22];
        if (sev === 'MODERATE') return [234, 179, 8];
        return [16, 185, 129];
      };

      autoTable(doc, {
        head: colHeaders,
        body: rows,
        startY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 6.5, cellPadding: 2.5, overflow: 'linebreak', valign: 'top' },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 16, fontStyle: 'bold' },
          1: { cellWidth: 72 },
          2: { cellWidth: 45 },
          3: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
          4: { cellWidth: 25 }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell(data: any) {
          if (data.column.index === 3 && data.section === 'body') {
            const [r, g, b] = severityColor(String(data.cell.raw));
            data.cell.styles.textColor = [r, g, b];
          }
        },
        didDrawPage(data: any) {
          // Watermark
          doc.saveGraphicsState();
          doc.setFontSize(65);
          doc.setTextColor(200, 200, 200);
          doc.setFont('helvetica', 'bold');
          doc.setGState(new (doc as any).GState({ opacity: 0.07 }));
          doc.text('Meteorit', pageW / 2, pageH / 2, { align: 'center', angle: 35 });
          doc.restoreGraphicsState();

          // Footer
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Meteorit Indonesia - meteorit-indonesia.vercel.app | ${lbl.pageLabel} ${data.pageNumber} / ${pageCount}`,
            pageW / 2,
            pageH - 6,
            { align: 'center' }
          );
        }
      });

      doc.save(filename);
    } catch (error) {
      console.error('Gagal mendownload PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }

    await fetch('/api/earth-monitoring/data-center/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, fileFormat: 'PDF', recordCount: dcRecords.length })
    });
  };


  // Load All Disaster Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Volcano Cache data
      const volRes = await fetch('/api/earth-monitoring/volcano');
      if (volRes.ok) {
        const payload = await volRes.json();
        setVolcanoes(payload.volcanoes || []);
        setLogs(payload.logs || []);
        setStats(payload.stats || {});
      }

      // 2. Fetch Earthquakes (USGS)
      const quakeRes = await fetch('/api/earth-monitoring/usgs?scope=indonesia&limit=15');
      if (quakeRes.ok) {
        const json = await quakeRes.json();
        setQuakes(json.earthquakes || []);
      }

      // 3. Fetch Hotspots (NASA FIRMS)
      const hotspotsRes = await fetch('/api/earth-monitoring/firms?source=VIIRS_SNPP_NRT&country=IDN&range=1');
      if (hotspotsRes.ok) {
        const json = await hotspotsRes.json();
        setHotspots(json.hotspots || []);
      }

    } catch (err) {
      console.error('Failed to load disaster dashboard datasets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync data on demand
  const handleSync = async () => {
    setSyncing(true);
    try {
      const syncRes = await fetch('/api/earth-monitoring/volcano/sync');
      if (syncRes.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Data synchronization failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Get nearest volcano logic
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLocation([lat, lon]);

        if (volcanoes.length > 0) {
          let minDistance = Infinity;
          let nearest: any = null;

          volcanoes.forEach((v) => {
            const distance = getDistanceKm(lat, lon, v.latitude, v.longitude);
            if (distance < minDistance) {
              minDistance = distance;
              nearest = v;
            }
          });

          if (nearest) {
            const bearing = getBearing(lat, lon, nearest.latitude, nearest.longitude);
            setClosestVolcano({
              ...nearest,
              distance: minDistance.toFixed(1),
              direction: getDirectionName(bearing, language)
            });
            setMapCenter([nearest.latitude, nearest.longitude]);
          }
        }
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
      }
    );
  };

  const toggleLayer = (key: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 bg-clip-text text-transparent tracking-wide uppercase">
              {t.dashboardTitle}
            </h1>
            <p className="text-slate-400 text-xs mt-1">{t.dashboardSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {stats.updatedAt && (
              <span className="text-[10px] text-slate-500 font-bold">
                {t.lastSync} {new Date(stats.updatedAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-xs font-black uppercase tracking-wider text-cyan-400 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {t.syncBtn}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-900 pb-2 overflow-x-auto">
          {[
            { key: 'volcano', label: t.tabVolcano },
            { key: 'quake', label: t.tabQuake },
            { key: 'hotspots', label: t.tabHotspots },
            { key: 'rain', label: t.tabRain },
            { key: 'enso', label: t.tabEnso },
            { key: 'data-center', label: dcT.tabDataCenter }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                // Auto adjust active layers on map depending on tab
                if (tab.key === 'volcano') setActiveLayers(prev => ({ ...prev, volcano: true, quake: false, hotspots: false }));
                if (tab.key === 'quake') setActiveLayers(prev => ({ ...prev, volcano: false, quake: true, hotspots: false }));
                if (tab.key === 'hotspots') setActiveLayers(prev => ({ ...prev, volcano: false, quake: false, hotspots: true }));
                if (tab.key === 'data-center') setActiveLayers(prev => ({ ...prev, volcano: true, quake: true, hotspots: true }));
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900/50 border border-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── MAP BLOCK ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <DisasterMap
              activeLayers={activeLayers}
              quakeData={quakes}
              hotspotData={hotspots}
              volcanoData={volcanoes}
              centerLatLng={mapCenter}
            />
          </div>

          {/* Layer Control Panel */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Layers size={14} className="text-cyan-400" />
              <h4 className="text-xs font-black uppercase text-slate-300">{t.mapLayerTitle}</h4>
            </div>
            <div className="flex flex-col gap-2.5 text-xs font-bold text-slate-300">
              {[
                { key: 'volcano', label: t.layerVolcano },
                { key: 'quake', label: t.layerQuake },
                { key: 'hotspots', label: t.layerHotspots },
                { key: 'rain', label: t.layerRain },
                { key: 'himawari', label: t.layerHimawari },
                { key: 'flood', label: t.layerFlood },
                { key: 'cyclone', label: t.layerCyclone },
              ].map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => toggleLayer(layer.key as any)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    (activeLayers as any)[layer.key]
                      ? 'border-cyan-500/30 bg-cyan-950/10 text-cyan-400'
                      : 'border-slate-800 bg-slate-950/30 hover:border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{layer.label}</span>
                  <span className="text-[10px]">
                    {(activeLayers as any)[layer.key] ? '● ON' : '○ OFF'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── TAB CONTENT: VOLCANO ─── */}
        {activeTab === 'volcano' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Statuses, national statistics and nearest location locator */}
            <div className="lg:col-span-2 space-y-6">

              {/* National Stats Grid */}
              <div className="bg-slate-900/20 backdrop-blur-md border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-300 border-b border-slate-800 pb-2">
                  📊 {t.nationalStatsTitle}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  {[
                    { label: t.activeCountLabel, val: stats.activeVolcanoes || 0, color: 'text-red-500' },
                    { label: t.highestActivityLabel, val: stats.highestActivityVolcano || 'Merapi', color: 'text-amber-500' },
                    { label: t.eruptionsTodayLabel, val: stats.eruptionsToday || 0, color: 'text-orange-500' },
                    { label: t.volcanicHotspotsLabel, val: stats.satelliteHotspots || 0, color: 'text-yellow-500' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-950/50 border border-slate-900 rounded-2xl p-3">
                      <p className="text-[8px] text-slate-500 font-extrabold uppercase leading-tight">{stat.label}</p>
                      <p className={`text-xl font-black mt-1 ${stat.color}`}>{stat.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volcano list & Risk Dashboard */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-300">🌋 {t.volcanoStatusTitle}</h3>
                {loading ? (
                  <div className="text-center py-12"><RefreshCw size={24} className="animate-spin text-cyan-400 mx-auto" /></div>
                ) : (
                  volcanoes.map((v) => {
                    const statusColor = v.status_level === 'Awas' ? 'border-red-500/30 bg-red-950/5 text-red-400' : v.status_level === 'Siaga' ? 'border-orange-500/30 bg-orange-950/5 text-orange-400' : 'border-yellow-500/30 bg-yellow-950/5 text-yellow-400';
                    const displayVolcanoName = getLocalizedVolcanoName(v.name, language);
                    const displayStatus = getLocalizedStatusLevel(v.status_level, language);
                    const displayDesc = translatedCache[`${v.id}-desc-${language}`] || v.description;
                    const displayWeather = getLocalizedWeather(v.weather, language);
                    const displayAshDir = getLocalizedAshDirection(v.ash_direction, language, lbl.lblNone);
                    return (
                      <div
                        key={v.id}
                        onClick={() => setMapCenter([v.latitude, v.longitude])}
                        className={`p-5 rounded-3xl border shadow-xl flex flex-col md:flex-row gap-5 cursor-pointer hover:border-slate-800 hover:bg-slate-900/10 transition-all ${statusColor}`}
                      >
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-black uppercase tracking-wide">
                              🌋 {displayVolcanoName}
                            </h4>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-900">
                              {displayStatus}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {displayDesc}
                          </p>

                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold">
                            <span className="bg-slate-950/60 rounded-full px-3 py-1 border border-slate-900">📍 {lbl.lblCoordinates}: {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</span>
                            <span className="bg-slate-950/60 rounded-full px-3 py-1 border border-slate-900">💨 {lbl.lblAshDirection}: {displayAshDir}</span>
                            <span className="bg-slate-950/60 rounded-full px-3 py-1 border border-slate-900">☁️ {lbl.lblWeather}: {displayWeather}</span>
                          </div>
                        </div>

                        {/* Risk Dashboard Indicator Column */}
                        <div className="w-full md:w-52 shrink-0 border-t md:border-t-0 md:border-l border-slate-800/40 pt-4 md:pt-0 md:pl-5 space-y-2">
                          <p className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">🛡️ {t.riskDashboardTitle}</p>
                          
                          <div className="flex items-center justify-between text-[10px] bg-slate-950/30 p-2 rounded-xl border border-slate-900">
                            <span className="flex items-center gap-1"><Plane size={10} className="text-slate-400" /> {t.riskAviationLabel}</span>
                            <span className={`font-black uppercase ${v.risk_aviation === 'RED' ? 'text-red-500' : 'text-orange-500'}`}>{v.risk_aviation}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] bg-slate-950/30 p-2 rounded-xl border border-slate-900">
                            <span className="flex items-center gap-1"><Users size={10} className="text-slate-400" /> {t.riskResidentLabel}</span>
                            <span className={`font-black uppercase ${v.risk_resident === 'RED' ? 'text-red-500' : v.risk_resident === 'ORANGE' ? 'text-orange-500' : 'text-yellow-500'}`}>{v.risk_resident}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] bg-slate-950/30 p-2 rounded-xl border border-slate-900">
                            <span className="flex items-center gap-1"><Compass size={10} className="text-slate-400" /> {t.riskHikerLabel}</span>
                            <span className={`font-black uppercase ${v.risk_hiker === 'RED' ? 'text-red-500' : 'text-orange-500'}`}>{v.risk_hiker}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Volcano Side-by-Side Comparison */}
              <div className="bg-slate-900/20 backdrop-blur-md border border-slate-900 rounded-3xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black uppercase text-slate-300">
                    🔄 {t.volcanoCompareTitle}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{t.volcanoCompareDesc}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                        <th className="py-2.5 px-3">{t.tblVolcano}</th>
                        <th className="py-2.5 px-3">{t.tblStatus}</th>
                        <th className="py-2.5 px-3">{t.tblAshHeight}</th>
                        <th className="py-2.5 px-3">{t.tblAshDirection}</th>
                        <th className="py-2.5 px-3">{t.tblPeakWeather}</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-300 divide-y divide-slate-900/40">
                      {volcanoes.slice(0, 3).map((v) => (
                        <tr key={v.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 px-3 text-white uppercase">{getLocalizedVolcanoName(v.name, language)}</td>
                          <td className="py-3 px-3">
                            <span className={`text-[10px] uppercase font-black ${v.status_level === 'Awas' ? 'text-red-500' : 'text-orange-500'}`}>
                              {getLocalizedStatusLevel(v.status_level, language)}
                            </span>
                          </td>
                          <td className="py-3 px-3">{v.ash_height > 0 ? `${v.ash_height} m` : '600 m'}</td>
                          <td className="py-3 px-3">{getLocalizedAshDirection(v.ash_direction, language, lbl.lblNone)}</td>
                          <td className="py-3 px-3 text-cyan-400">{getLocalizedWeather(v.weather, language)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right side: Active Locator, Timeline/Logs & Educational Mode */}
            <div className="space-y-6">

              {/* User Geolocation Locator */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-300 border-b border-slate-800 pb-2">
                  📍 {t.userLocTitle}
                </h3>
                <button
                  onClick={handleGetLocation}
                  disabled={locLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-950/20 disabled:opacity-50"
                >
                  <Compass size={14} className={locLoading ? 'animate-spin text-slate-950' : 'text-slate-950'} />
                  {locLoading ? t.userLocLoading : t.userLocBtn}
                </button>

                {closestVolcano && (
                  <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-extrabold uppercase text-cyan-400">{t.userLocSuccess}</p>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>{t.userLocClosest}</span>
                        <span className="font-black text-white uppercase">{closestVolcano.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.userLocDistance}</span>
                        <span className="font-black text-white">{closestVolcano.distance} Km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.userLocDirection}</span>
                        <span className="font-black text-cyan-400">{closestVolcano.direction}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline & Logs */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black uppercase text-slate-300">
                    🕒 {t.timelineTitle}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{t.timelineDesc}</p>
                </div>
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-6">{t.timelineEmpty}</p>
                  ) : (
                    logs.map((log) => {
                      const color = log.status_level === 'Awas' ? 'bg-red-500' : log.status_level === 'Siaga' ? 'bg-orange-500' : 'bg-yellow-500';
                      const displayLogVolcanoName = getLocalizedVolcanoName(log.volcano_name, language);
                      const displayLogDesc = translatedCache[`${log.id}-desc-${language}`] || log.description;
                      return (
                        <div key={log.id} className="relative pl-5 border-l border-slate-800 space-y-1">
                          <span className={`absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full ${color}`} />
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-black text-slate-300 uppercase">{displayLogVolcanoName}</span>
                            <span className="text-slate-500">{new Date(log.timestamp).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'short' })}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{displayLogDesc}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Educational Mode */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-black uppercase text-slate-300">
                    📖 {t.eduTitle}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{t.eduDesc}</p>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <details className="group bg-slate-950/40 border border-slate-900 rounded-xl p-3 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer font-black text-slate-200">
                      <span>{t.eduHeader1}</span>
                      <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mt-2.5 pl-1.5 space-y-2 text-slate-400 border-l border-slate-800">
                      <p>{t.eduBody1_1}</p>
                      <p>{t.eduBody1_2}</p>
                      <p>{t.eduBody1_3}</p>
                      <p>{t.eduBody1_4}</p>
                    </div>
                  </details>

                  <details className="group bg-slate-950/40 border border-slate-900 rounded-xl p-3 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer font-black text-slate-200">
                      <span>{t.eduHeader2}</span>
                      <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mt-2.5 pl-1.5 space-y-2 text-slate-400 border-l border-slate-800">
                      <p>{t.eduBody2_1}</p>
                      <p>{t.eduBody2_2}</p>
                      <p>{t.eduBody2_3}</p>
                    </div>
                  </details>

                  <details className="group bg-slate-950/40 border border-slate-900 rounded-xl p-3 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer font-black text-slate-200">
                      <span>{t.eduHeader3}</span>
                      <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mt-2.5 pl-1.5 space-y-2 text-slate-400 border-l border-slate-800">
                      <p>{t.eduBody3_1}</p>
                      <p>{t.eduBody3_2}</p>
                      <p>{t.eduBody3_3}</p>
                    </div>
                  </details>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: GEMPA BUMI ─── */}
        {activeTab === 'quake' && (
          <div className="bg-slate-900/20 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black uppercase text-slate-200 border-b border-slate-800 pb-2">{t.quakeHeader}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quakes.slice(0, 10).map((q) => (
                <div key={q.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400 shrink-0 text-base">
                    {q.magnitude.toFixed(1)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-200">{q.place || q.region}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {t.quakeDepth}: {q.depth} km &bull; {new Date(q.time).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
                    </p>
                    {q.tsunami === 1 && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded bg-red-950 border border-red-500/30 text-red-500 text-[8px] font-black tracking-wider uppercase animate-pulse">{t.quakeTsunami}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: TITIK API ─── */}
        {activeTab === 'hotspots' && (
          <div className="bg-slate-900/20 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black uppercase text-slate-200 border-b border-slate-800 pb-2">{t.hotspotsHeader}</h3>
            {hotspots.length === 0 ? (
              <p className="text-slate-500 text-xs py-12 text-center">{t.hotspotsEmpty}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hotspots.slice(0, 12).map((h, i) => (
                  <div key={i} className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] bg-red-950 border border-red-500/20 text-red-400 px-2 py-0.5 rounded">FRP: {h.frp} MW</span>
                      <span className="text-[9px] text-slate-500">{h.acq_date}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-300">Koordinat: {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</p>
                    <p className="text-[10px] text-slate-500">{t.hotspotsSat}: {h.satellite} &bull; {t.hotspotsConf}: {h.confidence}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: CURAH HUJAN ─── */}
        {activeTab === 'rain' && (
          <div className="bg-slate-900/20 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black uppercase text-slate-200 border-b border-slate-800 pb-2">{t.rainHeader}</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              {t.rainDesc}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-cyan-400 uppercase">{t.rainZoneTitle}</h4>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li>{t.rainSemarang}</li>
                  <li>{t.rainDemak}</li>
                  <li>{t.rainLuwu}</li>
                </ul>
              </div>
              <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-amber-500 uppercase">{t.rainAnalysisTitle}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.rainAnalysisDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: ENSO ─── */}
        {activeTab === 'enso' && (
          <div className="bg-slate-900/20 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black uppercase text-slate-200 border-b border-slate-800 pb-2">{t.ensoHeader}</h3>
            <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <span className="text-xs font-bold text-slate-400">{t.ensoStatusTitle}</span>
                <span className="px-3 py-1 bg-green-950 border border-green-500/20 text-green-400 text-xs font-black rounded-full uppercase">{t.ensoNeutral}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.ensoDesc}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-900">
                  <p className="text-[9px] text-slate-500 font-extrabold uppercase">{t.ensoAnom}</p>
                  <p className="text-sm font-black text-cyan-400 mt-1">+0.12 &deg;C</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-900">
                  <p className="text-[9px] text-slate-500 font-extrabold uppercase">{t.ensoSST}</p>
                  <p className="text-sm font-black text-cyan-400 mt-1">28.45 &deg;C</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-900">
                  <p className="text-[9px] text-slate-500 font-extrabold uppercase">{t.ensoSeason}</p>
                  <p className="text-sm font-black text-cyan-400 mt-1">{t.ensoTransition}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: DATA CENTER ─── */}
        {activeTab === 'data-center' && (
          <div className="space-y-6">
            {/* Title & Description */}
            <div className="bg-slate-900/20 backdrop-blur-md border border-slate-900 rounded-3xl p-6 space-y-2">
              <h2 className="text-xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent uppercase tracking-wide">
                🗄️ {dcT.dcTitle}
              </h2>
              <p className="text-xs text-slate-400">{dcT.dcSubtitle}</p>
            </div>

            {/* Filters panel */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500">{dcT.dcFilterCat}</label>
                  <select
                    value={dcCategory}
                    onChange={(e) => setDcCategory(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="all">{dcT.dcFilterAll}</option>
                    <option value="quake">{dcT.dcFilterQuake}</option>
                    <option value="volcano">{dcT.dcFilterVolcano}</option>
                    <option value="hotspots">{dcT.dcFilterHotspots}</option>
                    <option value="cyclone">{dcT.dcFilterCyclone}</option>
                    <option value="flood">{dcT.dcFilterFlood}</option>
                    <option value="tsunami">{dcT.dcFilterTsunami}</option>
                    <option value="weather">{dcT.dcFilterWeather}</option>
                  </select>
                </div>

                {/* Region filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500">{dcT.dcFilterRegion}</label>
                  <select
                    value={dcRegion}
                    onChange={(e) => setDcRegion(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="all">{dcT.dcFilterRegionAll}</option>
                    <option value="indonesia">{dcT.dcFilterRegionId}</option>
                  </select>
                </div>

                {/* Start Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500">{dcT.dcFilterStartDate}</label>
                  <input
                    type="date"
                    value={dcStartDate}
                    onChange={(e) => setDcStartDate(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500">{dcT.dcFilterEndDate}</label>
                  <input
                    type="date"
                    value={dcEndDate}
                    onChange={(e) => setDcEndDate(e.target.value)}
                    className="bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Text Search & Voice Search Row */}
              <div className="flex items-center gap-2.5">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={dcSearchQuery}
                    onChange={(e) => setDcSearchQuery(e.target.value)}
                    placeholder={dcT.dcSearchPlaceholder}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-655"
                  />
                  <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                </div>
                <button
                  onClick={handleVoiceSearch}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                    listening
                      ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic size={14} />
                  <span>{listening ? dcT.dcBtnVoiceListening : dcT.dcBtnVoice}</span>
                </button>
              </div>
            </div>

            {/* AI Summary Panel & Action Buttons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Export Panel */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-300 border-b border-slate-850 pb-2">📦 Ekspor & Unduh Laporan</h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
                  <button
                    onClick={handleExportJSON}
                    disabled={dcRecords.length === 0}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center hover:border-cyan-500/30 hover:text-cyan-400 transition-all disabled:opacity-40"
                  >
                    {dcT.dcBtnExportJSON}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={dcRecords.length === 0}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center hover:border-cyan-500/30 hover:text-cyan-400 transition-all disabled:opacity-40"
                  >
                    {dcT.dcBtnExportCSV}
                  </button>
                  <button
                    onClick={handleExportGeoJSON}
                    disabled={dcRecords.length === 0}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center hover:border-cyan-500/30 hover:text-cyan-400 transition-all disabled:opacity-40"
                  >
                    {dcT.dcBtnExportGeoJSON}
                  </button>
                  <button
                    onClick={handleExportExcel}
                    disabled={dcRecords.length === 0}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center hover:border-cyan-500/30 hover:text-cyan-400 transition-all disabled:opacity-40"
                  >
                    {dcT.dcBtnExportExcel}
                  </button>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={dcRecords.length === 0}
                  className="w-full flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:brightness-110 disabled:opacity-40"
                >
                  <FileText size={14} />
                  <span>{dcT.dcBtnExportPDF}</span>
                </button>
              </div>

              {/* AI Summary Panel */}
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/50 to-teal-950/10 border border-slate-900 rounded-3xl p-5 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Sparkles size={14} className="text-teal-400 animate-pulse" />
                  <h3 className="text-xs font-black uppercase text-slate-200">{dcT.dcAISumTitle}</h3>
                </div>
                <p className="text-[11px] text-slate-400">{dcT.dcAISumDesc}</p>
                {dcAiSummary ? (
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-xs text-teal-100/90 leading-relaxed font-bold">
                    {dcAiSummary}
                  </div>
                ) : (
                  <button
                    onClick={generateDcAiSummary}
                    disabled={dcRecords.length === 0 || dcAiLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-black uppercase rounded-xl hover:bg-teal-500/20 transition-all disabled:opacity-40"
                  >
                    {dcAiLoading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>{dcAiLoading ? dcT.dcAISumLoading : dcT.dcAISumBtn}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-4">
              {dcLoading ? (
                <div className="text-center py-20">
                  <RefreshCw size={32} className="animate-spin text-cyan-400 mx-auto" />
                </div>
              ) : dcRecords.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-16 font-bold">{dcT.dcTableEmpty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                        <th className="py-3 px-4">{dcT.dcTableColType}</th>
                        <th className="py-3 px-4">{dcT.dcTableColTitle}</th>
                        <th className="py-3 px-4">{dcT.dcTableColLocation}</th>
                        <th className="py-3 px-4">{dcT.dcTableColSeverity}</th>
                        <th className="py-3 px-4">{dcT.dcTableColTime}</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-300 divide-y divide-slate-900/40">
                      {dcRecords.map((origR, idx) => {
                        const r = getLocalizedRecord(origR, language);
                        const icon = 
                          r.type === 'volcano' ? '🏔️' : 
                          r.type === 'quake' ? '🌋' : 
                          r.type === 'hotspots' ? '🔥' :
                          r.type === 'cyclone' ? '🌀' :
                          r.type === 'flood' ? '🌊' :
                          r.type === 'tsunami' ? '🚨' :
                          r.type === 'weather' ? '⛈️' : '🌍';
                        const badgeColor = 
                          r.severity === 'CRITICAL' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                          r.severity === 'HIGH' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                          r.severity === 'MODERATE' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                          'bg-green-500/20 border-green-500/30 text-green-400';

                        return (
                          <tr key={r.id || idx} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-4 px-4 text-base">{icon}</td>
                            <td className="py-4 px-4">
                              <p className="text-white text-xs">{r.title}</p>
                              <p className="text-[10px] text-slate-500 font-bold mt-1" dangerouslySetInnerHTML={{ __html: r.details }}></p>
                            </td>
                            <td className="py-4 px-4 text-xs">{r.location}</td>
                            <td className="py-4 px-4">
                              <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded border ${badgeColor}`}>
                                {r.severity}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-400 text-xs">
                              {new Date(r.timestamp).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
