"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import {
  Wind, Droplets, Thermometer, Eye, Sun, Cloud, CloudRain,
  CloudSnow, Zap, Search, MapPin, RefreshCw, AlertTriangle,
  Camera, Mic, MicOff, Share2, ChevronRight, ArrowLeft,
  Navigation, Gauge, Sunset, Sunrise, Info, X, Map, Calendar,
  Volume2, TrendingUp, Award, Clock, Home
} from 'lucide-react';
import dynamic from 'next/dynamic';
const MapLibreDisasterMap = dynamic(
  () => import('../kebencanaan/MapLibreDisasterMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[350px] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-extrabold">Memuat Peta...</p>
        </div>
      </div>
    )
  }
);

const EarthMonitoringMap = dynamic(
  () => import('./EarthMonitoringMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-blue-500/20 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-extrabold">Memuat Peta Satelit...</p>
        </div>
      </div>
    )
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────
interface WeatherData {
  city: string;
  country: string;
  lat: number;
  lon: number;
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  visibility: number;
  pressure: number;
  sunrise: number;
  sunset: number;
  uvi?: number;
}

interface ForecastDay {
  date: string;
  dayName: string;
  high: number;
  low: number;
  description: string;
  icon: string;
  precip_prob: number;
  wind_speed: number;
  weatherCode?: number;
}

interface CommunityReport {
  city: string;
  condition: string;
  note: string;
  timestamp: string;
  emoji: string;
  photoUrl?: string; // base64 or upload
}

interface ActivityEvent {
  time: string;
  title: string;
  location: string;
}

// ─── Weather icon mapping ─────────────────────────────────────────────────────
function WeatherIcon({ code, size = 40 }: { code: string; size?: number }) {
  const url = `https://openweathermap.org/img/wn/${code}@2x.png`;
  return <img src={url} alt="weather" width={size} height={size} className="drop-shadow-md" />;
}

function getWeatherEmoji(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes('thunder') || d.includes('petir')) return '⛈';
  if (d.includes('snow') || d.includes('salju')) return '❄️';
  if (d.includes('rain') || d.includes('hujan')) return '🌧';
  if (d.includes('drizzle') || d.includes('gerimis')) return '🌦';
  if (d.includes('cloud') || d.includes('awan')) return '☁️';
  if (d.includes('mist') || d.includes('fog') || d.includes('kabut')) return '🌫';
  if (d.includes('clear') || d.includes('cerah')) return '☀️';
  return '🌤';
}

function getWindDirection(deg: number): string {
  const dirs = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
  return dirs[Math.round(deg / 45) % 8];
}

function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// ─── Weather Canvas Animation ──────────────────────────────────────────────────
function WeatherCanvas({ condition }: { condition: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 110);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth || 300;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles: any[] = [];
    const conditionLower = condition.toLowerCase();
    const isRain = conditionLower.includes('hujan') || conditionLower.includes('rain') || conditionLower.includes('gerimis') || conditionLower.includes('drizzle') || conditionLower.includes('petir') || conditionLower.includes('thunder');
    const isSnow = conditionLower.includes('snow') || conditionLower.includes('salju');
    const isCloudy = conditionLower.includes('cloud') || conditionLower.includes('awan') || conditionLower.includes('mendung') || conditionLower.includes('fog') || conditionLower.includes('kabut') || conditionLower.includes('mist');
    const isClear = !isRain && !isSnow && !isCloudy;

    const clouds = [
      { x: 40, y: 30, r: 24, speed: 0.12 },
      { x: 140, y: 20, r: 32, speed: 0.08 },
      { x: 260, y: 35, r: 20, speed: 0.15 },
    ];

    let flash = 0;

    const createParticle = () => {
      if (isRain) {
        return {
          x: Math.random() * width,
          y: -10,
          vy: 5 + Math.random() * 4,
          vx: -1 + Math.random() * 2,
          l: 7 + Math.random() * 6,
        };
      }
      if (isSnow) {
        return {
          x: Math.random() * width,
          y: -10,
          vy: 1 + Math.random() * 1.5,
          vx: -0.5 + Math.random() * 1,
          r: 2.5 + Math.random() * 2,
        };
      }
      return null;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      if (isClear) {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#0284c7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Sun
        ctx.beginPath();
        ctx.arc(width - 50, 40, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        grad.addColorStop(0, '#475569');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw clouds
      if (isCloudy || isRain || isSnow) {
        ctx.fillStyle = isRain ? 'rgba(51, 65, 85, 0.65)' : 'rgba(241, 245, 249, 0.55)';
        clouds.forEach((c) => {
          c.x += c.speed;
          if (c.x - c.r > width) c.x = -c.r;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.arc(c.x + c.r * 0.6, c.y - c.r * 0.4, c.r * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Lightning
      if (conditionLower.includes('petir') || conditionLower.includes('thunder')) {
        if (Math.random() < 0.015) flash = 1;
        if (flash > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
          ctx.fillRect(0, 0, width, height);
          flash -= 0.08;

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(Math.random() * width, 5);
          ctx.lineTo(Math.random() * width, height / 2);
          ctx.lineTo(Math.random() * width, height - 5);
          ctx.stroke();
        }
      }

      // Particles
      if ((isRain || isSnow) && particles.length < 40) {
        const p = createParticle();
        if (p) particles.push(p);
      }

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#67e8f9';
      particles.forEach((p, idx) => {
        if (isRain) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx, p.y + p.l);
          ctx.stroke();

          p.y += p.vy;
          p.x += p.vx;
          if (p.y > height) {
            particles[idx] = createParticle() || p;
            particles[idx].y = 0;
          }
        } else if (isSnow) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.vy;
          p.x += p.vx;
          if (p.y > height) {
            particles[idx] = createParticle() || p;
            particles[idx].y = 0;
          }
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [condition]);

  return <canvas ref={canvasRef} className="w-full h-[110px] rounded-2xl shadow-inner bg-slate-900 block" />;
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({ weather }: { weather: WeatherData | null }) {
  const language = useSiteLanguage();
  if (!weather) return null;
  const alerts: string[] = [];

  if (weather.temp > 36) {
    alerts.push(
      language === 'id' || language === 'ms' ? `🌡 Suhu ekstrem ${weather.temp}°C – hindari aktivitas luar ruang siang hari` :
        language === 'zh' ? `🌡 极端高温 ${weather.temp}°C – 白天避免户外活动` :
          language === 'ja' ? `🌡 極端な高温 ${weather.temp}°C – 日中の屋外活動を避けてください` :
            language === 'ru' ? `🌡 Экстремальная температура ${weather.temp}°C – избегайте пребывания на улице в дневное время` :
              language === 'fr' ? `🌡 Température extrême ${weather.temp}°C – évitez les activités de plein air en journée` :
                `🌡 Extreme temperature ${weather.temp}°C – avoid outdoor activities during midday`
    );
  }

  if (weather.wind_speed > 10) {
    alerts.push(
      language === 'id' || language === 'ms' ? `💨 Angin kencang ${weather.wind_speed} m/s – waspadai pohon tumbang` :
        language === 'zh' ? `💨 强风 ${weather.wind_speed} 米/秒 – 注意树木倒塌` :
          language === 'ja' ? `💨 強風 ${weather.wind_speed} m/s – 倒木に注意してください` :
            language === 'ru' ? `💨 Сильный ветер ${weather.wind_speed} м/с – остерегайтесь падения деревьев` :
              language === 'fr' ? `💨 Vent violent ${weather.wind_speed} m/s – attention aux chutes d'arbres` :
                `💨 Strong wind ${weather.wind_speed} m/s – beware of falling trees`
    );
  }

  if (weather.humidity > 90) {
    alerts.push(
      language === 'id' || language === 'ms' ? `💧 Kelembapan sangat tinggi ${weather.humidity}% – potensi hujan lebat` :
        language === 'zh' ? `💧 湿度非常高 ${weather.humidity}% – 潜在强降雨` :
          language === 'ja' ? `💧 非常に高い湿度 ${weather.humidity}% – 大雨の可能性` :
            language === 'ru' ? `💧 Очень высокая влажность ${weather.humidity}% – возможен сильный дождь` :
              language === 'fr' ? `💧 Humidité très élevée ${weather.humidity}% – risque de fortes pluies` :
                `💧 Very high humidity ${weather.humidity}% – potential heavy rain`
    );
  }

  if (!alerts.length) return null;

  const title =
    language === 'id' || language === 'ms' ? 'Peringatan Cuaca Ekstrem' :
      language === 'zh' ? '极端天气警报' :
        language === 'ja' ? '異常気象警報' :
          language === 'ru' ? 'Предупреждение об опасной погоде' :
            language === 'fr' ? 'Alerte météo extrême' :
              'Extreme Weather Alert';

  return (
    <div className="mx-4 mb-4 bg-amber-50 border border-amber-300 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
      <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={18} />
      <div>
        <p className="font-bold text-amber-800 text-sm mb-1">{title}</p>
        {alerts.map((a, i) => <p key={i} className="text-amber-700 text-xs leading-relaxed">{a}</p>)}
      </div>
    </div>
  );
}

// ─── Forecast Card ────────────────────────────────────────────────────────────
function ForecastCard({ day, isSelected, onClick }: { day: ForecastDay; isSelected: boolean; onClick: () => void }) {
  const language = useSiteLanguage();
  const t = localDict[language] || localDict['id'];

  const dayName = day.dayName === 'Hari ini'
    ? (t.todayLabel || 'Hari ini')
    : new Date(day.date).toLocaleDateString(getLocaleForLanguage(language), { weekday: 'short' });

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center bg-white rounded-2xl p-3 border shadow-sm min-w-[85px] snap-start transition-all ${isSelected ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/30' : 'border-gray-100 hover:bg-gray-50'}`}
    >
      <p className="text-[10px] font-bold text-gray-500 mb-1">{dayName}</p>
      <WeatherIcon code={day.icon} size={28} />
      <p className="text-sm font-black text-gray-800">{Math.round(day.high)}°</p>
      <p className="text-[10px] text-gray-400">{Math.round(day.low)}°</p>
      {day.precip_prob > 0 && (
        <p className="text-[9px] text-blue-500 font-semibold mt-1">{day.precip_prob}%💧</p>
      )}
    </button>
  );
}
function isReadableLink(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  const lower = url.toLowerCase();
  if (lower.endsWith('.csv') || lower.endsWith('.tcw') || lower.endsWith('.json') || lower.endsWith('.xml') || lower.endsWith('.txt')) {
    return false;
  }
  return true;
}

function getWeatherLevel(xp: number): string {
  if (xp < 50) return 'Pengamat Awan';
  if (xp < 150) return 'Prakirawan Amatir';
  if (xp < 300) return 'Ahli Cuaca';
  return 'Meteorolog Senior';
}

const localDict: Record<string, Record<string, string>> = {
  id: {
    tabWeather: "Cuaca",
    tabForecast: "Prakiraan",
    tabMap: "Peta Radar",
    tabReport: "Laporan",
    tabCalendar: "Rencana",
    tabDisaster: "Kebencanaan",
    tabDisasterMap: "🗺️ Peta Bencana",
    guideTitle: "📖 Panduan Fitur",
    guideDistTitle: "Ukur Jarak",
    guideDistDesc: "Klik titik-titik di peta untuk mengukur jarak lintas waypoint.",
    guideAreaTitle: "Luas Area",
    guideAreaDesc: "Buat poligon dan hitung luas dalam km² dan hektar.",
    guideRadiusTitle: "Buffer Radius",
    guideRadiusDesc: "Tentukan pusat & radius lingkaran, lihat objek di dalamnya.",
    guideETATitle: "Rute & ETA",
    guideETADesc: "Hitung rute jalan kaki, mobil, sepeda via OSRM.",
    guideSearchTitle: "Cari Lokasi",
    guideSearchDesc: "Cari restoran, kantor, dan tempat via OpenStreetMap.",
    guideShareTitle: "Berbagi",
    guideShareDesc: "WhatsApp, Telegram, Email, QR Code, dan lainnya.",
    searchPlaceholder: "Cari kota, daerah, atau koordinat (-6.2, 106.8)",
    btnSearch: "Cari",
    loadingStation: "Memuat data stasiun BMKG terdekat...",
    hottestDay: "Hari terpanas:",
    windiestDay: "Hari paling berangin:",
    ensoTitle: "Status Iklim ENSO Terkini",
    forecastTitle: "Prakiraan 7 Hari",
    weeklyDetails: "Detail Mingguan →",
    spaceWeatherTitle: "Cuaca Antariksa NOAA / USGS",
    satelliteRisk: "Resiko Satelit:",
    kpLabel: "Kp Index (Geomagnetik)",
    kpScale: "Skala 0-9",
    windLabel: "Angin Matahari",
    windUnit: "km/detik",
    auroraLabel: "Peluang Aurora",
    auroraHigh: "Lintang Tinggi",
    actMagnet: "Aktivitas Magnetosfer:",
    actRec: "Pengaruh & Rekomendasi:",
    stormClass: "Status Badai:",
    releaseLabel: "Rilis:",
    missionControl: "🛰️ Integrasi Sistem Misi",
    issTitle: "Space Control & Pelacak ISS Live",
    issDesc: "Pantau stasiun luar angkasa ISS di peta Voyager, lintasan orbit aktual, dan daftar astronot aktif di luar angkasa secara real-time.",
    btnOpenIss: "Buka Dashboard ISS Tracker →",
    forumTitle: "Diskusi Komunitas Terbaru (D1)",
    allForum: "Semua Forum →",
    votesLabel: "voting",
    forecastDetailTitle: "Prakiraan Detail 7 Hari",
    forecastSearchPlaceholder: "Masukkan nama kota untuk memuat prakiraan.",
    rainChance: "Peluang Hujan",
    selectedDetailTitle: "Detail Kondisi Terpilih",
    tempMax: "Temp Maks",
    tempMin: "Temp Min",
    windSpeedLabel: "Kec. Angin",
    conditionPred: "Prediksi Kondisi",
    rainChanceText: "Terdapat peluang curah hujan sebesar {prob}%.",
    dryCondText: "Kondisi kering tanpa ada potensi hujan.",
    interactiveMapTitle: "Peta Cuaca Interaktif",
    radarMapFrameTitle: "Peta Radar Angin & Hujan",
    mapSearchPrompt: "Masukkan pencarian kota untuk memetakan koordinat radar.",
    mapDesc: "Peta di atas memuat layer radar awan, intensitas curah hujan, angin permukaan, serta tekanan udara langsung dari stasiun pemantau Windy. Anda dapat berinteraksi, melakukan zoom, atau menunjuk wilayah lain untuk detail koordinat.",
    commReportTitle: "Laporan Cuaca Komunitas",
    sendReportTitle: "Kirim Laporan Cuaca di Lokasi Anda",
    cityPlaceholder: "Nama kota / daerah",
    selectCondition: "Pilih Kondisi",
    notePlaceholder: "Catatan tambahan (contoh: Jalanan banjir bandang)",
    addPhotoLabel: "Tambahkan Foto Kondisi Langit (Opsional)",
    reportSent: "✓ Laporan Terkirim!",
    sendGetXP: "Kirim & Dapatkan +50 XP",
    noReports: "Belum ada laporan dari komunitas.",
    cond_clear: "Cerah",
    cond_cloudy: "Berawan",
    cond_drizzle: "Gerimis",
    cond_heavy_rain: "Hujan Deras",
    cond_thunderstorm: "Badai Petir",
    cond_foggy: "Berkabut",
    calendarTitle: "Integrasi Kalender & Rencana Aktivitas",
    planSchedule: "Rencanakan Jadwal Anda",
    activityPlaceholder: "Nama kegiatan (contoh: Main bola)",
    locationPlaceholder: "Kota lokasi",
    addScheduleBtn: "Tambah Jadwal (+20 XP)",
    agendaTitle: "📅 Agenda Anda & Rekomendasi Cuaca Otomatis",
    noAgenda: "Belum ada agenda terjadwal.",
    deleteAgenda: "Hapus Agenda",
    timeLabel: "Jam",
    adviceLoadWeather: "Muat data cuaca untuk mendapatkan saran aktivitas pintar.",
    adviceRegional: "Rencana di {location}. (Prakiraan cuaca regional disarankan).",
    adviceRain: "🌧️ Saran: Jadwal '{title}' Anda terancam hujan lebat. Pindahkan ke dalam ruangan (indoor) agar tetap aman.",
    adviceHot: "🔥 Saran: Suhu sangat panas ({temp}°C). Siapkan air minum ekstra agar terhindar dari dehidrasi.",
    adviceGood: "☀️ Saran: Cuaca di {city} sangat bagus ({desc}, {temp}°C). Waktu ideal untuk {title}!",
    todayLabel: "Hari ini",
    appTitle: "Cuaca & Langit",
    appSubtitle: "Cuaca Indonesia",
    feelsLike: "Terasa seperti",
    realTimeWeatherVis: "Visualisasi Cuaca Real-Time",
    statHumidity: "Lembap",
    statWind: "Angin",
    statClouds: "Awan",
    statPressure: "Tekanan",
    loadingWeatherStation: "Memuat data stasiun BMKG terdekat...",
    searchWeatherPrompt: "Cari Cuaca Wilayah Anda",
    searchWeatherDesc: "Gunakan form pencarian di atas untuk memasukkan nama kota atau klik tombol di bawah untuk memuat cuaca default Jakarta.",
    loadDefaultWeatherBtn: "Muat Cuaca Jakarta",
    cameraAccessFailed: "⚠ Akses Kamera Gagal",
    closeAr: "Tutup AR",
    feelsLikeLabel: "Terasa",
    takeArPhoto: "Ambil Foto Cuaca AR"
  },
  en: {
    tabWeather: "Weather",
    tabForecast: "Forecast",
    tabMap: "Radar Map",
    tabReport: "Reports",
    tabCalendar: "Planner",
    tabDisaster: "Disasters",
    tabDisasterMap: "🗺️ Disaster Map",
    guideTitle: "📖 Feature Guide",
    guideDistTitle: "Measure Distance",
    guideDistDesc: "Click points on map to measure path distance.",
    guideAreaTitle: "Area Size",
    guideAreaDesc: "Create polygons and calculate area in km² and hectares.",
    guideRadiusTitle: "Radius Buffer",
    guideRadiusDesc: "Set center and radius circle to see objects inside.",
    guideETATitle: "Route & ETA",
    guideETADesc: "Calculate walking, driving, cycling routes via OSRM.",
    guideSearchTitle: "Search Place",
    guideSearchDesc: "Find restaurants, offices, and places via OpenStreetMap.",
    guideShareTitle: "Share",
    guideShareDesc: "WhatsApp, Telegram, Email, QR Code, and more.",
    searchPlaceholder: "Search city, region, or coordinates (-6.2, 106.8)",
    btnSearch: "Search",
    loadingStation: "Loading data from nearest BMKG station...",
    hottestDay: "Hottest day:",
    windiestDay: "Windiest day:",
    ensoTitle: "Current ENSO Climate Status",
    forecastTitle: "7-Day Forecast",
    weeklyDetails: "Weekly Details →",
    spaceWeatherTitle: "NOAA / USGS Space Weather",
    satelliteRisk: "Satellite Risk:",
    kpLabel: "Kp Index (Geomagnetic)",
    kpScale: "Scale 0-9",
    windLabel: "Solar Wind",
    windUnit: "km/s",
    auroraLabel: "Aurora Probability",
    auroraHigh: "High Latitudes",
    actMagnet: "Magnetosphere Activity:",
    actRec: "Influence & Advice:",
    stormClass: "Storm Status:",
    releaseLabel: "Release:",
    missionControl: "🛰️ Mission System Integration",
    issTitle: "Space Control & Live ISS Tracker",
    issDesc: "Track the ISS space station on Voyager maps, view active orbital paths, and see active astronaut rosters in real-time.",
    btnOpenIss: "Open ISS Tracker Dashboard →",
    forumTitle: "Latest Community Discussions (D1)",
    allForum: "All Forums →",
    votesLabel: "votes",
    forecastDetailTitle: "7-Day Detailed Forecast",
    forecastSearchPlaceholder: "Enter city name to load forecast.",
    rainChance: "Precipitation Chance",
    selectedDetailTitle: "Selected Condition Details",
    tempMax: "Temp Max",
    tempMin: "Temp Min",
    windSpeedLabel: "Wind Speed",
    conditionPred: "Condition Forecast",
    rainChanceText: "There is a {prob}% chance of precipitation.",
    dryCondText: "Dry conditions with no chance of rain.",
    interactiveMapTitle: "Interactive Weather Map",
    radarMapFrameTitle: "Wind & Rain Radar Map",
    mapSearchPrompt: "Enter a city search to map radar coordinates.",
    mapDesc: "The map above displays cloud radar layers, precipitation intensity, surface wind, and atmospheric pressure directly from Windy monitoring stations. You can interact, zoom in/out, or click other areas for coordinates details.",
    commReportTitle: "Community Weather Reports",
    sendReportTitle: "Send Weather Report from Your Location",
    cityPlaceholder: "City / region name",
    selectCondition: "Select Condition",
    notePlaceholder: "Additional notes (e.g., Road flooded)",
    addPhotoLabel: "Add Sky Condition Photo (Optional)",
    reportSent: "✓ Report Sent!",
    sendGetXP: "Send & Get +50 XP",
    noReports: "No community reports yet.",
    cond_clear: "Clear",
    cond_cloudy: "Cloudy",
    cond_drizzle: "Drizzle",
    cond_heavy_rain: "Heavy Rain",
    cond_thunderstorm: "Thunderstorm",
    cond_foggy: "Foggy",
    calendarTitle: "Calendar Integration & Activity Planner",
    planSchedule: "Plan Your Schedule",
    activityPlaceholder: "Activity name (e.g., Football)",
    locationPlaceholder: "Location city",
    addScheduleBtn: "Add Schedule (+20 XP)",
    agendaTitle: "📅 Your Agenda & Auto Weather Advice",
    noAgenda: "No scheduled agenda yet.",
    deleteAgenda: "Delete Agenda",
    timeLabel: "Time",
    adviceLoadWeather: "Load weather data to get smart activity recommendations.",
    adviceRegional: "Plan in {location}. (Regional weather forecast advised).",
    adviceRain: "🌧️ Advice: Your schedule '{title}' is threatened by heavy rain. Move it indoors to stay safe.",
    adviceHot: "🔥 Advice: Very hot temperature ({temp}°C). Prepare extra drinking water to avoid dehydration.",
    adviceGood: "☀️ Advice: Weather in {city} is excellent ({desc}, {temp}°C). Ideal time for {title}!",
    todayLabel: "Today",
    appTitle: "Weather & Sky",
    appSubtitle: "Indonesia Weather PWA",
    feelsLike: "Feels like",
    realTimeWeatherVis: "Real-Time Weather Visualization",
    statHumidity: "Humidity",
    statWind: "Wind",
    statClouds: "Clouds",
    statPressure: "Pressure",
    loadingWeatherStation: "Loading weather data...",
    searchWeatherPrompt: "Search Weather in Your Area",
    searchWeatherDesc: "Use the search form above to enter a city name, or click the button below to load default Jakarta weather.",
    loadDefaultWeatherBtn: "Load Jakarta Weather",
    cameraAccessFailed: "⚠ Camera Access Failed",
    closeAr: "Close AR",
    feelsLikeLabel: "Feels",
    takeArPhoto: "Take AR Weather Photo"
  },
  ms: {
    tabWeather: "Cuaca",
    tabForecast: "Ramalan",
    tabMap: "Peta Radar",
    tabReport: "Laporan",
    tabCalendar: "Perancang",
    tabDisaster: "Bencana",
    tabDisasterMap: "🗺️ Peta Bencana",
    guideTitle: "📖 Panduan Ciri",
    guideDistTitle: "Ukur Jarak",
    guideDistDesc: "Klik titik-titik di peta untuk mengukur jarak rentas waypoint.",
    guideAreaTitle: "Luas Kawasan",
    guideAreaDesc: "Buat poligon dan kira luas dalam km² dan hektar.",
    guideRadiusTitle: "Buffer Radius",
    guideRadiusDesc: "Tentukan pusat & radius bulatan, lihat objek di dalamnya.",
    guideETATitle: "Laluan & ETA",
    guideETADesc: "Kira laluan berjalan kaki, kereta, basikal via OSRM.",
    guideSearchTitle: "Cari Lokasi",
    guideSearchDesc: "Cari restoran, pejabat, dan tempat via OpenStreetMap.",
    guideShareTitle: "Kongsi",
    guideShareDesc: "WhatsApp, Telegram, E-mel, Kod QR, dan lain-lain.",
    searchPlaceholder: "Cari bandar, daerah, atau koordinat (-6.2, 106.8)",
    btnSearch: "Cari",
    loadingStation: "Memuatkan data stesen BMKG terdekat...",
    hottestDay: "Hari terpanas:",
    windiestDay: "Hari paling berangin:",
    ensoTitle: "Status Iklim ENSO Terkini",
    forecastTitle: "Ramalan 7 Hari",
    weeklyDetails: "Butiran Mingguan →",
    spaceWeatherTitle: "Cuaca Antariksa NOAA / USGS",
    satelliteRisk: "Risiko Satelit:",
    kpLabel: "Kp Index (Geomagnetik)",
    kpScale: "Skala 0-9",
    windLabel: "Angin Suria",
    windUnit: "km/saat",
    auroraLabel: "Peluang Aurora",
    auroraHigh: "Latitud Tinggi",
    actMagnet: "Aktiviti Magnetosfera:",
    actRec: "Kesan & Syor:",
    stormClass: "Status Ribut:",
    releaseLabel: "Rilis:",
    missionControl: "🛰️ Integrasi Sistem Misi",
    issTitle: "Space Control & Penjejak ISS Live",
    issDesc: "Pantau stesen angkasa ISS di peta Voyager, laluan orbit sebenar, dan senarai angkasawan aktif di angkasa secara real-time.",
    btnOpenIss: "Buka Papan Pemuka ISS Tracker →",
    forumTitle: "Perbincangan Komuniti Terkini (D1)",
    allForum: "Semua Forum →",
    votesLabel: "undian",
    forecastDetailTitle: "Ramalan Terperinci 7 Hari",
    forecastSearchPlaceholder: "Masukkan nama bandar untuk memuatkan ramalan.",
    rainChance: "Peluang Hujan",
    selectedDetailTitle: "Butiran Keadaan Terpilih",
    tempMax: "Temp Maks",
    tempMin: "Temp Min",
    windSpeedLabel: "Kel. Angin",
    conditionPred: "Ramalan Keadaan",
    rainChanceText: "Terdapat peluang hujan sebanyak {prob}%.",
    dryCondText: "Keadaan kering tanpa potensi hujan.",
    interactiveMapTitle: "Peta Cuaca Interaktif",
    radarMapFrameTitle: "Peta Radar Angin & Hujan",
    mapSearchPrompt: "Masukkan carian bandar untuk memetakan koordinat radar.",
    mapDesc: "Peta di atas memuatkan lapisan radar awan, keamatan hujan, angin permukaan, serta tekanan udara terus dari stesen pemantauan Windy. Anda boleh berinteraksi, mengezum, atau menuding kawasan lain untuk butiran koordinat.",
    commReportTitle: "Laporan Cuaca Komuniti",
    sendReportTitle: "Hantar Laporan Cuaca di Lokasi Anda",
    cityPlaceholder: "Nama bandar / kawasan",
    selectCondition: "Pilih Keadaan",
    notePlaceholder: "Nota tambahan (contoh: Jalan dinaiki air)",
    addPhotoLabel: "Tambah Foto Keadaan Langit (Pilihan)",
    reportSent: "✓ Laporan Dihantar!",
    sendGetXP: "Hantar & Dapatkan +50 XP",
    noReports: "Belum ada laporan dari komuniti.",
    cond_clear: "Cerah",
    cond_cloudy: "Berawan",
    cond_drizzle: "Gerimis",
    cond_heavy_rain: "Hujan Lebat",
    cond_thunderstorm: "Ribut Petir",
    cond_foggy: "Berkabut",
    calendarTitle: "Integrasi Kalendar & Perancang Aktiviti",
    planSchedule: "Rancang Jadual Anda",
    activityPlaceholder: "Nama aktiviti (contoh: Main bola)",
    locationPlaceholder: "Bandar lokasi",
    addScheduleBtn: "Tambah Jadwal (+20 XP)",
    agendaTitle: "📅 Agenda Anda & Syor Cuaca Automatik",
    noAgenda: "Belum ada agenda dijadualkan.",
    deleteAgenda: "Padam Agenda",
    timeLabel: "Jam",
    adviceLoadWeather: "Muatkan data cuaca untuk mendapatkan cadangan aktiviti pintar.",
    adviceRegional: "Rancangan di {location}. (Ramalan cuaca serantau disyorkan).",
    adviceRain: "🌧️ Syor: Jadual '{title}' anda terancam hujan lebat. Pindahkan ke dalam bilik (indoor) agar tetap selamat.",
    adviceHot: "🔥 Syor: Suhu sangat panas ({temp}°C). Sediakan air minuman tambahan untuk mengelakkan dehidrasi.",
    adviceGood: "☀️ Syor: Cuaca di {city} sangat baik ({desc}, {temp}°C). Waktu ideal untuk {title}!",
    todayLabel: "Hari ini",
    appTitle: "Cuaca & Langit",
    appSubtitle: "PWA Cuaca Indonesia",
    feelsLike: "Terasa seperti",
    realTimeWeatherVis: "Visualisasi Cuaca Real-Time",
    statHumidity: "Kelembapan",
    statWind: "Angin",
    statClouds: "Awan",
    statPressure: "Tekanan",
    loadingWeatherStation: "Memuatkan data stesen BMKG terdekat...",
    searchWeatherPrompt: "Cari Cuaca Wilayah Anda",
    searchWeatherDesc: "Gunakan borang carian di atas untuk memasukkan nama bandar atau klik butang di bawah untuk memuatkan cuaca lalai Jakarta.",
    loadDefaultWeatherBtn: "Muat Cuaca Jakarta",
    cameraAccessFailed: "⚠ Akses Kamera Gagal",
    closeAr: "Tutup AR",
    feelsLikeLabel: "Terasa",
    takeArPhoto: "Ambil Foto Cuaca AR"
  },
  zh: {
    tabWeather: "天气",
    tabForecast: "预报",
    tabMap: "雷达地图",
    tabReport: "报告",
    tabCalendar: "计划",
    tabDisaster: "防灾监测",
    tabDisasterMap: "🗺️ 灾害地图",
    guideTitle: "📖 功能指南",
    guideDistTitle: "测量距离",
    guideDistDesc: "在地图上点击各点以测量路径距离。",
    guideAreaTitle: "面积大小",
    guideAreaDesc: "创建多边形并计算以平方公里和公顷为单位的面积。",
    guideRadiusTitle: "缓冲区半径",
    guideRadiusDesc: "设置中心点和半径圆以查看内部对象。",
    guideETATitle: "路线与时间",
    guideETADesc: "通过 OSRM 计算步行、驾车、骑行路线。",
    guideSearchTitle: "搜索地点",
    guideSearchDesc: "通过 OpenStreetMap 查找餐厅、办公室和地点。",
    guideShareTitle: "分享",
    guideShareDesc: "微信、电报、电子邮件、二维码及更多。",
    searchPlaceholder: "搜索城市、区域或坐标 (-6.2, 106.8)",
    btnSearch: "搜索",
    loadingStation: "正在加载最近的 BMKG 气象站数据...",
    hottestDay: "最热天:",
    windiestDay: "风力最大天:",
    ensoTitle: "当前 ENSO 气候状态",
    forecastTitle: "7天天气预报",
    weeklyDetails: "每周详情 →",
    spaceWeatherTitle: "NOAA / USGS 空间天气",
    satelliteRisk: "卫星风险:",
    kpLabel: "Kp指数 (地磁活动)",
    kpScale: "范围 0-9",
    windLabel: "太阳风",
    windUnit: "千米/秒",
    auroraLabel: "极光概率",
    auroraHigh: "高纬度地区",
    actMagnet: "磁层活动:",
    actRec: "影响与建议:",
    stormClass: "风暴状态:",
    releaseLabel: "发布:",
    missionControl: "🛰️ 任务系统集成",
    issTitle: "空间控制与实时 ISS 追踪器",
    issDesc: "在旅行者地图上追踪 ISS 空间站，查看实际轨道运行轨迹，并实时查看在轨宇航员名单。",
    btnOpenIss: "打开 ISS 追踪器仪表板 →",
    forumTitle: "最新社区讨论 (D1)",
    allForum: "所有论坛 →",
    votesLabel: "投票",
    forecastDetailTitle: "7天详细预报",
    forecastSearchPlaceholder: "输入城市名称以加载预报。",
    rainChance: "降水概率",
    selectedDetailTitle: "所选条件详情",
    tempMax: "最高温度",
    tempMin: "最低温度",
    windSpeedLabel: "风速",
    conditionPred: "条件预报",
    rainChanceText: "降水概率为 {prob}%。",
    dryCondText: "天气干燥，无降水可能。",
    interactiveMapTitle: "互动天气地图",
    radarMapFrameTitle: "风雨雷达地图",
    mapSearchPrompt: "输入城市搜索以定位雷达坐标。",
    mapDesc: "上方地图加载了来自 Windy 监测站的云层雷达、降水强度、表面风力以及气压的实时数据。您可以进行缩放互动，或点击其他区域查看详细坐标。",
    commReportTitle: "社区天气报告",
    sendReportTitle: "发送您所在位置的天气报告",
    cityPlaceholder: "城市/区域名称",
    selectCondition: "选择天气状况",
    notePlaceholder: "附加说明（例如：道路积水严重）",
    addPhotoLabel: "添加天空状况照片（可选）",
    reportSent: "✓ 报告已发送！",
    sendGetXP: "发送并获得 +50 XP",
    noReports: "暂无社区报告。",
    cond_clear: "晴朗",
    cond_cloudy: "多云",
    cond_drizzle: "毛毛雨",
    cond_heavy_rain: "大雨",
    cond_thunderstorm: "雷阵雨",
    cond_foggy: "有雾",
    calendarTitle: "日历集成与活动规划",
    planSchedule: "规划您的日程",
    activityPlaceholder: "活动名称（例如：踢足球）",
    locationPlaceholder: "活动城市",
    addScheduleBtn: "添加日程 (+20 XP)",
    agendaTitle: "📅 您的日程与智能天气建议",
    noAgenda: "暂无日程安排。",
    deleteAgenda: "删除日程",
    timeLabel: "时间",
    adviceLoadWeather: "加载天气数据以获取智能活动建议。",
    adviceRegional: "{location} 的行程。(建议参考区域天气预报)。",
    adviceRain: "🌧️ 建议：您的日程 '{title}' 可能会遇到大雨天气。请移至室内以确保安全。",
    adviceHot: "🔥 建议：温度极高 ({temp}°C)。请准备充足的水以防脱水。",
    adviceGood: "☀️ 建议：{city} 天气非常好 ({desc}, {temp}°C)。是进行 {title} 的理想时间！",
    todayLabel: "今天",
    appTitle: "天气与天空",
    appSubtitle: "印度尼西亚天气 PWA",
    feelsLike: "体感",
    realTimeWeatherVis: "实时天气可视化",
    statHumidity: "湿度",
    statWind: "风速",
    statClouds: "云量",
    statPressure: "气压",
    loadingWeatherStation: "正在加载附近气象站 data...",
    searchWeatherPrompt: "查询您所在地区的天气",
    searchWeatherDesc: "使用上方的搜索框输入城市名称，或点击下方按钮加载默认的雅加达天气。",
    loadDefaultWeatherBtn: "加载雅加达天气",
    cameraAccessFailed: "⚠ 相机访问失败",
    closeAr: "关闭 AR",
    feelsLikeLabel: "体感",
    takeArPhoto: "拍摄 AR 天气照片"
  },
  ja: {
    tabWeather: "天気",
    tabForecast: "予報",
    tabMap: "雨雲レーダー",
    tabReport: "報告",
    tabCalendar: "予定",
    tabDisaster: "防災情報",
    tabDisasterMap: "🗺️ 災害マップ",
    guideTitle: "📖 機能ガイド",
    guideDistTitle: "距離測定",
    guideDistDesc: "地図上の点をクリックして経路の距離を測定します。",
    guideAreaTitle: "面積サイズ",
    guideAreaDesc: "多角形を作成し、平方キロメートルとヘクタールで面積を計算します。",
    guideRadiusTitle: "バッファ半径",
    guideRadiusDesc: "中心と半径を設定して内部のオブジェクトを確認します。",
    guideETATitle: "ルート＆時間",
    guideETADesc: "OSRM経由で徒歩、運転、自転車のルートを計算します。",
    guideSearchTitle: "場所の検索",
    guideSearchDesc: "OpenStreetMap経由で飲食店、オフィス、場所を検索します。",
    guideShareTitle: "共有",
    guideShareDesc: "WhatsApp、Telegram、メール、QRコードなど。",
    searchPlaceholder: "都市名、地域、または座標を入力 (-6.2, 106.8)",
    btnSearch: "検索",
    loadingStation: "最寄りの BMKG 気象台からデータを読み込んでいます...",
    hottestDay: "最も暑い日:",
    windiestDay: "最も風の強い日:",
    ensoTitle: "現在の ENSO 気候ステータス",
    forecastTitle: "7日間予報",
    weeklyDetails: "週間の詳細 →",
    spaceWeatherTitle: "NOAA / USGS 宇宙天気",
    satelliteRisk: "人工衛星リスク:",
    kpLabel: "Kp指数 (地磁気活動)",
    kpScale: "スケール 0-9",
    windLabel: "太陽風",
    windUnit: "km/s",
    auroraLabel: "オーロラ確率",
    auroraHigh: "高緯度地域",
    actMagnet: "磁気圏活動:",
    actRec: "影響と推奨事項:",
    stormClass: "嵐のステータス:",
    releaseLabel: "発表:",
    missionControl: "🛰️ ミッションシステム統合",
    issTitle: "宇宙管制＆リアルタイム ISS トラッカー",
    issDesc: "ボイジャーマップ上で ISS 宇宙ステーションを追跡し、実際の軌道ルートと活動中の宇宙飛行士名簿をリアルタイムで確認できます。",
    btnOpenIss: "ISSトラッカーダッシュボードを開く →",
    forumTitle: "最新のコミュニティディスカッション (D1)",
    allForum: "すべてのフォーラム →",
    votesLabel: "投票",
    forecastDetailTitle: "7日間詳細予報",
    forecastSearchPlaceholder: "都市名を入力して予報を読み込みます。",
    rainChance: "降水確率",
    selectedDetailTitle: "選択された条件の詳細",
    tempMax: "最高気温",
    tempMin: "最低気温",
    windSpeedLabel: "風速",
    conditionPred: "状態予報",
    rainChanceText: "降水確率は {prob}% です。",
    dryCondText: "雨の心配はなく乾燥しています。",
    interactiveMapTitle: "インタラクティブ天気マップ",
    radarMapFrameTitle: "風と雨のレーダーマップ",
    mapSearchPrompt: "都市名を入力してレーダー座標をマッピングします。",
    mapDesc: "上の地図には、Windy 監視ステーションから提供される雲レーダー、降水量強度、地表風、および気圧のリアルタイムデータが表示されます。地図の拡大縮小や、他の領域をクリックして座標の詳細を確認できます。",
    commReportTitle: "コミュニティ天気報告",
    sendReportTitle: "現在地の天気報告を送信",
    cityPlaceholder: "都市名 / 地域名",
    selectCondition: "天候を選択",
    notePlaceholder: "追加のメモ（例：道路が冠水しています）",
    addPhotoLabel: "空の写真を追加（任意）",
    reportSent: "✓ 報告が送信されました！",
    sendGetXP: "送信して +50 XP を獲得",
    noReports: "コミュニティからの報告はまだありません。",
    cond_clear: "晴れ",
    cond_cloudy: "曇り",
    cond_drizzle: "小雨",
    cond_heavy_rain: "大雨",
    cond_thunderstorm: "雷雨",
    cond_foggy: "霧",
    calendarTitle: "カレンダー連携＆アクティビティプランナー",
    planSchedule: "スケジュールの計画",
    activityPlaceholder: "予定名（例：サッカー）",
    locationPlaceholder: "都市名",
    addScheduleBtn: "予定を追加 (+20 XP)",
    agendaTitle: "📅 あなたの予定＆自動天気アドバイス",
    noAgenda: "スケジュールされた予定はまだありません。",
    deleteAgenda: "予定を削除",
    timeLabel: "時間",
    adviceLoadWeather: "スマートアクティビティ推奨を取得するには、天気データを読み込んでください。",
    adviceRegional: "{location} での予定。（地域の天気予報を参照することをお勧めします）。",
    adviceRain: "🌧️ アドバイス: 予定している '{title}' は大雨の影響を受ける可能性があります。安全のために室内に変更してください。",
    adviceHot: "🔥 アドバイス: 気温が非常に高いです ({temp}°C)。脱水を防ぐために多めの飲み水を用意してください。",
    adviceGood: "☀️ アドバイス: {city} の天気は非常に良好です ({desc}, {temp}°C)。'{title}' を行うのに最適な時間です！",
    todayLabel: "今日",
    appTitle: "天気と空",
    appSubtitle: "インドネシア天気 PWA",
    feelsLike: "体感温度",
    realTimeWeatherVis: "リアルタイム天気ビジュアライゼーション",
    statHumidity: "湿度",
    statWind: "風速",
    statClouds: "雲量",
    statPressure: "気圧",
    loadingWeatherStation: "最寄りの気象台からデータを読み込んでいます...",
    searchWeatherPrompt: "地域の天気を検索",
    searchWeatherDesc: "上の検索フォームに都市名を入力するか、下のボタンをクリックしてジャカルタのデフォルトの天気を読み込みます。",
    loadDefaultWeatherBtn: "ジャカルタの天気を読み込む",
    cameraAccessFailed: "⚠ カメラアクセス失敗",
    closeAr: "ARを閉じる",
    feelsLikeLabel: "体感",
    takeArPhoto: "AR天気写真を撮影"
  },
  ru: {
    tabWeather: "Погода",
    tabForecast: "Прогноз",
    tabMap: "Карта осадков",
    tabReport: "Отчеты",
    tabCalendar: "Планы",
    tabDisaster: "Катаклизмы",
    tabDisasterMap: "🗺️ Карта катастроф",
    guideTitle: "📖 Руководство",
    guideDistTitle: "Измерение расстояния",
    guideDistDesc: "Кликайте точки на карте для расчета расстояния пути.",
    guideAreaTitle: "Размер площади",
    guideAreaDesc: "Создавайте полигоны для расчета площади в кв.км и гектарах.",
    guideRadiusTitle: "Радиус зоны",
    guideRadiusDesc: "Установите центр и радиус для просмотра объектов внутри.",
    guideETATitle: "Маршрут и ETA",
    guideETADesc: "Расчет пеших, автомобильных и веломаршрутов через OSRM.",
    guideSearchTitle: "Поиск мест",
    guideSearchDesc: "Поиск заведений, офисов и мест через OpenStreetMap.",
    guideShareTitle: "Поделиться",
    guideShareDesc: "WhatsApp, Telegram, Email, QR-код и многое другое.",
    searchPlaceholder: "Поиск города, региона или координат (-6.2, 106.8)",
    btnSearch: "Искать",
    loadingStation: "Загрузка данных с ближайшей метеостанции BMKG...",
    hottestDay: "Самый жаркий день:",
    windiestDay: "Самый ветреный день:",
    ensoTitle: "Текущий климатический статус ENSO",
    forecastTitle: "Прогноз на 7 дней",
    weeklyDetails: "Подробный еженедельный прогноз →",
    spaceWeatherTitle: "Космическая погода NOAA / USGS",
    satelliteRisk: "Спутниковый риск:",
    kpLabel: "Kp-индекс (Геомагнитная активность)",
    kpScale: "Шкала 0-9",
    windLabel: "Солнечный ветер",
    windUnit: "км/с",
    auroraLabel: "Вероятность полярного сияния",
    auroraHigh: "Высокие широты",
    actMagnet: "Магнитосферная активность:",
    actRec: "Влияние и рекомендации:",
    stormClass: "Статус геомагнитной бури:",
    releaseLabel: "Опубликовано:",
    missionControl: "🛰️ Интеграция систем контроля полетов",
    issTitle: "Space Control & Live ISS Трекер",
    issDesc: "Отслеживайте МКС на картах Voyager, просматривайте орбиту полета и активный список астронавтов в реальном времени.",
    btnOpenIss: "Открыть панель трекера МКС →",
    forumTitle: "Последние обсуждения сообщества (D1)",
    allForum: "Все форумы →",
    votesLabel: "голосов",
    forecastDetailTitle: "Подробный прогноз на 7 дней",
    forecastSearchPlaceholder: "Введите название города для загрузки прогноза.",
    rainChance: "Вероятность осадков",
    selectedDetailTitle: "Детали выбранного дня",
    tempMax: "Темп. Макс",
    tempMin: "Темп. Мин",
    windSpeedLabel: "Скор. ветра",
    conditionPred: "Прогноз условий",
    rainChanceText: "Вероятность осадков составляет {prob}%.",
    dryCondText: "Сухая погода без вероятности дождя.",
    interactiveMapTitle: "Интерактивная карта погоды",
    radarMapFrameTitle: "Карта ветра и дождя",
    mapSearchPrompt: "Введите город для поиска координат на карте радара.",
    mapDesc: "Карта выше отображает слои облачности, интенсивность осадков, приземный ветер и атмосферное давление в реальном времени напрямую со станций мониторинга Windy. Вы можете взаимодействовать, масштабировать или кликать на другие области для получения подробных координат.",
    commReportTitle: "Отчеты о погоде от сообщества",
    sendReportTitle: "Отправить отчет о погоде в вашем районе",
    cityPlaceholder: "Название города / района",
    selectCondition: "Выберите состояние погоды",
    notePlaceholder: "Дополнительные примечания (например: Дороги затоплены)",
    addPhotoLabel: "Добавить фото неба (Необязательно)",
    reportSent: "✓ Отчет отправлен!",
    sendGetXP: "Отправить и получить +50 XP",
    noReports: "Отчетов от сообщества пока нет.",
    cond_clear: "Ясно",
    cond_cloudy: "Облачно",
    cond_drizzle: "Морось",
    cond_heavy_rain: "Сильный дождь",
    cond_thunderstorm: "Гроза",
    cond_foggy: "Туман",
    calendarTitle: "Интеграция календаря и планировщик активностей",
    planSchedule: "Запланируйте свое расписание",
    activityPlaceholder: "Название активности (например: Игра в футбол)",
    locationPlaceholder: "Город проведения",
    addScheduleBtn: "Добавить в планы (+20 XP)",
    agendaTitle: "📅 Ваши планы и автоматические советы по погоде",
    noAgenda: "Запланированных дел пока нет.",
    deleteAgenda: "Удалить из планов",
    timeLabel: "Время",
    adviceLoadWeather: "Загрузите данные о погоде для получения умных советов по активностям.",
    adviceRegional: "Планы в {location}. (Рекомендуется региональный прогноз погоды).",
    adviceRain: "🌧️ Совет: Ваша запланированная активность '{title}' находится под угрозой сильного дождя. Перенесите ее в помещение.",
    adviceHot: "🔥 Совет: Очень высокая температура ({temp}°C). Приготовьте дополнительную воду во избежание обезвоживания.",
    adviceGood: "☀️ Совет: Погода в {city} отличная ({desc}, {temp}°C). Идеальное время для {title}!",
    todayLabel: "Сегодня",
    appTitle: "Погода и Небо",
    appSubtitle: "PWA Погоды Индонезии",
    feelsLike: "Ощущается как",
    realTimeWeatherVis: "Визуализация погоды в реальном времени",
    statHumidity: "Влажность",
    statWind: "Ветер",
    statClouds: "Облачность",
    statPressure: "Давление",
    loadingWeatherStation: "Загрузка данных с метеостанции...",
    searchWeatherPrompt: "Поиск погоды в вашем районе",
    searchWeatherDesc: "Используйте форму поиска выше для ввода названия города или нажмите кнопку ниже, чтобы загрузить погоду по умолчанию в Джакарте.",
    loadDefaultWeatherBtn: "Загрузить погоду в Джакарте",
    cameraAccessFailed: "⚠ Сбой доступа к камере",
    closeAr: "Закрыть AR",
    feelsLikeLabel: "Ощущается",
    takeArPhoto: "Сделать AR фото погоды"
  },
  fr: {
    tabWeather: "Météo",
    tabForecast: "Prévisions",
    tabMap: "Carte Radar",
    tabReport: "Rapports",
    tabCalendar: "Planning",
    tabDisaster: "Catastrophes",
    tabDisasterMap: "🗺️ Carte Catastrophes",
    guideTitle: "📖 Guide des fonctionnalités",
    guideDistTitle: "Mesurer distance",
    guideDistDesc: "Cliquez sur des points pour mesurer la distance du tracé.",
    guideAreaTitle: "Superficie",
    guideAreaDesc: "Créez des polygones et calculez la surface en km² et hectares.",
    guideRadiusTitle: "Rayon zone",
    guideRadiusDesc: "Définissez le centre et le rayon pour voir les objets à l'intérieur.",
    guideETATitle: "Itinéraire & ETA",
    guideETADesc: "Calculez les itinéraires piéton, voiture, vélo via OSRM.",
    guideSearchTitle: "Rechercher lieu",
    guideSearchDesc: "Trouvez restos, bureaux et lieux via OpenStreetMap.",
    guideShareTitle: "Partager",
    guideShareDesc: "WhatsApp, Telegram, Email, Code QR, et plus.",
    searchPlaceholder: "Rechercher une ville, région ou coordonnées (-6.2, 106.8)",
    btnSearch: "Rechercher",
    loadingStation: "Chargement des données de la station BMKG la plus proche...",
    hottestDay: "Jour le plus chaud :",
    windiestDay: "Jour le plus venteux :",
    ensoTitle: "Statut climatique ENSO actuel",
    forecastTitle: "Prévisions sur 7 jours",
    weeklyDetails: "Détails hebdomadaires →",
    spaceWeatherTitle: "Météo spatiale NOAA / USGS",
    satelliteRisk: "Risque satellite :",
    kpLabel: "Indice Kp (Activité géomagnétique)",
    kpScale: "Échelle 0-9",
    windLabel: "Vent Solaire",
    windUnit: "km/s",
    auroraLabel: "Probabilité d'aurore",
    auroraHigh: "Hautes Latitudes",
    actMagnet: "Activité de la magnétosphère :",
    actRec: "Impacts & Conseils :",
    stormClass: "Statut de la tempête :",
    releaseLabel: "Publié :",
    missionControl: "🛰️ Intégration du système de mission",
    issTitle: "Contrôle spatial & Live ISS Tracker",
    issDesc: "Suivez la station spatiale ISS sur les cartes Voyager, visualisez l'orbite actuelle et affichez la liste des astronautes actifs en temps réel.",
    btnOpenIss: "Ouvrir le tableau de bord du traceur ISS →",
    forumTitle: "Discussions communautaires récentes (D1)",
    allForum: "Tous les forums →",
    votesLabel: "votes",
    forecastDetailTitle: "Prévisions détaillées sur 7 jours",
    forecastSearchPlaceholder: "Entrez le nom d'une ville pour charger les prévisions.",
    rainChance: "Probabilité de pluie",
    selectedDetailTitle: "Détails des conditions sélectionnées",
    tempMax: "Temp Max",
    tempMin: "Temp Min",
    windSpeedLabel: "Vit. du Vent",
    conditionPred: "Prévisions des conditions",
    rainChanceText: "Il y a une probabilité de précipitations de {prob}%.",
    dryCondText: "Conditions sèches sans risque de pluie.",
    interactiveMapTitle: "Carte météo interactive",
    radarMapFrameTitle: "Carte radar des vents et de la pluie",
    mapSearchPrompt: "Entrez une ville pour localiser les coordonnées radar.",
    mapDesc: "La carte ci-dessus affiche les radars de nuages, l'intensité des précipitations, le vent de surface et la pression atmosphérique en temps réel directement depuis les stations Windy. Vous pouvez interagir, zoomer ou pointer une autre zone pour les coordonnées.",
    commReportTitle: "Rapports météo de la communauté",
    sendReportTitle: "Envoyer un rapport météo depuis votre position",
    cityPlaceholder: "Nom de la ville / région",
    selectCondition: "Sélectionnez les conditions",
    notePlaceholder: "Notes supplémentaires (ex : Route inondée)",
    addPhotoLabel: "Ajouter une photo du ciel (Optionnel)",
    reportSent: "✓ Rapport envoyé !",
    sendGetXP: "Envoyer & Obtenir +50 XP",
    noReports: "Aucun rapport de la communauté pour le moment.",
    cond_clear: "Ensoleillé",
    cond_cloudy: "Nuageux",
    cond_drizzle: "Bruine",
    cond_heavy_rain: "Forte pluie",
    cond_thunderstorm: "Orage",
    cond_foggy: "Brouillard",
    calendarTitle: "Intégration d'agenda & Planificateur d'activités",
    planSchedule: "Planifiez votre emploi du temps",
    activityPlaceholder: "Nom de l'activité (ex : Football)",
    locationPlaceholder: "Ville de l'activité",
    addScheduleBtn: "Ajouter au planning (+20 XP)",
    agendaTitle: "📅 Votre agenda & conseils météo automatiques",
    noAgenda: "Aucun agenda programmé pour le moment.",
    deleteAgenda: "Supprimer l'agenda",
    timeLabel: "Heure",
    adviceLoadWeather: "Chargez les données météo pour obtenir des recommandations d'activité intelligentes.",
    adviceRegional: "Plan à {location}. (Prévisions météo régionales conseillées).",
    adviceRain: "🌧️ Conseil : Votre activité '{title}' risque d'être perturbée par une forte pluie. Déplacez-la à l'intérieur.",
    adviceHot: "🔥 Conseil : Température très chaude ({temp}°C). Prévoyez de l'eau supplémentaire pour éviter la déshydratation.",
    adviceGood: "☀️ Conseil : La météo à {city} est excellente ({desc}, {temp}°C). Moment idéal pour {title} !",
    todayLabel: "Aujourd'hui",
    appTitle: "Météo & Ciel",
    appSubtitle: "PWA Météo Indonésie",
    feelsLike: "Ressenti comme",
    realTimeWeatherVis: "Visualisation météo en temps réel",
    statHumidity: "Humidité",
    statWind: "Vent",
    statClouds: "Nuages",
    statPressure: "Pression",
    loadingWeatherStation: "Chargement des données météo...",
    searchWeatherPrompt: "Rechercher la météo dans votre région",
    searchWeatherDesc: "Utilisez le formulaire de recherche ci-dessus pour saisir le nom d'une ville, ou cliquez sur le bouton ci-dessous pour charger la météo par défaut de Jakarta.",
    loadDefaultWeatherBtn: "Charger la météo de Jakarta",
    cameraAccessFailed: "⚠ Échec de l'accès à la caméra",
    closeAr: "Fermer l'AR",
    feelsLikeLabel: "Ressenti",
    takeArPhoto: "Prendre une photo météo AR"
  }
}; const disasterDict: Record<string, Record<string, string>> = {
  id: {
    mapTitle: "🗺️ Peta Pantauan Satelit & Seismik",
    tabQuake: "🌋 Gempa Bumi",
    tabHotspots: "🔥 Titik Api",
    tabRain: "🌧️ Curah Hujan",
    tabVolcano: "🏔️ Gunung Api",
    tabEnso: "🌊 Iklim ENSO",
    quakeFilter: "Filter Gempa Bumi (USGS)",
    quakeMinMag: "Skala Min",
    quakeScope: "Cakupan Wilayah",
    btnFilter: "Saring Data",
    scopeIndonesia: "Indonesia",
    scopeAll: "Seluruh Dunia",
    totalQuakes: "Total Gempa",
    maxMag: "Mag Maks",
    tsunamiPotential: "Potensi Tsunami",
    quakeListTitle: "Daftar Gempa Terbaru",
    noQuakes: "Tidak ada gempa terdeteksi dengan kriteria ini.",
    depthLabel: "Kedalaman",
    tsunamiWarning: "POTENSI TSUNAMI",
    hotspotTitle: "Sebaran Kebakaran Hutan (Hotspot) & Kontrol",
    regionLabel: "Wilayah",
    satelliteLabel: "Satelit",
    timeframeLabel: "Waktu",
    last24h: "24 Jam Terakhir",
    last48h: "48 Jam Terakhir",
    nasaConnecting: "Menghubungi Satelit NASA FIRMS...",
    nasaSafe: "Kondisi wilayah terpantau aman dari anomali termal. Tidak ada titik api aktif yang terdeteksi satelit.",
    totalHotspots: "Total Hotspots",
    points: "Titik",
    avgFrp: "Rata-rata FRP",
    maxFrp: "Intensitas Maks (FRP)",
    dayNightCond: "Kondisi Siang/Malam",
    day: "Siang",
    night: "Malam",
    confidenceAnalysis: "Analisis Kepercayaan (Confidence)",
    confHigh: "Tinggi",
    confNominal: "Nominal",
    confLow: "Rendah",
    hottestPoint: "Titik Dengan Intensitas Radiasi Tertinggi",
    coordinates: "Koordinat",
    detection: "Deteksi",
    downloadHotspotReportBtn: "Unduh Laporan Kebencanaan Lengkap (.TXT)",
    hotspotListTitle: "Daftar Koordinat Kebakaran Hutan",
    clickToFocusMap: "Klik koordinat untuk menunjuk di peta",
    showingHotspots: "Melihat 50 dari {total} titik api. Gunakan unduhan laporan untuk melihat daftar lengkap.",
    rainTitle: "Presipitasi GPM & Risiko Banjir GFMS",
    downloadRainReportBtn: "Unduh Laporan GPM/GFMS (.TXT)",
    dailyRainStatus: "Status Hujan Harian",
    avgLabel: "Rerata",
    maxRainRate: "Laju Maks (GPM)",
    floodRisk: "Risiko Banjir (GFMS)",
    floodWarningTitle: "Peringatan Dini Banjir GFMS",
    aboutGpmTitle: "Tentang Satelit NASA GPM & GFMS:",
    floodWarningLuwu: "Siaga 1 Banjir Bandang",
    floodWarningDemak: "Tanggul Sungai Kritis / Meluap",
    floodWarningJakarta: "Waspada Banjir Kiriman / Genangan",
    floodWarningAssam: "Banjir Luapan Sungai Massal / Evakuasi",
    floodWarningBrazil: "Banjir Bandang & Tanah Longsor",
    magmaReportTitle: "Laporan Erupsi MAGMA Indonesia",
    magmaReportDesc: "Sistem pemantauan gunung api ESDM MAGMA Indonesia untuk memperingatkan maskapai penerbangan (VONA) dan masyarakat sekitar zona bahaya.",
    latestVonaTitle: "Laporan Letusan VONA Terbaru",
    magmaVolcanoQuiet: "Kondisi gunung api Indonesia terpantau tenang.",
    mountLabel: "Gunung",
    volcanoActivity: "Aktivitas",
    ashCloud: "Kolom Abu",
    issuedLabel: "Rilis",
    ensoStatusTitle: "Status Iklim ENSO Terkini",
    oniIndexLabel: "Indeks ONI",
    ninoAnomalyLabel: "Niño 3.4 Anomali",
    sstLabel: "Suhu Laut (SST)",
    seasonalTransitionTitle: "Prakiraan Transisi Musiman (NOAA CPC)",
    dominantLabel: "Dominan",
    probLabel: "Peluang",
    neutralLabel: "Netral",
    ensoImpactTitle: "Dampak Fenomena ENSO Terhadap Wilayah",
    elNinoImpactTitle: "Katastrofe El Niño (Kekeringan)",
    laNinaImpactTitle: "Katastrofe La Niña (Banjir & Cuaca Basah)",
    oniHistoryTitle: "Riwayat Indeks ONI Bulanan (1 Tahun Terakhir)",
    oniExplanationTitle: "Penjelasan Indeks ONI",
    oniExplanationDesc: "Oceanic Niño Index (ONI) adalah instrumen utama NOAA untuk mengidentifikasi keberadaan El Niño (anomali positif \u2265 +0.5°C) dan La Niña (anomali negatif \u2264 -0.5°C) berdasarkan rata-rata bergerak 3 bulanan dari suhu laut Pasifik tropis (Niño 3.4).",
    currentPeriodLabel: "Periode Terkini",
    dataSourceLabel: "Sumber data",
    ninoChartTitle: "Grafik Indeks Niño 3.4 (24 Bulan Terakhir)",
    anomalyLabel: "Anomali"
  },
  en: {
    mapTitle: "🗺️ Satellite & Seismic Monitoring Map",
    tabQuake: "🌋 Earthquakes",
    tabHotspots: "🔥 Wildfires",
    tabRain: "🌧️ Precipitation",
    tabVolcano: "🏔️ Volcanoes",
    tabEnso: "🌊 ENSO Climate",
    quakeFilter: "Earthquake Filter (USGS)",
    quakeMinMag: "Min Magnitude",
    quakeScope: "Geographic Scope",
    btnFilter: "Apply Filter",
    scopeIndonesia: "Indonesia",
    scopeAll: "Worldwide",
    totalQuakes: "Total Earthquakes",
    maxMag: "Max Mag",
    tsunamiPotential: "Tsunami Potential",
    quakeListTitle: "Recent Earthquakes List",
    noQuakes: "No earthquakes detected with these criteria.",
    depthLabel: "Depth",
    tsunamiWarning: "TSUNAMI POTENTIAL",
    hotspotTitle: "Wildfire (Hotspot) Distribution & Controls",
    regionLabel: "Region",
    satelliteLabel: "Satellite",
    timeframeLabel: "Timeframe",
    last24h: "Last 24 Hours",
    last48h: "Last 48 Hours",
    nasaConnecting: "Contacting NASA FIRMS Satellites...",
    nasaSafe: "The region is monitored safe from thermal anomalies. No active hotspots detected by satellites.",
    totalHotspots: "Total Hotspots",
    points: "Points",
    avgFrp: "Average FRP",
    maxFrp: "Max Intensity (FRP)",
    dayNightCond: "Day/Night Condition",
    day: "Day",
    night: "Night",
    confidenceAnalysis: "Confidence Analysis",
    confHigh: "High",
    confNominal: "Nominal",
    confLow: "Low",
    hottestPoint: "Hottest Thermal Hotspot Point",
    coordinates: "Coordinates",
    detection: "Detection",
    downloadHotspotReportBtn: "Download Complete Disaster Report (.TXT)",
    hotspotListTitle: "Wildfire Coordinates List",
    clickToFocusMap: "Click coordinates to focus on map",
    showingHotspots: "Showing 50 of {total} hotspots. Download the report to see the complete list.",
    rainTitle: "GPM Precipitation & GFMS Flood Risks",
    downloadRainReportBtn: "Download GPM/GFMS Report (.TXT)",
    dailyRainStatus: "Daily Precipitation Status",
    avgLabel: "Avg",
    maxRainRate: "Max Rate (GPM)",
    floodRisk: "Flood Risk (GFMS)",
    floodWarningTitle: "GFMS Early Flood Warnings",
    aboutGpmTitle: "About NASA GPM & GFMS Satellites:",
    floodWarningLuwu: "Flash Flood Level 1 Warning",
    floodWarningDemak: "Critical River Levee Breach / Overflow",
    floodWarningJakarta: "Upstream Flood Runoff / Inundation Alert",
    floodWarningAssam: "Massive River Overflow / Evacuation Active",
    floodWarningBrazil: "Flash Flooding & Landslides",
    magmaReportTitle: "Indonesia MAGMA Volcanic Eruption Reports",
    magmaReportDesc: "ESDM MAGMA Indonesia volcano monitoring system to provide early warnings for airlines (VONA) and communities around the danger zone.",
    latestVonaTitle: "Latest VONA Volcano Eruption Notifications",
    magmaVolcanoQuiet: "Indonesian volcanic activity is currently stable.",
    mountLabel: "Mount",
    volcanoActivity: "Activity",
    ashCloud: "Ash Cloud",
    issuedLabel: "Issued",
    ensoStatusTitle: "Current ENSO Climate Status",
    oniIndexLabel: "ONI Index",
    ninoAnomalyLabel: "Niño 3.4 Anomaly",
    sstLabel: "Sea Temp (SST)",
    seasonalTransitionTitle: "Seasonal Transition Forecast (NOAA CPC)",
    dominantLabel: "Dominant",
    probLabel: "Chance",
    neutralLabel: "Neutral",
    ensoImpactTitle: "Impact of ENSO Phenomenon on Regions",
    elNinoImpactTitle: "El Niño Catastrophe (Drought)",
    laNinaImpactTitle: "La Niña Catastrophe (Flooding & Wet Weather)",
    oniHistoryTitle: "Monthly ONI Index History (Last 1 Year)",
    oniExplanationTitle: "Explanation of ONI Index",
    oniExplanationDesc: "The Oceanic Niño Index (ONI) is NOAA's primary indicator for monitoring El Niño (positive anomalies \u2265 +0.5°C) and La Niña (negative anomalies \u2264 -0.5°C) based on a running 3-month mean of sea surface temperature anomalies in the tropical Pacific (Niño 3.4 region).",
    currentPeriodLabel: "Current Period",
    dataSourceLabel: "Data source",
    ninoChartTitle: "Niño 3.4 Index Graph (Last 24 Months)",
    anomalyLabel: "Anomaly"
  },
  ms: {
    mapTitle: "🗺️ Peta Pemantauan Satelit & Seismik",
    tabQuake: "🌋 Gempa Bumi",
    tabHotspots: "🔥 Titik Api",
    tabRain: "🌧️ Taburan Hujan",
    tabVolcano: "🏔️ Gunung Api",
    tabEnso: "🌊 Iklim ENSO",
    quakeFilter: "Penapis Gempa Bumi (USGS)",
    quakeMinMag: "Skala Min",
    quakeScope: "Cakupan Wilayah",
    btnFilter: "Tapis Data",
    scopeIndonesia: "Indonesia",
    scopeAll: "Seluruh Dunia",
    totalQuakes: "Jumlah Gempa",
    maxMag: "Mag Maks",
    tsunamiPotential: "Potensi Tsunami",
    quakeListTitle: "Senarai Gempa Bumi Terkini",
    noQuakes: "Tiada gempa bumi dikesan dengan kriteria ini.",
    depthLabel: "Kedalaman",
    tsunamiWarning: "POTENSI TSUNAMI",
    hotspotTitle: "Sebaran Kebakaran Hutan (Hotspot) & Kawalan",
    regionLabel: "Wilayah",
    satelliteLabel: "Satelit",
    timeframeLabel: "Waktu",
    last24h: "24 Jam Terakhir",
    last48h: "48 Jam Terakhir",
    nasaConnecting: "Menghubungi Satelit NASA FIRMS...",
    nasaSafe: "Kondisi wilayah terpantau aman dari anomali terma. Tiada titik api aktif dikesan satelit.",
    totalHotspots: "Jumlah Hotspot",
    points: "Titik",
    avgFrp: "Purata FRP",
    maxFrp: "Intensiti Maks (FRP)",
    dayNightCond: "Kondisi Siang/Malam",
    day: "Siang",
    night: "Malam",
    confidenceAnalysis: "Analisis Kepercayaan (Confidence)",
    confHigh: "Tinggi",
    confNominal: "Nominal",
    confLow: "Rendah",
    hottestPoint: "Titik Dengan Intensiti Radiasi Tertinggi",
    coordinates: "Koordinat",
    detection: "Kesan",
    downloadHotspotReportBtn: "Muat Turun Laporan Bencana Lengkap (.TXT)",
    hotspotListTitle: "Senarai Koordinat Kebakaran Hutan",
    clickToFocusMap: "Klik koordinat untuk menunjuk pada peta",
    showingHotspots: "Melihat 50 daripada {total} titik api. Gunakan muat turun laporan untuk senarai lengkap.",
    rainTitle: "Limpahan Hujan GPM & Risiko Banjir GFMS",
    downloadRainReportBtn: "Muat Turun Laporan GPM/GFMS (.TXT)",
    dailyRainStatus: "Status Hujan Harian",
    avgLabel: "Purata",
    maxRainRate: "Kadar Maks (GPM)",
    floodRisk: "Risiko Banjir (GFMS)",
    floodWarningTitle: "Amaran Awal Banjir GFMS",
    aboutGpmTitle: "Mengenai Satelit NASA GPM & GFMS:",
    floodWarningLuwu: "Amaran Banjir Kilat Tahap 1",
    floodWarningDemak: "Tebing Sungai Kritikal / Melimpah",
    floodWarningJakarta: "Waspada Limpahan Banjir Hulu / Genangan",
    floodWarningAssam: "Limpahan Sungai Besar-besaran / Pemindahan Aktif",
    floodWarningBrazil: "Banjir Kilat & Tanah Runtuh",
    magmaReportTitle: "Laporan Letusan MAGMA Indonesia",
    magmaReportDesc: "Sistem pemantauan gunung api ESDM MAGMA Indonesia untuk memperingatkan syarikat penerbangan (VONA) dan masyarakat sekitar zon bahaya.",
    latestVonaTitle: "Laporan Letusan VONA Terbaru",
    magmaVolcanoQuiet: "Keadaan gunung api Indonesia terpantau tenang.",
    mountLabel: "Gunung",
    volcanoActivity: "Aktiviti",
    ashCloud: "Awan Debu",
    issuedLabel: "Diterbitkan",
    ensoStatusTitle: "Status Iklim ENSO Terkini",
    oniIndexLabel: "Indeks ONI",
    ninoAnomalyLabel: "Niño 3.4 Anomali",
    sstLabel: "Suhu Laut (SST)",
    seasonalTransitionTitle: "Ramalan Transisi Bermusim (NOAA CPC)",
    dominantLabel: "Dominan",
    probLabel: "Peluang",
    neutralLabel: "Neutral",
    ensoImpactTitle: "Kesan Fenomena ENSO Terhadap Wilayah",
    elNinoImpactTitle: "Katastrofe El Niño (Kemarau)",
    laNinaImpactTitle: "Katastrofe La Niña (Banjir & Cuaca Basah)",
    oniHistoryTitle: "Sejarah Indeks ONI Bulanan (1 Tahun Terakhir)",
    oniExplanationTitle: "Penjelasan Indeks ONI",
    oniExplanationDesc: "Oceanic Niño Index (ONI) adalah instrumen utama NOAA untuk mengenal pasti kehadiran El Niño (anomali positif \u2265 +0.5°C) dan La Niña (anomali negatif \u2264 -0.5°C) berdasarkan purata bergerak 3 bulanan dari suhu laut Pasifik tropika (Niño 3.4).",
    currentPeriodLabel: "Tempoh Terkini",
    dataSourceLabel: "Sumber data",
    ninoChartTitle: "Grafik Indeks Niño 3.4 (24 Bulan Terakhir)",
    anomalyLabel: "Anomali"
  },
  zh: {
    mapTitle: "🗺️ 卫星与地震监测地图",
    tabQuake: "🌋 地震活动",
    tabHotspots: "🔥 火点监测",
    tabRain: "🌧️ 卫星降雨",
    tabVolcano: "🏔️ 活火山",
    tabEnso: "🌊 ENSO 气候",
    quakeFilter: "地震筛选器 (USGS)",
    quakeMinMag: "最小震级",
    quakeScope: "区域范围",
    btnFilter: "筛选数据",
    scopeIndonesia: "印度尼西亚",
    scopeAll: "全球范围",
    totalQuakes: "总地震数",
    maxMag: "最大震级",
    tsunamiPotential: "海啸预警",
    quakeListTitle: "最新地震列表",
    noQuakes: "未检测到符合该标准的地震。",
    depthLabel: "深度",
    tsunamiWarning: "可能发生海啸",
    hotspotTitle: "林火辐射 (热源) 分布与控制",
    regionLabel: "区域",
    satelliteLabel: "卫星",
    timeframeLabel: "时间",
    last24h: "过去24小时",
    last48h: "过去48小时",
    nasaConnecting: "正在连接 NASA FIRMS 卫星...",
    nasaSafe: "该区域监测安全，无热异常。卫星未检测到活跃火点。",
    totalHotspots: "总热源数",
    points: "个火点",
    avgFrp: "平均火源辐射功率 (FRP)",
    maxFrp: "最大火源功率 (FRP)",
    dayNightCond: "昼夜分布",
    day: "白天",
    night: "夜晚",
    confidenceAnalysis: "置信度分析",
    confHigh: "高置信度",
    confNominal: "中置信度",
    confLow: "低置信度",
    hottestPoint: "最高辐射强度点",
    coordinates: "坐标",
    detection: "检测",
    downloadHotspotReportBtn: "下载完整灾害报告 (.TXT)",
    hotspotListTitle: "林火坐标列表",
    clickToFocusMap: "点击坐标在地图上定位",
    showingHotspots: "显示 {total} 个火点中的前 50 个。下载完整报告以查看全部。",
    rainTitle: "GPM 降水与 GFMS 洪水风险",
    downloadRainReportBtn: "下载 GPM/GFMS 报告 (.TXT)",
    dailyRainStatus: "日降水状况",
    avgLabel: "平均",
    maxRainRate: "最大降水率 (GPM)",
    floodRisk: "洪水风险 (GFMS)",
    floodWarningTitle: "GFMS 洪水早期预警",
    aboutGpmTitle: "关于 NASA GPM 和 GFMS 卫星:",
    floodWarningLuwu: "山洪一级警报",
    floodWarningDemak: "河堤决口 / 溢出风险",
    floodWarningJakarta: "防范上游洪峰 / 积水内涝",
    floodWarningAssam: "大规模河流泛滥 / 紧急疏散",
    floodWarningBrazil: "山洪与山体滑坡",
    magmaReportTitle: "印尼 MAGMA 火山喷发报告",
    magmaReportDesc: "印尼 ESDM MAGMA 火山监测系统，旨在为航空公司 (VONA) 和危险区域周围的公众提供早期预警。",
    latestVonaTitle: "最新 VONA 火山喷发报告",
    magmaVolcanoQuiet: "印尼活火山目前处于平静状态。",
    mountLabel: "火山",
    volcanoActivity: "火山活动",
    ashCloud: "火山灰柱",
    issuedLabel: "发布时间",
    ensoStatusTitle: "当前 ENSO 气候状态",
    oniIndexLabel: "ONI 指数",
    ninoAnomalyLabel: "Niño 3.4 异常值",
    sstLabel: "海水温度 (SST)",
    seasonalTransitionTitle: "季节性过度预报 (NOAA CPC)",
    dominantLabel: "主导状态",
    probLabel: "概率",
    neutralLabel: "中性",
    ensoImpactTitle: "ENSO 现象对区域的影响",
    elNinoImpactTitle: "厄尔尼诺灾害（干旱）",
    laNinaImpactTitle: "拉尼娜灾害（洪涝与潮湿天气）",
    oniHistoryTitle: "月度 ONI 指数历史（最近一年）",
    oniExplanationTitle: "ONI 指数说明",
    oniExplanationDesc: "海洋厄尔尼诺指数（ONI）是 NOAA 监测厄尔尼诺（正异常 \u2265 +0.5°C）和拉尼娜（负异常 \u2264 -0.5°C）的主要指标，基于热带太平洋（Niño 3.4 区域）海表温度异常的 3 个月滑动平均值计算。",
    currentPeriodLabel: "当前监测期",
    dataSourceLabel: "数据来源",
    ninoChartTitle: "Niño 3.4 指数图表（最近24个月）",
    anomalyLabel: "异常"
  },
  ja: {
    mapTitle: "🗺️ 人工衛星・地震監視マップ",
    tabQuake: "🌋 地震情報",
    tabHotspots: "🔥 ホットスポット (火点)",
    tabRain: "🌧️ 降水量監視",
    tabVolcano: "🏔️ 火山活動",
    tabEnso: "🌊 ENSO気候ステータス",
    quakeFilter: "地震フィルター (USGS)",
    quakeMinMag: "最小マグニチュード",
    quakeScope: "対象地域",
    btnFilter: "フィルター適用",
    scopeIndonesia: "インドネシア",
    scopeAll: "全世界",
    totalQuakes: "地震総数",
    maxMag: "最大マグニチュード",
    tsunamiPotential: "津波の可能性",
    quakeListTitle: "最新の地震リスト",
    noQuakes: "この条件に該当する地震は検出されませんでした。",
    depthLabel: "深さ",
    tsunamiWarning: "津波の可能性あり",
    hotspotTitle: "森林火災 (熱源) 分布と操作",
    regionLabel: "地域",
    satelliteLabel: "人工衛星",
    timeframeLabel: "時間",
    last24h: "過去24時間",
    last48h: "過去48時間",
    nasaConnecting: "NASA FIRMS 衛星に接続中...",
    nasaSafe: "この地域は熱異常がなく安全です。衛星によるアクティブな火点は検出されていません。",
    totalHotspots: "ホットスポット総数",
    points: "地点",
    avgFrp: "平均火熱放射強度 (FRP)",
    maxFrp: "最大火熱放射強度 (FRP)",
    dayNightCond: "昼夜状況",
    day: "昼",
    night: "夜",
    confidenceAnalysis: "信頼度分析",
    confHigh: "高信頼度",
    confNominal: "中信頼度",
    confLow: "低信頼度",
    hottestPoint: "最高放射強度地点",
    coordinates: "座標",
    detection: "検出",
    downloadHotspotReportBtn: "災害報告書をダウンロード (.TXT)",
    hotspotListTitle: "森林火災座標リスト",
    clickToFocusMap: "座標をクリックして地図上に表示",
    showingHotspots: "{total} 地点中 50 地点表示中。完全なリストを見るにはレポートをダウンロードしてください。",
    rainTitle: "GPM 降水量＆ GFMS 洪水リスク",
    downloadRainReportBtn: "GPM/GFMS レポートをダウンロード (.TXT)",
    dailyRainStatus: "一日降水状況",
    avgLabel: "平均",
    maxRainRate: "最大降水レート (GPM)",
    floodRisk: "洪水リスク (GFMS)",
    floodWarningTitle: "GFMS 洪水早期警戒",
    aboutGpmTitle: "NASA GPM および GFMS 衛星について:",
    floodWarningLuwu: "鉄砲水レベル1警戒",
    floodWarningDemak: "堤防決壊・氾濫警戒",
    floodWarningJakarta: "上流からの洪水・浸水注意",
    floodWarningAssam: "大規模河川氾濫・避難指示",
    floodWarningBrazil: "鉄砲水＆土砂崩れ警戒",
    magmaReportTitle: "インドネシア MAGMA 火山噴火レポート",
    magmaReportDesc: "航空会社（VONA）や危険ゾーン周辺の住民に早期警戒を提供するためのインドネシアESDM MAGMA火山監視システム。",
    latestVonaTitle: "最新の VONA 火山噴火通知",
    magmaVolcanoQuiet: "インドネシアの火山活動は現在安定しています。",
    mountLabel: "火山名",
    volcanoActivity: "火山活動",
    ashCloud: "噴煙柱",
    issuedLabel: "リリース",
    ensoStatusTitle: "現在の ENSO 気候ステータス",
    oniIndexLabel: "ONI 指数",
    ninoAnomalyLabel: "Niño 3.4 偏差",
    sstLabel: "海面水温 (SST)",
    seasonalTransitionTitle: "季節予測遷移 (NOAA CPC)",
    dominantLabel: "優勢な状態",
    probLabel: "確率",
    neutralLabel: "中立",
    ensoImpactTitle: "ENSO現象がもたらす地域への影響",
    elNinoImpactTitle: "エルニーニョ被害（干ばつ）",
    laNinaImpactTitle: "ラニーニャ被害（洪水と湿潤気候）",
    oniHistoryTitle: "月別 ONI 指数の履歴（過去1年間）",
    oniExplanationTitle: "ONI 指数の解説",
    oniExplanationDesc: "海洋エルニーニョ指数（ONI）は、熱帯太平洋（Niño 3.4地域）における海面水温アノマリーの3ヶ月移動平均に基づき、NOAAがエルニーニョ（正アノマリー \u2265 +0.5°C）およびラニーニャ（負アノマリー \u2264 -0.5°C）を監視・定義するための主要な指標です。",
    currentPeriodLabel: "最新の集計期間",
    dataSourceLabel: "データ提供",
    ninoChartTitle: "Niño 3.4 指数グラフ（過去24ヶ月）",
    anomalyLabel: "アノマリー"
  },
  ru: {
    mapTitle: "🗺️ Карта спутникового и сейсмического мониторинга",
    tabQuake: "🌋 Землетрясения",
    tabHotspots: "🔥 Очаги пожаров",
    tabRain: "🌧️ Осадки GPM",
    tabVolcano: "🏔️ Вулканы",
    tabEnso: "🌊 Климат ENSO",
    quakeFilter: "Фильтр землетрясений (USGS)",
    quakeMinMag: "Мин. магнитуда",
    quakeScope: "Географический охват",
    btnFilter: "Применить фильтр",
    scopeIndonesia: "Индонезия",
    scopeAll: "Весь мир",
    totalQuakes: "Всего землетрясений",
    maxMag: "Макс. маг",
    tsunamiPotential: "Угроза цунами",
    quakeListTitle: "Список последних землетрясений",
    noQuakes: "Не обнаружено землетрясений с данными параметрами.",
    depthLabel: "Глубина",
    tsunamiWarning: "ОПАСНОСТЬ ЦУНАМИ",
    hotspotTitle: "Распределение очагов лесных пожаров и контроль",
    regionLabel: "Регион",
    satelliteLabel: "Спутник",
    timeframeLabel: "Период",
    last24h: "Последние 24 часа",
    last48h: "Последние 48 часов",
    nasaConnecting: "Подключение к спутникам NASA FIRMS...",
    nasaSafe: "В регионе не обнаружено тепловых аномалий. Активных очагов пожаров нет.",
    totalHotspots: "Всего очагов",
    points: "точек",
    avgFrp: "Средняя FRP",
    maxFrp: "Макс. интенсивность (FRP)",
    dayNightCond: "Дневные/Ночные очаги",
    day: "День",
    night: "Ночь",
    confidenceAnalysis: "Анализ достоверности",
    confHigh: "Высокая",
    confNominal: "Средняя",
    confLow: "Низкая",
    hottestPoint: "Точка с максимальной интенсивностью",
    coordinates: "Координаты",
    detection: "Обнаружение",
    downloadHotspotReportBtn: "Скачать полный отчет о пожарах (.TXT)",
    hotspotListTitle: "Список координат лесных пожаров",
    clickToFocusMap: "Нажмите на координаты, чтобы показать на карте",
    showingHotspots: "Отображено 50 из {total} очагов. Скачайте отчет, чтобы просмотреть весь список.",
    rainTitle: "Осадки GPM & Риски наводнений GFMS",
    downloadRainReportBtn: "Скачать отчет GPM/GFMS (.TXT)",
    dailyRainStatus: "Статус суточных осадков",
    avgLabel: "Средн.",
    maxRainRate: "Макс. скорость (GPM)",
    floodRisk: "Риск наводнений (GFMS)",
    floodWarningTitle: "Предупреждения о наводнениях GFMS",
    aboutGpmTitle: "О спутниках NASA GPM и системе GFMS:",
    floodWarningLuwu: "Предупреждение о внезапном наводнении 1-го уровня",
    floodWarningDemak: "Критический прорыв / выход реки из берегов",
    floodWarningJakarta: "Угроза стока паводковых вод / подтопления",
    floodWarningAssam: "Масштабный разлив реки / проводится эвакуация",
    floodWarningBrazil: "Внезапные наводнения и оползни",
    magmaReportTitle: "Отчеты об извержениях вулканов MAGMA",
    magmaReportDesc: "Информационная система мониторинга вулканов MAGMA Indonesia для оповещения авиации (VONA) и населения прилегающих зон.",
    latestVonaTitle: "Последние уведомления извержений VONA",
    magmaVolcanoQuiet: "Вулканическая активность в Индонезии стабильна.",
    mountLabel: "Вулкан",
    volcanoActivity: "Активность",
    ashCloud: "Пепловый шлейф",
    issuedLabel: "Выпущено",
    ensoStatusTitle: "Текущий климатический статус ENSO",
    oniIndexLabel: "Индекс ONI",
    ninoAnomalyLabel: "Отклонение Niño 3.4",
    sstLabel: "Темп. воды (SST)",
    seasonalTransitionTitle: "Сезонный прогноз переходов (NOAA CPC)",
    dominantLabel: "Доминирует",
    probLabel: "Вероятность",
    neutralLabel: "Нейтрально",
    ensoImpactTitle: "Влияние явлений ENSO на регионы",
    elNinoImpactTitle: "Бедствие Эль-Ниньо (Засуха)",
    laNinaImpactTitle: "Бедствие Ла-Нинья (Паводки и влажная погода)",
    oniHistoryTitle: "История месячного индекса ONI (За последний год)",
    oniExplanationTitle: "Пояснение к индексу ONI",
    oniExplanationDesc: "Океанический индекс Эль-Ниньо (ONI) является основным показателем NOAA для мониторинга Эль-Ниньо (положительные аномалии \u2265 +0.5°C) и Ла-Нинья (отрицательные аномалии \u2264 -0.5°C) на основе скользящей 3-месячной средней аномалии температуры поверхности моря в тропической зоне Тихого океана (регион Niño 3.4).",
    currentPeriodLabel: "Последний отчетный период",
    dataSourceLabel: "Источник данных",
    ninoChartTitle: "График индекса Niño 3.4 (Последние 24 месяца)",
    anomalyLabel: "Аномалия"
  },
  fr: {
    mapTitle: "🗺️ Carte de surveillance satellite et sismique",
    tabQuake: "🌋 Séismes",
    tabHotspots: "🔥 Foyers d'incendie",
    tabRain: "🌧️ Précipitations GPM",
    tabVolcano: "🏔️ Volcans",
    tabEnso: "🌊 Climat ENSO",
    quakeFilter: "Filtre des séismes (USGS)",
    quakeMinMag: "Magnitude Min",
    quakeScope: "Zone géographique",
    btnFilter: "Filtrer les données",
    scopeIndonesia: "Indonésie",
    scopeAll: "Monde entier",
    totalQuakes: "Total des Séismes",
    maxMag: "Mag Max",
    tsunamiPotential: "Risque de Tsunami",
    quakeListTitle: "Liste des séismes récents",
    noQuakes: "Aucun séisme détecté avec ces critères.",
    depthLabel: "Profondeur",
    tsunamiWarning: "RISQUE DE TSUNAMI",
    hotspotTitle: "Distribution & contrôle des feux de forêt (Hotspots)",
    regionLabel: "Région",
    satelliteLabel: "Satellite",
    timeframeLabel: "Période",
    last24h: "Dernières 24 heures",
    last48h: "Dernières 48 heures",
    nasaConnecting: "Connexion aux satellites NASA FIRMS...",
    nasaSafe: "La région est surveillée, aucune anomalie thermique. Aucun foyer actif détecté par satellite.",
    totalHotspots: "Total des Hotspots",
    points: "points",
    avgFrp: "FRP moyenne",
    maxFrp: "Intensité Max (FRP)",
    dayNightCond: "Condition Jour/Nuit",
    day: "Jour",
    night: "Nuit",
    confidenceAnalysis: "Analyse de confiance",
    confHigh: "Haute",
    confNominal: "Nominale",
    confLow: "Basse",
    hottestPoint: "Point thermique le plus chaud",
    coordinates: "Coordonnées",
    detection: "Détection",
    downloadHotspotReportBtn: "Télécharger le rapport complet (.TXT)",
    hotspotListTitle: "Liste des coordonnées des incendies",
    clickToFocusMap: "Cliquez sur les coordonnées pour centrer sur la carte",
    showingHotspots: "Affichage de 50 sur {total} hotspots. Téléchargez le rapport pour voir la liste complète.",
    rainTitle: "Précipitations GPM & Risques d'inondation GFMS",
    downloadRainReportBtn: "Télécharger le rapport GPM/GFMS (.TXT)",
    dailyRainStatus: "Statut journalier des pluies",
    avgLabel: "Moyenne",
    maxRainRate: "Débit Max (GPM)",
    floodRisk: "Risque d'inondation (GFMS)",
    floodWarningTitle: "Alertes précoces d'inondation GFMS",
    aboutGpmTitle: "À propos des satellites NASA GPM & GFMS :",
    floodWarningLuwu: "Alerte de crue soudaine de niveau 1",
    floodWarningDemak: "Rupture de digue critique / Débordement",
    floodWarningJakarta: "Alerte ruissellement de crue amont / Inondation",
    floodWarningAssam: "Débordement de fleuve massif / Évacuation active",
    floodWarningBrazil: "Crues soudaines & glissements de terrain",
    magmaReportTitle: "Rapports d'éruptions volcaniques MAGMA",
    magmaReportDesc: "Système de surveillance volcanologique ESDM MAGMA Indonesia pour alerter l'aviation (VONA) et les populations proches.",
    latestVonaTitle: "Dernières notifications d'éruptions VONA",
    magmaVolcanoQuiet: "L'activité volcanologique en Indonésie est stable.",
    mountLabel: "Volcan",
    volcanoActivity: "Activité",
    ashCloud: "Panache de cendres",
    issuedLabel: "Publié",
    ensoStatusTitle: "Statut climatique ENSO actuel",
    oniIndexLabel: "Indice ONI",
    ninoAnomalyLabel: "Anomalie Niño 3.4",
    sstLabel: "SST (Suhu Laut)",
    seasonalTransitionTitle: "Prévisions saisonnières (NOAA CPC)",
    dominantLabel: "Dominant",
    probLabel: "Probabilité",
    neutralLabel: "Neutre",
    ensoImpactTitle: "Dangers et impacts de l'ENSO sur les régions",
    elNinoImpactTitle: "Catastrophe El Niño (Sécheresse)",
    laNinaImpactTitle: "Catastrophe La Niña (Inondations & temps humide)",
    oniHistoryTitle: "Historique mensuel de l'indice ONI (1 an)",
    oniExplanationTitle: "Explication de l'indice ONI",
    oniExplanationDesc: "L'Oceanic Niño Index (ONI) est l'indicateur principal de la NOAA pour identifier la présence d'El Niño (anomalies positives \u2265 +0.5°C) et de La Niña (anomalies négatives \u2264 -0.5°C), calculé sur une moyenne mobile de 3 mois des anomalies de température à la surface de l'océan Pacifique tropical (région Niño 3.4).",
    currentPeriodLabel: "Période actuelle",
    dataSourceLabel: "Source des données",
    ninoChartTitle: "Graphique de l'indice Niño 3.4 (24 derniers mois)",
    anomalyLabel: "Anomalie"
  }
};

function getLocaleForLanguage(lang: string): string {
  const map: Record<string, string> = {
    id: 'id-ID',
    en: 'en-US',
    ms: 'ms-MY',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ru: 'ru-RU',
    fr: 'fr-FR',
  };
  return map[lang] || 'id-ID';
}

function getConditionLabel(cond: string, lang: string): string {
  const normalized = cond.toLowerCase();
  const map: Record<string, string> = {
    'clear': 'cond_clear',
    'cerah': 'cond_clear',
    'cloudy': 'cond_cloudy',
    'berawan': 'cond_cloudy',
    'drizzle': 'cond_drizzle',
    'gerimis': 'cond_drizzle',
    'heavy_rain': 'cond_heavy_rain',
    'hujan deras': 'cond_heavy_rain',
    'hujan lebat': 'cond_heavy_rain',
    'thunderstorm': 'cond_thunderstorm',
    'badai petir': 'cond_thunderstorm',
    'ribut petir': 'cond_thunderstorm',
    'foggy': 'cond_foggy',
    'berkabut': 'cond_foggy',
    'berkabus': 'cond_foggy'
  };
  const key = map[normalized];
  if (key) {
    const dict = localDict[lang] || localDict['id'];
    return dict[key] || cond;
  }
  return cond;
}

function wmocodeToDesc(code: number, lang: string): string {
  const dict: Record<string, string[]> = {
    id: ['Cerah', 'Berawan sebagian', 'Berawan', 'Berkabut', 'Gerimis', 'Hujan', 'Bersalju', 'Hujan deras', 'Petir & Badai', 'Tidak diketahui'],
    en: ['Clear', 'Partly cloudy', 'Cloudy', 'Foggy', 'Drizzle', 'Rain', 'Snowy', 'Heavy rain', 'Thunderstorm', 'Unknown'],
    ms: ['Cerah', 'Separuh berawan', 'Berawan', 'Berkabus', 'Gerimis', 'Hujan', 'Salju', 'Hujan lebat', 'Ribut petir', 'Tidak diketahui'],
    zh: ['晴朗', '多云', '阴天', '有雾', '毛毛雨', '下雨', '下雪', '大雨', '雷暴', '未知'],
    ja: ['快晴', '一部曇り', '曇り', '霧', '小雨', '雨', '雪', '豪雨', '雷雨', '不明'],
    ru: ['Ясно', 'Переменная облачность', 'Облачно', 'Туман', 'Морось', 'Дождь', 'Снег', 'Ливень', 'Гроза', 'Неизвестно'],
    fr: ['Dégagé', 'Partiellement nuageux', 'Nuageux', 'Brouillard', 'Bruine', 'Pluie', 'Neige', 'Pluie forte', 'Orage', 'Inconnu'],
  };
  const l = dict[lang] || dict['id'];
  if (code === 0) return l[0];
  if (code <= 2) return l[1];
  if (code <= 3) return l[2];
  if (code <= 48) return l[3];
  if (code <= 57) return l[4];
  if (code <= 67) return l[5];
  if (code <= 77) return l[6];
  if (code <= 82) return l[7];
  if (code <= 99) return l[8];
  return l[9];
}

function getLocalizedWeatherDescription(desc: string, lang: string): string {
  const d = desc.toLowerCase();
  const dict = localDict[lang] || localDict['id'];

  if (d.includes('clear') || d.includes('cerah') || d.includes('sky')) return dict.cond_clear || desc;
  if (d.includes('scattered') || d.includes('broken') || d.includes('overcast') || d.includes('cloud') || d.includes('awan') || d.includes('mendung')) return dict.cond_cloudy || desc;
  if (d.includes('drizzle') || d.includes('gerimis') || d.includes('light rain') || d.includes('hujan ringan')) return dict.cond_drizzle || desc;
  if (d.includes('rain') || d.includes('hujan')) return dict.cond_heavy_rain || desc;
  if (d.includes('thunderstorm') || d.includes('petir') || d.includes('badai')) return dict.cond_thunderstorm || desc;
  if (d.includes('mist') || d.includes('fog') || d.includes('kabut')) return dict.cond_foggy || desc;

  return desc;
}

function getPeriodLabel(period: string, lang: string): string {
  if (!period) return '';
  const parts = period.split(' ');
  const term = parts[0];
  const year = parts[1] || '';

  const translations: Record<string, Record<string, string>> = {
    en: {
      'Jan-Mar': 'Jan-Mar', 'Feb-Apr': 'Feb-Apr', 'Mar-Mei': 'Mar-May', 'Apr-Jun': 'Apr-Jun',
      'Mei-Jul': 'May-Jul', 'Jun-Ags': 'Jun-Aug', 'Jul-Sep': 'Jul-Sep', 'Ags-Okt': 'Aug-Oct',
      'Sep-Nov': 'Sep-Nov', 'Okt-Des': 'Oct-Dec', 'Nov-Jan': 'Nov-Jan', 'Des-Feb': 'Dec-Feb'
    },
    ms: {
      'Jan-Mar': 'Jan-Mac', 'Feb-Apr': 'Feb-Apr', 'Mar-Mei': 'Mac-Mei', 'Apr-Jun': 'Apr-Jun',
      'Mei-Jul': 'Mei-Jul', 'Jun-Ags': 'Jun-Ogos', 'Jul-Sep': 'Jul-Sep', 'Ags-Okt': 'Ogos-Okt',
      'Sep-Nov': 'Sep-Nov', 'Okt-Des': 'Okt-Dis', 'Nov-Jan': 'Nov-Jan', 'Des-Feb': 'Dis-Feb'
    },
    zh: {
      'Jan-Mar': '1-3月', 'Feb-Apr': '2-4月', 'Mar-Mei': '3-5月', 'Apr-Jun': '4-6月',
      'Mei-Jul': '5-7月', 'Jun-Ags': '6-8月', 'Jul-Sep': '7-9月', 'Ags-Okt': '8-10月',
      'Sep-Nov': '9-11月', 'Okt-Des': '10-12月', 'Nov-Jan': '11-1月', 'Des-Feb': '12-2月'
    },
    ja: {
      'Jan-Mar': '1-3月', 'Feb-Apr': '2-4月', 'Mar-Mei': '3-5月', 'Apr-Jun': '4-6月',
      'Mei-Jul': '5-7月', 'Jun-Ags': '6-8月', 'Jul-Sep': '7-9月', 'Ags-Okt': '8-10月',
      'Sep-Nov': '9-11月', 'Okt-Des': '10-12月', 'Nov-Jan': '11-1月', 'Des-Feb': '12-2月'
    },
    ru: {
      'Jan-Mar': 'Янв-Мар', 'Feb-Apr': 'Фев-Апр', 'Mar-Mei': 'Мар-Май', 'Apr-Jun': 'Апр-Июн',
      'Mei-Jul': 'Май-Июл', 'Jun-Ags': 'Июн-Авг', 'Jul-Sep': 'Июл-Сен', 'Ags-Okt': 'Авг-Окт',
      'Sep-Nov': 'Сен-Ноя', 'Okt-Des': 'Окт-Дек', 'Nov-Jan': 'Ноя-Янв', 'Des-Feb': 'Дек-Фев'
    },
    fr: {
      'Jan-Mar': 'Jan-Mar', 'Feb-Apr': 'Fév-Avr', 'Mar-Mei': 'Mar-Mai', 'Apr-Jun': 'Avr-Juin',
      'Mei-Jul': 'Mai-Juil', 'Jun-Ags': 'Juin-Août', 'Jul-Sep': 'Juil-Sep', 'Ags-Okt': 'Août-Oct',
      'Sep-Nov': 'Sep-Nov', 'Okt-Des': 'Oct-Déc', 'Nov-Jan': 'Nov-Jan', 'Des-Feb': 'Déc-Fév'
    }
  };

  const transMap = translations[lang];
  if (transMap && transMap[term]) {
    return `${transMap[term]} ${year}`;
  }
  return period;
}

function getHistoryMonthName(monthNum: number, lang: string): string {
  const translations: Record<string, string[]> = {
    id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ms: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Juli', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
    zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  };
  const list = translations[lang] || translations['id'];
  return list[monthNum - 1];
}

function getLocalizedEnsoStatus(status: string, lang: string): string {
  const dict: Record<string, Record<string, string>> = {
    id: { 'El Niño': 'El Niño', 'La Niña': 'La Niña', 'Netral': 'Netral', 'Neutral': 'Netral' },
    en: { 'El Niño': 'El Niño', 'La Niña': 'La Niña', 'Netral': 'Neutral', 'Neutral': 'Neutral' },
    ms: { 'El Niño': 'El Niño', 'La Niña': 'La Niña', 'Netral': 'Neutral', 'Neutral': 'Neutral' },
    zh: { 'El Niño': '厄尔尼诺', 'La Niña': '拉尼娜', 'Netral': '中性', 'Neutral': '中性' },
    ja: { 'El Niño': 'エルニーニョ', 'La Niña': 'ラニーニャ', 'Netral': '中立', 'Neutral': '中立' },
    ru: { 'El Niño': 'Эль-Ниньо', 'La Niña': 'Ла-Нинья', 'Netral': 'Нейтрально', 'Neutral': 'Нейтрально' },
    fr: { 'El Niño': 'El Niño', 'La Niña': 'La Niña', 'Netral': 'Neutre', 'Neutral': 'Neutre' }
  };
  const norm = status === 'Netral' || status === 'Neutral' ? 'Netral' : status;
  return (dict[lang] || dict['id'])[norm] || status;
}

function getLocalizedEnsoDesc(status: string, oni: number, lang: string): string {
  const templates: Record<string, Record<string, string>> = {
    id: {
      'El Niño': `Status ENSO saat ini dalam kondisi El Niño dengan indeks ONI sebesar +${oni.toFixed(2)}°C. Potensi curah hujan di Indonesia lebih rendah dan cuaca lebih kering/panas.`,
      'La Niña': `Status ENSO saat ini dalam kondisi La Niña dengan indeks ONI sebesar ${oni.toFixed(2)}°C. Potensi curah hujan di Indonesia cenderung meningkat, meningkatkan curah hujan di atas normal.`,
      'Netral': `Status ENSO saat ini dalam kondisi Netral dengan indeks ONI sebesar ${oni >= 0 ? '+' : ''}${oni.toFixed(2)}°C. Kondisi cuaca cenderung normal.`
    },
    en: {
      'El Niño': `The current ENSO status is El Niño with an ONI index of +${oni.toFixed(2)}°C. Rainfall potential in Indonesia is lower and weather is drier/hotter.`,
      'La Niña': `The current ENSO status is La Niña with an ONI index of ${oni.toFixed(2)}°C. Rainfall potential in Indonesia tends to increase, causing above-normal precipitation.`,
      'Netral': `The current ENSO status is Neutral with an ONI index of ${oni >= 0 ? '+' : ''}${oni.toFixed(2)}°C. Weather conditions tend to be normal.`
    },
    ms: {
      'El Niño': `Status ENSO semasa berada dalam keadaan El Niño dengan indeks ONI sebanyak +${oni.toFixed(2)}°C. Potensi taburan hujan di Indonesia adalah lebih rendah dan cuaca lebih kering/panas.`,
      'La Niña': `Status ENSO semasa berada dalam keadaan La Niña dengan indeks ONI sebanyak ${oni.toFixed(2)}°C. Potensi taburan hujan di Indonesia cenderung meningkat, menyebabkan hujan melebihi paras normal.`,
      'Netral': `Status ENSO semasa berada dalam keadaan Neutral dengan indeks ONI sebanyak ${oni >= 0 ? '+' : ''}${oni.toFixed(2)}°C. Keadaan cuaca cenderung normal.`
    },
    zh: {
      'El Niño': `当前 ENSO 状态为厄尔尼诺，ONI 指数为 +${oni.toFixed(2)}°C。印度尼西亚的降水潜力较低，气候更加干燥/炎热。`,
      'La Niña': `当前 ENSO 状态为拉尼娜，ONI 指数为 ${oni.toFixed(2)}°C。印度尼西亚的降水潜力倾向于增加，导致降雨量高于常年水平。`,
      'Netral': `当前 ENSO 状态为中性，ONI 指数为 ${oni >= 0 ? '+' : ''}${oni.toFixed(2)}°C。天气状况趋于正常。`
    },
    ja: {
      'El Niño': `現在の ENSO ステータスはエルニーニョで、ONI 指数は +${oni.toFixed(2)}°C です。インドネシアでの降水確率は低くなり、気候はより乾燥し、暑くなります。`,
      'La Niña': `現在の ENSO ステータスはラニーニャで、ONI 指数は ${oni.toFixed(2)}°C です。インドネシアでの降水確率は増加する傾向にあり、通常以上の降水量をもたらします。`,
      'Netral': `現在の ENSO ステータсは中立で、ONI 指数は ${oni >= 0 ? '+' : ''}${oni.toFixed(2)}°C です。気象条件は正常な傾向にあります。`
    },
    ru: {
      'El Niño': `Текущий статус ENSO — Эль-Ниньо с индексом ONI +${oni.toFixed(2)}°C. Потенциал осадков в Индонезии ниже, а погода более сухая/жаркая.`,
      'La Niña': `Текущий статус ENSO — Ла-Нинья с индексом ONI ${oni.toFixed(2)}°C. Потенциал осадков в Индонезии имеет тенденцию к увеличению, вызывая количество осадков выше нормы.`,
      'Netral': `Текущий статус ENSO — Нейтральный с индексом ONI ${oni >= 0 ? '+' : ''}${oni.toFixed(2)}°C. Погодные условия близки к норме.`
    },
    fr: {
      'El Niño': `Le statut ENSO actuel est El Niño avec un indice ONI de +${oni.toFixed(2)}°C. Le potentiel de précipitations en Indonésie est plus faible et le temps est plus sec/chaud.`,
      'La Niña': `Le statut ENSO actuel est La Niña avec un indice ONI de ${oni.toFixed(2)}°C. Le potentiel de précipitations en Indonésie a tendance à augmenter, entraînant des précipitations supérieures à la normale.`,
      'Netral': `Le statut ENSO actuel est Neutre avec un indice ONI de ${oni >= 0 ? '+' : ''}${oni.toFixed(2)}°C. Les conditions météorologiques ont tendance à être normales.`
    }
  };
  const key = status === 'El Niño' ? 'El Niño' : (status === 'La Niña' ? 'La Niña' : 'Netral');
  return (templates[lang] || templates['id'])[key];
}

// ─── Main Component ───────────────────────────────────────────────────────────

function getLocalizedActivityTitle(title: string, lang: string): string {
  const t = title.toLowerCase();
  if (t === 'jogging pagi') {
    if (lang === 'id' || lang === 'ms') return 'Jogging pagi';
    if (lang === 'zh') return '晨跑';
    if (lang === 'ja') return '朝のジョギング';
    if (lang === 'ru') return 'Утренняя пробежка';
    if (lang === 'fr') return 'Jogging matinal';
    return 'Morning jogging';
  }
  if (t === 'olahraga sore') {
    if (lang === 'id' || lang === 'ms') return 'Olahraga sore';
    if (lang === 'zh') return '下午运动';
    if (lang === 'ja') return '夕方の運動';
    if (lang === 'ru') return 'Вечерняя тренировка';
    if (lang === 'fr') return "Exercice de l'après-midi";
    return 'Afternoon exercise';
  }
  return title;
}

function getLocalizedSpaceWeather(data: any, lang: string) {
  if (!data) return { desc: '', rec: '', risk: '', stormClass: '' };

  const riskMap: Record<string, Record<string, string>> = {
    Aman: {
      id: 'Aman', ms: 'Aman', en: 'Safe', zh: '安全', ja: '安全', ru: 'Безопасно', fr: 'Sûr'
    },
    Waspada: {
      id: 'Waspada', ms: 'Waspada', en: 'Watch', zh: '警戒', ja: '警戒', ru: 'Внимание', fr: 'Vigilance'
    },
    Siaga: {
      id: 'Siaga', ms: 'Siaga', en: 'Warning', zh: '警报', ja: '警報', ru: 'Предупреждение', fr: 'Alerte'
    }
  };

  const risk = riskMap[data.satelliteRisk]?.[lang] || riskMap[data.satelliteRisk]?.['en'] || data.satelliteRisk;

  const desc = data.description || '';
  const rec = data.recommendation || '';

  let key: 'safe' | 'watch' | 'warning' | 'fallback' = 'safe';
  if (desc.includes('Gagal') || desc.includes('NOAA')) {
    key = 'fallback';
  } else if (data.satelliteRisk === 'Siaga') {
    key = 'warning';
  } else if (data.satelliteRisk === 'Waspada') {
    key = 'watch';
  }

  const solarWindStr = data.solarWindSpeed ? Math.round(data.solarWindSpeed) : 360;

  const translations: Record<string, Record<string, { desc: string; rec: string }>> = {
    safe: {
      id: {
        desc: 'Kondisi cuaca antariksa tenang. Tidak ada gangguan magnetik atau radiasi matahari yang berarti.',
        rec: 'Sangat baik untuk pengamatan langit malam terbuka di Indonesia. Sinyal GPS dan jaringan satelit beroperasi optimal.'
      },
      en: {
        desc: 'Quiet space weather conditions. No significant magnetic disturbance or solar radiation.',
        rec: 'Excellent for open night sky observation in Indonesia. GPS signals and satellite networks are operating optimally.'
      },
      ms: {
        desc: 'Kondisi cuaca angkasa tenang. Tiada gangguan magnetik atau radiasi suria yang ketara.',
        rec: 'Sangat baik untuk cerapan langit malam terbuka di Indonesia. Isyarat GPS dan rangkaian satelit beroperasi secara optimum.'
      },
      zh: {
        desc: '空间天气状况平静。无显著的磁扰或太阳辐射。',
        rec: '非常适合在印度尼西亚进行户外夜空观测。GPS 信号和卫星网络正处于最佳运行状态。'
      },
      ja: {
        desc: '宇宙天気は穏やかです。有意な磁気乱れや太陽放射はありません。',
        rec: 'インドネシアでの夜空の観測に非常に適しています。GPS信号と衛星ネットワークは最適に動作しています。'
      },
      ru: {
        desc: 'Спокойная космическая погода. Никаких существенных магнитных возмущений или солнечной радиации.',
        rec: 'Отлично подходит для наблюдений за ночным небом в Индонезии. Сигналы GPS и спутниковые сети работают оптимально.'
      },
      fr: {
        desc: 'Conditions de météo spatiale calmes. Pas de perturbation magnétique ou de rayonnement solaire significatif.',
        rec: "Excellent pour l'observation du ciel nocturne en Indonésie. Les signaux GPS et les réseaux satellites fonctionnent de manière optimale."
      }
    },
    watch: {
      id: {
        desc: `Kondisi magnetosfer tidak stabil. Angin matahari cukup kencang (${solarWindStr} km/s) berpotensi memicu riak geomagnetik ringan.`,
        rec: 'GPS mungkin mengalami deviasi mikro. Pengamatan langit malam tetap prospektif, aurora mulai merambat ke batas lintang menengah bumi.'
      },
      en: {
        desc: `Magnetosphere conditions are unstable. Active solar wind (${solarWindStr} km/s) may trigger minor geomagnetic activity.`,
        rec: 'GPS might experience micro deviations. Night sky observation remains favorable; aurora begins to propagate to mid-latitudes.'
      },
      ms: {
        desc: `Kondisi magnetosfera tidak stabil. Angin suria agak kuat (${solarWindStr} km/s) berpotensi mencetuskan aktiviti geomagnetik minor.`,
        rec: 'GPS mungkin mengalami sisihan mikro. Cerapan langit malam kekal prospektif, aurora mula merambat ke sempadan latitud pertengahan bumi.'
      },
      zh: {
        desc: `磁层状态不稳定。较强的太阳风（${solarWindStr} 公里/秒）可能引发轻微地磁活动。`,
        rec: 'GPS 可能会出现微小偏差。夜空观测依然可行，极光开始向中纬度地区延伸。'
      },
      ja: {
        desc: `磁気圏の状態が不安定です。活発な太陽風（${solarWindStr} km/s）により、軽微な地磁気活動が引き起こされる可能性があります。`,
        rec: 'GPSに微小なズレが生じる可能性があります。夜空の観測は引き続き良好です。オーロラが中緯度地域に広がり始めています。'
      },
      ru: {
        desc: `Состояние магнитосферы нестабильно. Активный солнечный ветер (${solarWindStr} км/с) может вызвать незначительную геомагнитную активность.`,
        rec: 'В работе GPS возможны микроотклонения. Наблюдения за ночным небом остаются благоприятными; полярное сияние начинает распространяться на средние широты.'
      },
      fr: {
        desc: `Conditions de la magnétosphère instables. Un vent solaire actif (${solarWindStr} km/s) peut déclencher une activité géomagnétique mineure.`,
        rec: "Le GPS peut subir de micro-déviations. L'observation du ciel nocturne reste favorable ; l'aurore commence à se propager vers les moyennes latitudes."
      }
    },
    warning: {
      id: {
        desc: `Terdeteksi Badai Geomagnetik Aktif (${data.geomagneticStormClass})! Kecepatan angin matahari mencapai ${solarWindStr} km/s.`,
        rec: 'Bahaya gangguan navigasi GPS presisi dan komunikasi satelit orbit rendah (LEO). Aurora sangat aktif di wilayah kutub dan sub-polar.'
      },
      en: {
        desc: `Active Geomagnetic Storm detected (${data.geomagneticStormClass})! Solar wind speed reaches ${solarWindStr} km/s.`,
        rec: 'Risk of interference for precision GPS navigation and low Earth orbit (LEO) satellite communications. Highly active aurora in polar and sub-polar regions.'
      },
      ms: {
        desc: `Ribut Geomagnetik Aktif dikesan (${data.geomagneticStormClass})! Kelajuan angin suria mencapai ${solarWindStr} km/s.`,
        rec: 'Risiko gangguan navigasi GPS jitu dan komunikasi satelit orbit bumi rendah (LEO). Aurora sangat aktif di kawasan kutub dan sub-kutub.'
      },
      zh: {
        desc: `检测到活动地磁暴（${data.geomagneticStormClass}）！太阳风速达到 ${solarWindStr} 公里/秒。`,
        rec: '精密 GPS 导航和低地球轨道 (LEO) 卫星通信存在干扰风险。极地和亚极地地区极光高度活跃。'
      },
      ja: {
        desc: `活発な地磁気嵐（${data.geomagneticStormClass}）が検出されました！太陽風速度は ${solarWindStr} km/s に達しています。`,
        rec: '精密GPSナビゲーションおよび低軌道（LEO）衛星通信に干渉のリスクがあります。極地および亜極地で非常に活発なオーロラが発生しています。'
      },
      ru: {
        desc: `Обнаружена активная геомагнитная буря (${data.geomagneticStormClass})! Скорость солнечного ветра достигает ${solarWindStr} км/с.`,
        rec: 'Опасность помех для точной GPS-навигации и связи со спутниками на низкой околоземной орбите (LEO). Очень активные полярные сияния в полярных и приполярных регионах.'
      },
      fr: {
        desc: `Tempête géomagnétique active détectée (${data.geomagneticStormClass}) ! La vitesse du vent solaire atteint ${solarWindStr} km/s.`,
        rec: 'Risque de perturbations pour la navigation GPS de précision et les communications par satellite en orbite basse (LEO). Aurores très actives dans les régions polaires et sous-polaires.'
      }
    },
    fallback: {
      id: {
        desc: 'Gagal menyambung ke NOAA. Menggunakan data prakiraan fallback cuaca antariksa.',
        rec: 'Satelit beroperasi normal. Pengamatan bintang dan meteorit terbuka di Indonesia berjalan lancar.'
      },
      en: {
        desc: 'Failed to connect to NOAA. Using fallback space weather forecast data.',
        rec: 'Satellites are operating normally. Stargazing and meteorite observation in Indonesia are proceeding smoothly.'
      },
      ms: {
        desc: 'Gagal menyambung ke NOAA. Menggunakan data ramalan sandaran cuaca angkasa.',
        rec: 'Satelit beroperasi secara normal. Cerapan bintang dan meteorit di Indonesia berjalan lancar.'
      },
      zh: {
        desc: '连接 NOAA 失败。使用备用空间天气预报数据。',
        rec: '卫星运行正常。印度尼西亚的观星和陨石观测进展顺利。'
      },
      ja: {
        desc: 'NOAAへの接続に失敗しました。代替の宇宙天気予报データを使用しています。',
        rec: '人工衛星は正常に動作しています。インドネシアでの天体観測や隕石観測は順調に行えます。'
      },
      ru: {
        desc: 'Не удалось подключиться к NOAA. Используются резервные данные прогноза космической погоды.',
        rec: 'Спутники работают в штатном режиме. Наблюдение за звездами и метеоритами в Индонезии проходит успешно.'
      },
      fr: {
        desc: 'Échec de la connexion à la NOAA. Utilisation des données de prévision de secours.',
        rec: "Les satellites fonctionnent normalement. L'observation des étoiles et des météorites en Indonésie se déroule sans problème."
      }
    }
  };

  const localized = translations[key]?.[lang] || translations[key]?.['en'] || { desc, rec };

  const raw = data.geomagneticStormClass || '';
  // Translate the severity label inside the stormClass string e.g. "G1 (Minor)"
  const severityMap: Record<string, Record<string, string>> = {
    id: { '(Normal)': '(Normal)', '(Minor)': '(Ringan)', '(Moderate)': '(Sedang)', '(Strong)': '(Kuat)', '(Severe)': '(Parah)', '(Extreme)': '(Ekstrem)' },
    ms: { '(Normal)': '(Normal)', '(Minor)': '(Ringan)', '(Moderate)': '(Sederhana)', '(Strong)': '(Kuat)', '(Severe)': '(Teruk)', '(Extreme)': '(Ekstrem)' },
    en: { '(Normal)': '(Normal)', '(Minor)': '(Minor)', '(Moderate)': '(Moderate)', '(Strong)': '(Strong)', '(Severe)': '(Severe)', '(Extreme)': '(Extreme)' },
    zh: { '(Normal)': '(正常)', '(Minor)': '(轻微)', '(Moderate)': '(中等)', '(Strong)': '(强烈)', '(Severe)': '(严重)', '(Extreme)': '(极端)' },
    ja: { '(Normal)': '(平常)', '(Minor)': '(軽微)', '(Moderate)': '(中程度)', '(Strong)': '(強い)', '(Severe)': '(激しい)', '(Extreme)': '(極端)' },
    ru: { '(Normal)': '(Норма)', '(Minor)': '(Слабая)', '(Moderate)': '(Умеренная)', '(Strong)': '(Сильная)', '(Severe)': '(Сильнейшая)', '(Extreme)': '(Экстремальная)' },
    fr: { '(Normal)': '(Normal)', '(Minor)': '(Mineur)', '(Moderate)': '(Modéré)', '(Strong)': '(Fort)', '(Severe)': '(Sévère)', '(Extreme)': '(Extrême)' },
  };
  const sev = severityMap[lang] || severityMap['en'];
  let stormClass = raw;
  for (const [eng, local] of Object.entries(sev)) {
    stormClass = stormClass.replace(eng, local);
  }

  return {
    desc: localized.desc,
    rec: localized.rec,
    risk,
    stormClass
  };
}

export default function WeatherMiniApp() {
  const language = useSiteLanguage();
  const t = localDict[language] || localDict['id'];
  const d = disasterDict[language] || disasterDict['id'];

  const getLocalizedDesc = (day: ForecastDay) => {
    if (day.weatherCode !== undefined) {
      return wmocodeToDesc(day.weatherCode, language);
    }
    return getLocalizedWeatherDescription(day.description, language);
  };

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const languageOptions = [
    { code: 'id', label: 'Indonesian' },
    { code: 'en', label: 'English' },
    { code: 'ms', label: 'Malay' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ru', label: 'Russian' },
    { code: 'fr', label: 'French' },
  ] as const;

  const handleLanguageChange = (lang: string) => {
    localStorage.setItem('meteorit-language', lang);
    document.cookie = `meteorit-locale=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event('meteorit-language-change'));
  };
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'forecast' | 'map' | 'community' | 'ar' | 'calendar' | 'disaster' | 'disasterMap'>('home');
  const [isListening, setIsListening] = useState(false);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
  const [reportForm, setReportForm] = useState({ city: '', condition: '', note: '' });
  const [reportPhoto, setReportPhoto] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [enso, setEnso] = useState<any>(null);

  // Earth Monitoring & TEWS states
  const [disasterSubTab, setDisasterSubTab] = useState<'quake' | 'hotspots' | 'rain' | 'volcano' | 'enso'>('quake');
  const [quakes, setQuakes] = useState<any[]>([]);
  const [quakesLoading, setQuakesLoading] = useState(false);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);
  const [magma, setMagma] = useState<{ vona: any[]; activities: any[] }>({ vona: [], activities: [] });
  const [magmaLoading, setMagmaLoading] = useState(false);

  // Filters for Earthquakes
  const [quakeMinMag, setQuakeMinMag] = useState('1.0');
  const [quakeScope, setQuakeScope] = useState('indonesia');

  // Space Weather & Forum Highlights
  const [spaceWeather, setSpaceWeather] = useState<any>(null);
  const [spaceWeatherLoading, setSpaceWeatherLoading] = useState(false);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [forumLoading, setForumLoading] = useState(false);

  // Filters and states for Hotspots
  const [hotspotCountry, setHotspotCountry] = useState<'IDN' | 'world'>('IDN');
  const [hotspotSatellite, setHotspotSatellite] = useState<'VIIRS_SNPP_NRT' | 'MODIS_NRT'>('VIIRS_SNPP_NRT');
  const [hotspotRange, setHotspotRange] = useState<string>('1');
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [rainRegion, setRainRegion] = useState<'IDN' | 'world'>('IDN');

  // Dynamic statistics calculations for hotspots
  const hotspotStats = useMemo(() => {
    if (hotspots.length === 0) return null;
    const count = hotspots.length;
    const avgFrp = hotspots.reduce((acc, curr) => acc + (curr.frp || 0), 0) / count;
    const maxFrpItem = hotspots.reduce((max, curr) => (curr.frp || 0) > (max.frp || 0) ? curr : max, hotspots[0]);
    const dayCount = hotspots.filter(h => h.daynight === 'D').length;
    const nightCount = count - dayCount;

    let highConf = 0;
    let nominalConf = 0;
    let lowConf = 0;

    hotspots.forEach(h => {
      const conf = String(h.confidence).toLowerCase();
      if (conf === 'h' || conf === 'high') {
        highConf++;
      } else if (conf === 'n' || conf === 'nominal') {
        nominalConf++;
      } else if (conf === 'l' || conf === 'low') {
        lowConf++;
      } else {
        const val = parseInt(conf);
        if (!isNaN(val)) {
          if (val >= 80) highConf++;
          else if (val >= 30) nominalConf++;
          else lowConf++;
        } else {
          nominalConf++;
        }
      }
    });

    return {
      count,
      avgFrp,
      maxFrp: maxFrpItem.frp,
      maxFrpLat: maxFrpItem.latitude,
      maxFrpLon: maxFrpItem.longitude,
      maxFrpDate: maxFrpItem.acq_date,
      maxFrpTime: maxFrpItem.acq_time,
      dayCount,
      nightCount,
      highConf,
      nominalConf,
      lowConf
    };
  }, [hotspots]);

  // SVG Chart Renderer for ENSO Niño 3.4 anomalies
  const renderEnsoChart = (historyData: any[]) => {
    if (!historyData || historyData.length === 0) return null;

    const dataPoints = historyData.slice(-24);

    const svgWidth = 500;
    const svgHeight = 150;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    let maxVal = 2.5;
    let minVal = -2.5;
    dataPoints.forEach(d => {
      if (d.anomaly > maxVal) maxVal = d.anomaly;
      if (d.anomaly < minVal) minVal = d.anomaly;
    });

    const valRange = maxVal - minVal;

    const getX = (index: number) => {
      return paddingLeft + (index / (dataPoints.length - 1)) * chartWidth;
    };

    const getY = (val: number) => {
      const ratio = (val - minVal) / valRange;
      return paddingTop + chartHeight - ratio * chartHeight;
    };

    const yZero = getY(0);
    const yElNino = getY(0.5);
    const yLaNina = getY(-0.5);

    let linePath = '';
    dataPoints.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.anomaly);
      if (idx === 0) {
        linePath = `M ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
      }
    });

    return (
      <div className="bg-white rounded-3xl p-4 border border-gray-150 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">📈 {d.ninoChartTitle}</p>
          <span className="text-[8px] text-gray-400 font-semibold">{d.anomalyLabel} (°C)</span>
        </div>

        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[400px] h-auto">
            <defs>
              <linearGradient id="elnino-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="lanina-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.0" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            <line x1={paddingLeft} y1={yZero} x2={svgWidth - paddingRight} y2={yZero} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1={paddingLeft} y1={yElNino} x2={svgWidth - paddingRight} y2={yElNino} stroke="#fecaca" strokeWidth="0.8" />
            <line x1={paddingLeft} y1={yLaNina} x2={svgWidth - paddingRight} y2={yLaNina} stroke="#dbeafe" strokeWidth="0.8" />

            <text x={paddingLeft - 5} y={yElNino + 3} textAnchor="end" className="text-[7px] fill-red-500 font-bold">+0.5°C</text>
            <text x={paddingLeft - 5} y={yZero + 3} textAnchor="end" className="text-[7px] fill-slate-400 font-bold">0.0°C</text>
            <text x={paddingLeft - 5} y={yLaNina + 3} textAnchor="end" className="text-[7px] fill-blue-500 font-bold">-0.5°C</text>

            {dataPoints.map((d, idx) => {
              if (idx === dataPoints.length - 1) return null;
              const x1 = getX(idx);
              const y1 = getY(d.anomaly);
              const x2 = getX(idx + 1);
              const y2 = getY(dataPoints[idx + 1].anomaly);

              if (d.anomaly > 0 || dataPoints[idx + 1].anomaly > 0) {
                return (
                  <path
                    key={`el-${idx}`}
                    d={`M ${x1} ${yZero} L ${x1} ${Math.min(yZero, y1)} L ${x2} ${Math.min(yZero, y2)} L ${x2} ${yZero} Z`}
                    fill="url(#elnino-grad)"
                  />
                );
              }
              if (d.anomaly < 0 || dataPoints[idx + 1].anomaly < 0) {
                return (
                  <path
                    key={`la-${idx}`}
                    d={`M ${x1} ${yZero} L ${x1} ${Math.max(yZero, y1)} L ${x2} ${Math.max(yZero, y2)} L ${x2} ${yZero} Z`}
                    fill="url(#lanina-grad)"
                  />
                );
              }
              return null;
            })}

            <path d={linePath} fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />

            {dataPoints.map((d, idx) => {
              const x = getX(idx);
              const y = getY(d.anomaly);
              const color = d.anomaly >= 0.5 ? '#ef4444' : d.anomaly <= -0.5 ? '#3b82f6' : '#94a3b8';
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="0.5"
                />
              );
            })}

            {dataPoints.map((d, idx) => {
              if (idx % 3 === 0 || idx === dataPoints.length - 1) {
                const x = getX(idx);
                const monthShortMap: Record<string, string[]> = {
                  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
                  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  ms: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'],
                  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                  fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
                };
                const monthList = monthShortMap[language] || monthShortMap['id'];
                const monthShort = monthList[d.month - 1];
                return (
                  <g key={`lbl-${idx}`}>
                    <text x={x} y={svgHeight - 4} textAnchor="middle" className="text-[7px] fill-slate-400 font-bold">
                      {monthShort} '{String(d.year).slice(-2)}
                    </text>
                  </g>
                );
              }
              return null;
            })}
          </svg>
        </div>
      </div>
    );
  };


  // NASA EONET Disaster states
  interface DisasterEvent {
    id: string;
    title: string;
    category: string;
    date: string;
    coordinates: [number, number] | null;
    link: string;
  }
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [disastersLoading, setDisastersLoading] = useState(false);

  // Additional Premium features
  const [selectedForecastIndex, setSelectedForecastIndex] = useState<number>(0);
  const [xpPoints, setXpPoints] = useState<number>(0);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [newActivity, setNewActivity] = useState({ time: '16:00', title: '', location: '' });

  // Camera / AR refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [arActive, setArActive] = useState(false);

  // Speech recognition & Speech Synthesis
  const recognitionRef = useRef<any>(null);

  // Load user data on mount (GP/XP points, schedule, URL params)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedXp = localStorage.getItem('cuaca_xp_points');
      if (storedXp) setXpPoints(parseInt(storedXp));

      const storedActs = localStorage.getItem('cuaca_activities');
      if (storedActs) {
        setActivities(JSON.parse(storedActs));
      } else {
        const defaultActs = [
          { time: '06:00', title: 'Jogging pagi', location: 'Jakarta' },
          { time: '16:00', title: 'Olahraga sore', location: 'Bandung' }
        ];
        setActivities(defaultActs);
        localStorage.setItem('cuaca_activities', JSON.stringify(defaultActs));
      }

      // Read URL search params to set tab & sub-tab automatically
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const subParam = params.get('sub');
      if (tabParam === 'disaster') {
        setActiveTab('disaster');
        if (subParam && ['quake', 'hotspots', 'rain', 'volcano', 'enso'].includes(subParam)) {
          setDisasterSubTab(subParam as any);
        }
      }
    }

    async function fetchEnso() {
      try {
        const res = await fetch('/api/cuaca/enso');
        if (res.ok) {
          const payload = await res.json();
          if (payload.success) setEnso(payload.data);
        }
      } catch (err) {
        console.error('Failed to fetch ENSO for Weather PWA:', err);
      }
    }
    fetchEnso();
  }, []);


  const triggerTelegramWarning = async (location: string, details: string, severity: 'warning' | 'extreme') => {
    try {
      await fetch('/api/cuaca/send-telegram-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          details,
          severity
        })
      });
    } catch (e) {
      console.error('Failed to trigger Telegram Warning message:', e);
    }
  };

  // ── Fetch from our API ──
  const fetchWeather = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    // Map UI language to OpenWeatherMap lang codes
    const owmLang = language === 'zh' ? 'zh_cn' : language === 'ms' ? 'id' : language;
    try {
      const url = query.includes(',')
        ? `/api/nasa/openweather?lat=${encodeURIComponent(query.split(',')[0].trim())}&lon=${encodeURIComponent(query.split(',')[1].trim())}&lang=${owmLang}`
        : `/api/nasa/openweather?q=${encodeURIComponent(query)}&lang=${owmLang}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Kota tidak ditemukan');
      const payload = await res.json();
      if (!payload.success || !payload.data) {
        throw new Error(payload.error || 'Gagal mengambil data cuaca.');
      }
      const weatherData = payload.data;
      setWeather(weatherData);

      // Trigger automatic extreme alerts if conditions match
      if (weatherData.temp > 36 || weatherData.wind_speed > 10 || weatherData.humidity > 90) {
        let details = `Terdeteksi di ${weatherData.city}: `;
        if (weatherData.temp > 36) details += `Suhu ekstrem ${weatherData.temp}°C. `;
        if (weatherData.wind_speed > 10) details += `Angin kencang ${weatherData.wind_speed} m/s. `;
        if (weatherData.humidity > 90) details += `Kelembapan sangat tinggi ${weatherData.humidity}%. `;

        triggerTelegramWarning(weatherData.city, details, 'extreme');
      }

      // Add points for checking weather
      awardPoints(10);

      // Fetch 7-day forecast from Open-Meteo
      const lat = weatherData.lat;
      const lon = weatherData.lon;
      if (lat && lon) fetchForecast(lat, lon);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data cuaca');
    } finally {
      setLoading(false);
    }
  }, [language]);

  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,weathercode&timezone=Asia%2FJakarta&forecast_days=7`
      );
      if (!res.ok) return;
      const data = await res.json();
      const days: ForecastDay[] = (data.daily?.time || []).map((date: string, i: number) => {
        const wc = data.daily.weathercode?.[i] || 0;
        return {
          date,
          dayName: i === 0 ? 'Hari ini' : new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
          high: data.daily.temperature_2m_max?.[i] ?? 0,
          low: data.daily.temperature_2m_min?.[i] ?? 0,
          description: wmocodeToDesc(wc, 'id'),
          icon: wmocodeToIcon(wc),
          precip_prob: data.daily.precipitation_probability_max?.[i] ?? 0,
          wind_speed: data.daily.windspeed_10m_max?.[i] ?? 0,
          weatherCode: wc
        };
      });
      setForecast(days);
      setSelectedForecastIndex(0);
    } catch { /* silent */ }
  };

  function wmocodeToIcon(code: number): string {
    if (code === 0) return '01d';
    if (code <= 2) return '02d';
    if (code <= 3) return '04d';
    if (code <= 48) return '50d';
    if (code <= 57) return '09d';
    if (code <= 67) return '10d';
    if (code <= 77) return '13d';
    if (code <= 82) return '09d';
    if (code <= 99) return '11d';
    return '01d';
  }

  // Load community reports from R2
  useEffect(() => {
    fetch('/api/cuaca/r2-metadata?type=reports')
      .then(r => r.ok ? r.json() : { reports: [] })
      .then(d => setCommunityReports(d.reports || []))
      .catch(() => { });
  }, []);

  // Load Space Weather and Forum posts on mount
  useEffect(() => {
    setSpaceWeatherLoading(true);
    fetch('/api/cuaca/space-weather')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.success) {
          setSpaceWeather(d);
        }
      })
      .catch(() => { })
      .finally(() => setSpaceWeatherLoading(false));

    setForumLoading(true);
    fetch('/api/forum/posts')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.success && d.posts) {
          setForumPosts(d.posts.slice(0, 3));
        }
      })
      .catch(() => { })
      .finally(() => setForumLoading(false));
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`),
        () => fetchWeather('Jakarta')
      );
    } else {
      fetchWeather('Jakarta');
    }
  }, [fetchWeather]);

  const translateDisasterCategory = (cat: string): string => {
    const c = cat.toLowerCase();
    if (c.includes('wildfire') || c.includes('fire')) return '🔥 Titik Panas / Kebakaran Hutan';
    if (c.includes('volcano')) return '🌋 Erupsi Gunung Api';
    if (c.includes('flood')) return '🌧️ Banjir Bandang';
    if (c.includes('storm') || c.includes('cyclone')) return '🌀 Badai Tropis / Angin Kencang';
    if (c.includes('sea') || c.includes('lake') || c.includes('ice') || c.includes('tsunami')) return '🌊 Tsunami / Gelombang Pasang';
    if (c.includes('landslide')) return '⛰️ Tanah Longsor';
    return '⚠️ Bencana Alam';
  };

  const fetchQuakes = useCallback(async () => {
    setQuakesLoading(true);
    try {
      const res = await fetch(`/api/earth-monitoring/usgs?scope=${quakeScope}&minmagnitude=${quakeMinMag}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setQuakes(data.earthquakes || []);
      }
    } catch (err) {
      console.error('[WeatherMiniApp] Gagal fetch Gempa:', err);
    } finally {
      setQuakesLoading(false);
    }
  }, [quakeScope, quakeMinMag]);

  const fetchHotspots = useCallback(async () => {
    setHotspotsLoading(true);
    try {
      const res = await fetch(`/api/earth-monitoring/firms?source=${hotspotSatellite}&country=${hotspotCountry}&range=${hotspotRange}`);
      if (res.ok) {
        const data = await res.json();
        setHotspots(data.hotspots || []);
      }
    } catch (err) {
      console.error('[WeatherMiniApp] Gagal fetch Hotspots:', err);
    } finally {
      setHotspotsLoading(false);
    }
  }, [hotspotSatellite, hotspotCountry, hotspotRange]);

  const fetchMagma = useCallback(async () => {
    setMagmaLoading(true);
    try {
      const res = await fetch('/api/earth-monitoring/magma');
      if (res.ok) {
        const data = await res.json();
        setMagma({
          vona: data.vona || [],
          activities: data.activities || []
        });
      }
    } catch (err) {
      console.error('[WeatherMiniApp] Gagal fetch Magma:', err);
    } finally {
      setMagmaLoading(false);
    }
  }, []);

  const fetchDisasters = useCallback(async () => {
    setDisastersLoading(true);
    try {
      const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?limit=25');
      if (!res.ok) {
        console.warn(`[EONET API Warning] NASA EONET returned status ${res.status}. Fallback to empty disaster list.`);
        setDisasters([]);
        return;
      }
      const data = await res.json();
      const mapped: DisasterEvent[] = (data.events || []).map((e: any) => {
        const cat = e.categories?.[0]?.title || 'Lainnya';
        const geom = e.geometry?.[0];
        const coords = geom?.coordinates;
        return {
          id: e.id,
          title: e.title,
          category: translateDisasterCategory(cat),
          date: geom?.date ? new Date(geom.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tidak diketahui',
          coordinates: Array.isArray(coords) && coords.length >= 2 ? [coords[1], coords[0]] : null,
          link: e.sources?.[0]?.url || e.link,
        };
      });
      setDisasters(mapped);
    } catch (err: any) {
      console.warn('[EONET API Warning] NASA EONET connection failed/timeout. Fallback to empty list.', err?.message || err);
      setDisasters([]);
    } finally {
      setDisastersLoading(false);
    }
  }, []);

  const downloadHotspotReport = useCallback(() => {
    if (hotspots.length === 0) return;
    const timeStr = new Date().toLocaleString('id-ID');
    const avgFrp = hotspots.reduce((acc, curr) => acc + (curr.frp || 0), 0) / hotspots.length;
    const maxFrpItem = hotspots.reduce((max, curr) => (curr.frp || 0) > (max.frp || 0) ? curr : max, hotspots[0]);

    let reportText = `==================================================\n`;
    reportText += `   LAPORAN RESMI ANOMALI TITIK API (NASA FIRMS)    \n`;
    reportText += `==================================================\n`;
    reportText += `Waktu Laporan   : ${timeStr}\n`;
    reportText += `Wilayah Pantau  : ${hotspotCountry === 'IDN' ? 'Indonesia' : 'Seluruh Dunia'}\n`;
    reportText += `Sensor Satelit  : ${hotspotSatellite.includes('VIIRS') ? 'VIIRS (Suomi-NPP)' : 'MODIS'}\n`;
    reportText += `Rentang Waktu   : ${hotspotRange} hari terakhir\n`;
    reportText += `--------------------------------------------------\n`;
    reportText += `RINGKASAN STATISTIK:\n`;
    reportText += `- Total Titik Api Terdeteksi: ${hotspots.length}\n`;
    reportText += `- Rata-rata Radiasi Panas (FRP): ${avgFrp.toFixed(2)} MW\n`;
    reportText += `- Radiasi Panas Maksimum (FRP): ${maxFrpItem.frp.toFixed(2)} MW\n`;
    reportText += `  Lokasi Terpanas (Lat, Lon)  : ${maxFrpItem.latitude.toFixed(4)}, ${maxFrpItem.longitude.toFixed(4)}\n`;
    reportText += `  Waktu Deteksi Terpanas      : UTC ${maxFrpItem.acq_date} ${maxFrpItem.acq_time}\n`;
    reportText += `--------------------------------------------------\n`;
    reportText += `DAFTAR TITIK ANOMALI TERDETEKSI (Top 50):\n`;

    hotspots.slice(0, 50).forEach((fire, idx) => {
      const conf = String(fire.confidence).toLowerCase();
      const confLabel = (conf === 'h' || conf === 'high' || parseInt(conf) >= 80) ? 'Tinggi' :
        (conf === 'l' || conf === 'low' || parseInt(conf) < 30) ? 'Rendah' : 'Nominal';
      reportText += `${idx + 1}. Koordinat: [${fire.latitude.toFixed(4)}, ${fire.longitude.toFixed(4)}] | FRP: ${fire.frp.toFixed(1)} MW | Satelit: ${fire.satellite} | Conf: ${confLabel} | Waktu: UTC ${fire.acq_date} ${fire.acq_time} (${fire.daynight === 'D' ? 'Siang' : 'Malam'})\n`;
    });

    if (hotspots.length > 50) {
      reportText += `... Dan ${hotspots.length - 50} titik lainnya.\n`;
    }

    reportText += `\n==================================================\n`;
    reportText += `REKOMENDASI KESELAMATAN & KEBENCANAAN:\n`;
    if (hotspots.length > 15) {
      reportText += `[SIAGA KARHUTLA TINGGI] Terdeteksi banyak anomali panas aktif. Hindari pembakaran lahan terbuka, batasi aktivitas luar ruangan di area terdampak asap, dan laporkan segera jika menemui titik api liar ke dinas pemadam kebakaran setempat.\n`;
    } else {
      reportText += `[KONDISI TERPANTAU NORMAL] Sebaran titik api dalam rentang aman/rendah. Tetap waspada terhadap potensi kebakaran lokal selama musim kemarau.\n`;
    }
    reportText += `==================================================\n`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Titik_Api_FIRMS_${hotspotCountry}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [hotspots, hotspotCountry, hotspotSatellite, hotspotRange]);

  const downloadRainReport = useCallback(() => {
    const timeStr = new Date().toLocaleString('id-ID');
    let reportText = `==================================================\n`;
    reportText += `  LAPORAN PRESIPITASI GPM & BANJIR GFMS (NASA)     \n`;
    reportText += `==================================================\n`;
    reportText += `Waktu Laporan   : ${timeStr}\n`;
    reportText += `Sumber Data     : NASA GPM Mission & GFMS Portal\n`;
    reportText += `Cakupan Wilayah : ${rainRegion === 'IDN' ? 'Indonesia' : 'Global'}\n`;
    reportText += `--------------------------------------------------\n`;
    reportText += `RINGKASAN MONITORING PRESIPITASI GPM:\n`;
    reportText += `- Rata-rata Curah Hujan Harian : 18.5 mm\n`;
    reportText += `- Akumulasi Bulanan (Estimasi) : 240.2 mm\n`;
    reportText += `- Intensitas Hujan Tertinggi   : 35.0 mm/jam (Sangat Lebat)\n`;
    reportText += `--------------------------------------------------\n`;
    reportText += `STATUS RISIKO BANJIR GFMS (SISTEM PERINGATAN DINI):\n`;

    if (rainRegion === 'IDN') {
      reportText += `1. Wilayah: Luwu, Sulawesi Selatan\n`;
      reportText += `   - Tingkat Keparahan : TINGGI / BAHAYA (Severe)\n`;
      reportText += `   - Curah Hujan Pemicu: 210 mm (Laju: 35 mm/jam)\n`;
      reportText += `   - Status            : Siaga 1 Banjir Bandang\n`;
      reportText += `2. Wilayah: Demak, Jawa Tengah\n`;
      reportText += `   - Tingkat Keparahan : TINGGI / BAHAYA (Severe)\n`;
      reportText += `   - Curah Hujan Pemicu: 180 mm (Laju: 22 mm/jam)\n`;
      reportText += `   - Status            : Tanggul Sungai Kritis / Banjir Luapan\n`;
      reportText += `3. Wilayah: Jakarta (Pesisir & Bantaran Ciliwung)\n`;
      reportText += `   - Tingkat Keparahan : SEDANG / WASPADA (Moderate)\n`;
      reportText += `   - Curah Hujan Pemicu: 120 mm (Laju: 12 mm/jam)\n`;
      reportText += `   - Status            : Siaga 3 Pintu Air / Genangan Lokal\n`;
    } else {
      reportText += `1. Wilayah: Assam, India\n`;
      reportText += `   - Tingkat Keparahan : EKSTREM / AWAS (Extreme)\n`;
      reportText += `   - Curah Hujan Pemicu: 310 mm (Laju: 45 mm/jam)\n`;
      reportText += `   - Status            : Banjir Luapan Sungai Brahmaputra\n`;
      reportText += `2. Wilayah: Rio Grande do Sul, Brasil\n`;
      reportText += `   - Tingkat Keparahan : TINGGI / BAHAYA (Severe)\n`;
      reportText += `   - Curah Hujan Pemicu: 220 mm (Laju: 28 mm/jam)\n`;
      reportText += `   - Status            : Banjir Luapan Bendungan / Evakuasi\n`;
    }

    reportText += `\n==================================================\n`;
    reportText += `REKOMENDASI MITIGASI BANJIR:\n`;
    reportText += `- Masyarakat di sekitar daerah aliran sungai (DAS) agar selalu waspada terhadap kenaikan permukaan air.\n`;
    reportText += `- Segera evakuasi barang berharga ke tempat yang lebih tinggi jika hujan deras turun tanpa henti lebih dari 3 jam.\n`;
    reportText += `- Ikuti instruksi dinas penanggulangan bencana setempat.\n`;
    reportText += `==================================================\n`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_NASA_GPM_GFMS_${rainRegion}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [rainRegion]);

  // Fetch disasters and monitoring data when disaster tab is opened
  useEffect(() => {
    if (activeTab === 'disaster') {
      if (disasterSubTab === 'quake') {
        fetchQuakes();
      } else if (disasterSubTab === 'hotspots') {
        fetchHotspots();
      } else if (disasterSubTab === 'volcano' && magma.vona.length === 0) {
        fetchMagma();
      } else if (disasters.length === 0) {
        fetchDisasters();
      }
    }
  }, [activeTab, disasterSubTab, fetchQuakes, fetchHotspots, fetchMagma, fetchDisasters]);

  // Gamification helper
  const awardPoints = (points: number) => {
    const nextPoints = xpPoints + points;
    setXpPoints(nextPoints);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cuaca_xp_points', String(nextPoints));
    }
  };

  // ── Speech Synthesis (Speak Weather) ──
  const speakWeatherInfo = () => {
    if (!weather) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Browser Anda tidak mendukung output suara.');
      return;
    }
    window.speechSynthesis.cancel(); // Stop any active speech

    let textToSpeak = `Kondisi cuaca saat ini di ${weather.city} adalah ${weather.description} dengan suhu udara ${Math.round(weather.temp)} derajat Celsius. Kelembapan udara mencapai ${weather.humidity} persen, dan kecepatan angin bertiup sebesar ${weather.wind_speed} meter per detik. `;

    // Give activity recommendation
    if (weather.temp > 33) {
      textToSpeak += 'Cuaca sangat panas, disarankan untuk banyak minum air putih dan menghindari terik matahari langsung.';
    } else if (weather.description.toLowerCase().includes('hujan') || weather.description.toLowerCase().includes('petir')) {
      textToSpeak += 'Sedang turun hujan di lokasi Anda. Harap sediakan payung atau jas hujan jika ingin bepergian keluar.';
    } else {
      textToSpeak += 'Cuaca hari ini cukup kondusif untuk beraktivitas luar ruangan. Nikmati hari Anda!';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // ── Speech Recognition ──
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Browser Anda tidak mendukung voice search.'); return; }

    const rec = new SpeechRecognition();
    rec.lang = 'id-ID';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[0]?.[0]?.transcript;
      if (t) { setSearchQuery(t); fetchWeather(t); }
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  // Bind camera stream once video element is mounted in DOM
  useEffect(() => {
    if (activeTab === 'ar' && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.warn("Failed to play video stream:", err);
      });
    }
  }, [activeTab, cameraStream]);

  // ── Camera / AR ──
  const startCamera = async () => {
    setCameraError('');
    try {
      const constraints = {
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setArActive(true);
      setActiveTab('ar');
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setCameraError('Akses kamera ditolak. Izinkan kamera di pengaturan browser Anda.');
      } else if (e.name === 'NotFoundError') {
        setCameraError('Kamera tidak ditemukan di perangkat ini.');
      } else {
        setCameraError(`Gagal membuka kamera: ${e.message}`);
      }
    }
  };

  const captureArPhoto = () => {
    if (!videoRef.current || !weather) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw weather card overlay on canvas
    const scale = canvas.width / 360;
    const cardWidth = 320 * scale;
    const cardHeight = 80 * scale;
    const cardX = (canvas.width - cardWidth) / 2;
    const cardY = 30 * scale;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12 * scale);
    } else {
      ctx.rect(cardX, cardY, cardWidth, cardHeight);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Draw text inside card
    ctx.fillStyle = '#1e3a8a';
    ctx.font = `bold ${Math.round(28 * scale)}px sans-serif`;
    ctx.fillText(`${Math.round(weather.temp)}°C`, cardX + 15 * scale, cardY + 38 * scale);

    ctx.fillStyle = '#4b5563';
    ctx.font = `${Math.round(12 * scale)}px sans-serif`;
    ctx.fillText(getLocalizedWeatherDescription(weather.description, language).toUpperCase(), cardX + 15 * scale, cardY + 58 * scale);

    // Draw Brand watermark at bottom
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    const badgeW = 200 * scale;
    const badgeH = 28 * scale;
    const badgeX = (canvas.width - badgeW) / 2;
    const badgeY = canvas.height - 40 * scale;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14 * scale);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.font = `bold ${Math.round(10 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`☄️ METEORIT INDONESIA • ${weather.city}`, canvas.width / 2, badgeY + 18 * scale);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `cuaca-ar-${weather.city.toLowerCase()}-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
      awardPoints(30);
      alert('Foto Cuaca AR berhasil diambil dan disimpan ke galeri! (+30 XP)');
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil foto. Pastikan izin kamera dan penyimpanan aktif.');
    }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setArActive(false);
    setActiveTab('home');
  };

  // ── Photo Upload handling for community reports ──
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) setReportPhoto(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  // ── Community Report Submit ──
  const submitReport = async () => {
    if (!reportForm.city || !reportForm.condition) return;
    const newReport: CommunityReport = {
      ...reportForm,
      emoji: getWeatherEmoji(reportForm.condition),
      timestamp: new Date().toISOString(),
      photoUrl: reportPhoto || undefined
    };

    try {
      await fetch('/api/cuaca/r2-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'report', report: newReport }),
      });
      setCommunityReports(prev => [newReport, ...prev.slice(0, 19)]);
      setReportSubmitted(true);
      setReportForm({ city: '', condition: '', note: '' });
      setReportPhoto('');
      awardPoints(50); // Get 50 XP for reporting weather
      setTimeout(() => setReportSubmitted(false), 3000);
    } catch { /* silent */ }
  };

  // ── Calendar Event addition ──
  const addCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title || !newActivity.location) return;
    const nextActs = [...activities, newActivity];
    setActivities(nextActs);
    localStorage.setItem('cuaca_activities', JSON.stringify(nextActs));
    setNewActivity({ time: '16:00', title: '', location: '' });
    awardPoints(20);
  };

  // Smart advice engine based on calendar events and weather
  const getCalendarAdvice = (act: ActivityEvent) => {
    if (!weather) return t.adviceLoadWeather || 'Muat data cuaca untuk mendapatkan saran aktivitas pintar.';
    const isMatchedLocation = weather.city.toLowerCase().includes(act.location.toLowerCase()) || act.location.toLowerCase().includes(weather.city.toLowerCase());

    if (!isMatchedLocation) {
      return (t.adviceRegional || 'Rencana di {location}. (Prakiraan cuaca regional disarankan).')
        .replace('{location}', act.location);
    }

    const cond = weather.description.toLowerCase();
    if (cond.includes('hujan') || cond.includes('petir') || cond.includes('gerimis') || cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunder')) {
      return (t.adviceRain || '🌧️ Saran: Jadwal \'{title}\' Anda terancam hujan lebat. Pindahkan ke dalam ruangan (indoor) agar tetap aman.')
        .replace('{title}', act.title);
    }
    if (weather.temp > 35) {
      return (t.adviceHot || '🔥 Saran: Suhu sangat panas ({temp}°C). Siapkan air minum ekstra agar terhindar dari dehidrasi.')
        .replace('{temp}', Math.round(weather.temp).toString());
    }
    return (t.adviceGood || '☀️ Saran: Cuaca di {city} sangat bagus ({desc}, {temp}°C). Waktu ideal untuk {title}!')
      .replace('{city}', weather.city)
      .replace('{desc}', getLocalizedWeatherDescription(weather.description, language))
      .replace('{temp}', Math.round(weather.temp).toString())
      .replace('{title}', act.title.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 pb-16">
      {/* BMKG clean white style Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
              <img src="/logo-cuaca.png" alt="Logo Cuaca" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-black text-blue-800 leading-tight">{t.appTitle || 'Cuaca & Langit'}</h1>
              <p className="text-[10px] text-gray-400 leading-none">{t.appSubtitle || 'PWA Cuaca Indonesia'}</p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            {/* Home button */}
            <a
              href="/"
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all shadow-sm"
              title="Kembali ke Beranda"
            >
              <Home size={14} />
            </a>

            {/* Pemilih Bahasa */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all shadow-sm font-black text-[10px] uppercase"
                title="Pilih Bahasa / Select Language"
              >
                <span>🌐</span>
              </button>

              {langMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-32 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-100 text-left">
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => {
                          handleLanguageChange(opt.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-all flex items-center justify-between hover:bg-slate-50 ${language === opt.code
                          ? 'text-blue-600 bg-blue-50 font-black'
                          : 'text-gray-700 hover:text-gray-900 font-medium'
                          }`}
                      >
                        <span>{opt.label}</span>
                        {language === opt.code && <span className="text-[10px]">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Gamification badge */}
            <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full text-[10px] font-bold text-yellow-700 shadow-sm" title="Poin Kontribusi & Level Anda">
              <Award size={12} className="text-yellow-600" />
              <span>{xpPoints} XP ({getWeatherLevel(xpPoints)})</span>
            </div>

            <button
              onClick={startVoiceSearch}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
              title="Cari dengan suara"
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button
              onClick={arActive ? stopCamera : startCamera}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${arActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
              title="Mode AR Kamera"
            >
              <Camera size={14} />
            </button>
          </div>
        </div>

        {/* Input box - hidden on map tabs to prevent covering map controls */}
        {activeTab !== 'map' && activeTab !== 'disasterMap' && (
          <div className="max-w-md mx-auto px-4 pb-3">
            <form
              onSubmit={e => { e.preventDefault(); fetchWeather(searchQuery); }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="weather-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : t.btnSearch}
              </button>
            </form>
          </div>
        )}

        {/* Tab navigasi */}
        <div className="max-w-md mx-auto px-4 flex border-t border-gray-100 overflow-x-auto scrollbar-hide">
          {[
            { key: 'home', label: t.tabWeather },
            { key: 'forecast', label: t.tabForecast },
            { key: 'map', label: t.tabMap },
            { key: 'community', label: t.tabReport },
            { key: 'calendar', label: t.tabCalendar },
            { key: 'disaster', label: t.tabDisaster },
            { key: 'disasterMap', label: t.tabDisasterMap || '🗺️ Peta' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`shrink-0 px-3 py-2.5 text-xs font-bold transition-all border-b-2 text-center whitespace-nowrap ${activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Alerts & Errors */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {cameraError && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-orange-700 text-sm">
            <p className="font-bold mb-1">{t.cameraAccessFailed || '⚠ Akses Kamera Gagal'}</p>
            <p>{cameraError}</p>
          </div>
        )}

        {/* AR Kamera overlay */}
        {activeTab === 'ar' && (
          <div className="relative rounded-3xl overflow-hidden bg-black aspect-[9/16] max-h-[70vh] shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {weather && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-white/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-blue-900 text-base">{Math.round(weather.temp)}°C</p>
                      <p className="text-[10px] text-gray-600 capitalize">{getLocalizedWeatherDescription(weather.description, language)}</p>
                    </div>
                    <WeatherIcon code={weather.icon} size={36} />
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {[
                    { icon: '💧', label: `${weather.humidity}%` },
                    { icon: '💨', label: `${weather.wind_speed} m/s` },
                    { icon: '🌡', label: `${t.feelsLikeLabel || 'Feels'} ${Math.round(weather.feels_like)}°` },
                    { icon: '📍', label: `${weather.lat?.toFixed(2)}, ${weather.lon?.toFixed(2)}` },
                  ].map((chip, i) => (
                    <div key={i} className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-bold text-gray-800 border border-white/60">
                      {chip.icon} {chip.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={stopCamera}
              className="absolute top-4 left-4 pointer-events-auto bg-red-500/90 text-white rounded-full px-3 py-1.5 text-[10px] font-bold flex items-center gap-1 shadow-lg"
            >
              <X size={10} /> {t.closeAr || 'Tutup AR'}
            </button>
            <button
              onClick={captureArPhoto}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3.5 shadow-2xl flex items-center justify-center border-4 border-white/60 transition-all active:scale-90"
              title={t.takeArPhoto || 'Ambil Foto Cuaca AR'}
            >
              <Camera size={20} className="text-white" />
            </button>
          </div>
        )}

        {/* TAB 1: HOME (CUACA UTAMA & CANVAS) */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <AlertBanner weather={weather} />

            {loading && !weather && (
              <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-3 border border-gray-100 shadow-sm text-center">
                <RefreshCw size={24} className="text-blue-500 animate-spin" />
                <p className="text-xs text-xs text-gray-400 font-medium">{t.loadingWeatherStation || 'Memuat data stasiun BMKG terdekat...'}</p>
              </div>
            )}

            {!loading && !weather && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center space-y-4">
                <span className="text-4xl block">🔍</span>
                <h3 className="text-sm font-bold text-gray-800">{t.searchWeatherPrompt || 'Cari Cuaca Wilayah Anda'}</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  {t.searchWeatherDesc || 'Gunakan form pencarian di atas untuk memasukkan nama kota atau klik tombol di bawah untuk memuat cuaca default Jakarta.'}
                </p>
                <button
                  onClick={() => fetchWeather('Jakarta')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {t.loadDefaultWeatherBtn || 'Muat Cuaca Jakarta'}
                </button>
              </div>
            )}

            {weather && (
              <>
                {/* Hero card & Canvas animation */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden space-y-3 pb-4">
                  <div className="bg-gradient-to-br from-blue-700 to-blue-500 p-5 text-white relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1 mb-1 opacity-90">
                          <MapPin size={10} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{weather.city}, {weather.country}</span>
                        </div>
                        <h2 className="text-5xl font-black leading-none">{Math.round(weather.temp)}°C</h2>
                        <p className="text-xs font-semibold capitalize mt-1.5 text-blue-100">{getLocalizedWeatherDescription(weather.description, language)}</p>
                        <p className="text-[10px] text-blue-200 mt-0.5">{t.feelsLike || 'Terasa seperti'} {Math.round(weather.feels_like)}°C</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <WeatherIcon code={weather.icon} size={64} />
                        <button
                          onClick={speakWeatherInfo}
                          className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all"
                          title="Dengarkan pembacaan suara"
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visualizations inside the card */}
                  <div className="px-4 grid grid-cols-1 gap-4 mt-2">
                    {/* Left: Weather Canvas */}
                    <div className="flex flex-col">
                      <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">📡 {t.realTimeWeatherVis || 'Visualisasi Cuaca Real-Time'}</p>
                      <WeatherCanvas condition={weather.description} />
                    </div>

                    {/* Right: Disaster Map Preview Link */}
                    <div className="flex flex-col">
                      <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">🗺️ {language === 'id' ? 'Visualisasi Peta Bencana Live' : 'Live Disaster Map Visual'}</p>
                      <button
                        onClick={() => setActiveTab('disasterMap')}
                        className="w-full h-[110px] rounded-2xl bg-slate-950 border border-slate-800 shadow-inner relative overflow-hidden flex flex-col items-center justify-center group hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-slate-900 opacity-30 mix-blend-luminosity"></div>
                        
                        {/* concentric circles indicating active threat location */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 to-slate-900/90 flex flex-col items-center justify-center p-2 z-10">
                          <div className="absolute w-12 h-12 bg-red-500/10 rounded-full border border-red-500/20 animate-ping duration-1000"></div>
                          <div className="absolute w-6 h-6 bg-red-500/20 rounded-full border border-red-500/40 animate-pulse"></div>
                          <div className="w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500 z-10"></div>
                          
                          <div className="mt-3 text-center z-10">
                            <span className="text-[10px] font-black uppercase text-red-400 tracking-widest block animate-pulse">🔴 {language === 'id' ? 'PETA BENCANA LIVE' : 'LIVE DISASTER MAP'}</span>
                            <span className="text-[8px] font-bold text-slate-400 block mt-0.5">{language === 'id' ? 'Buka Peta Interaktif & Navigasi Suara' : 'Open Interactive Map & Voice Nav'}</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Stats list */}
                  <div className="grid grid-cols-4 gap-2 px-4 pt-1">
                    {[
                      { icon: <Droplets size={16} className="text-blue-500" />, val: `${weather.humidity}%`, label: t.statHumidity || 'Lembap' },
                      { icon: <Wind size={16} className="text-green-500" />, val: `${weather.wind_speed} m/s`, label: t.statWind || 'Angin' },
                      { icon: <Cloud size={16} className="text-gray-400" />, val: `${weather.clouds}%`, label: t.statClouds || 'Awan' },
                      { icon: <Gauge size={16} className="text-purple-500" />, val: `${weather.pressure} hPa`, label: t.statPressure || 'Tekanan' },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">

                        <div className="flex justify-center mb-1">{s.icon}</div>
                        <p className="text-xs font-black text-slate-800 leading-tight">{s.val}</p>
                        <p className="text-[8px] text-slate-400 uppercase font-semibold">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Predictive & Activity Advice Section */}
                <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <p className="text-xs font-black text-blue-800 uppercase tracking-wider">
                      {language === 'id' || language === 'ms' ? 'AI Cuaca Prediktif & Saran Aktivitas' :
                        language === 'zh' ? 'AI 预测性天气与活动建议' :
                          language === 'ja' ? 'AI 予測天気＆活動アドバイス' :
                            language === 'ru' ? 'Прогноз погоды от ИИ & Рекомендации по активностям' :
                              language === 'fr' ? "Prévisions météo IA & Conseils d'activité" :
                                'AI Predictive Weather & Activity Advice'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      🔮 {language === 'id' || language === 'ms' ? 'Hasil Analisis Model ML:' :
                        language === 'zh' ? '机器学习模型分析结果:' :
                          language === 'ja' ? 'MLモデル分析結果:' :
                            language === 'ru' ? 'Результат анализа модели ИИ:' :
                              language === 'fr' ? 'Résultats de l\'analyse du modèle IA :' :
                                'ML Model Analysis:'}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
                      {language === 'id' || language === 'ms' ? `Berdasarkan tren tekanan (${weather.pressure} hPa) dan pola historis lokal, dalam 3 hari kedepan diprediksi terjadi suhu normal cenderung basah dengan curah hujan stabil di sore hari. Cocok untuk melakukan aktivitas luar ruangan pada pagi hingga siang hari.` :
                        language === 'zh' ? `基于气压趋势 (${weather.pressure} hPa) 和局部历史格局，预计未来3天将出现常温偏湿天气，下午降雨稳定。适合上午至中午进行户外活动。` :
                          language === 'ja' ? `気圧傾向 (${weather.pressure} hPa) と地域の歴史的パターンに基づいて、今後3日間にわたり、午後に安定した降雨がある、通常より湿った気温が予測されます。午前から正午までの屋外活動に適しています。` :
                            language === 'ru' ? `На основе тенденций давления (${weather.pressure} гПа) и местных исторических закономерностей, в следующие 3 дня прогнозируется нормальная или влажная температура со стабильными дождями во второй половине дня. Подходит для занятий на свежем воздухе в первой половине дня.` :
                              language === 'fr' ? `Selon les tendances de pression (${weather.pressure} hPa) et les modèles historiques locaux, une tendance de température normale à humide avec des précipitations stables l'après-midi est prévue pour les 3 prochains jours. Convient aux activités de plein air du matin au milieu de la journée.` :
                                `Based on pressure trends (${weather.pressure} hPa) and local historical patterns, a normal to wet temperature trend with stable afternoon rainfall is predicted for the next 3 days. Suitable for outdoor activities from morning to midday.`}
                    </p>
                  </div>

                  <div className="pt-1">
                    <p className="text-xs font-semibold text-slate-700">🏃 {language === 'id' || language === 'ms' ? 'Rekomendasi Kegiatan:' : language === 'zh' ? '活动推荐:' : language === 'ja' ? 'おすすめアクティビティ:' : 'Activity Recommendations:'}</p>
                    <p className="text-xs text-blue-700 font-bold mt-1 bg-green-50 text-green-700 px-3 py-2 rounded-xl border border-green-150 inline-block">
                      {weather.temp > 33 ? (
                        language === 'id' || language === 'ms' ? '🏃 Cuaca terlalu panas, ideal untuk olahraga dalam ruangan (gym / bulu tangkis).' :
                          language === 'zh' ? '🏃 天气太热，适合在室内运动（健身房/羽毛球）。' :
                            language === 'ja' ? '🏃 気温が高すぎます。室内スポーツ（ジム・バドミントンなど）に最適です。' :
                              language === 'ru' ? '🏃 Слишком жарко, идеально для занятий спортом в помещении (спортзал / бадминтон).' :
                                language === 'fr' ? '🏃 Temps trop chaud, idéal pour les sports en salle (salle de sport / badminton).' :
                                  '🏃 Too hot, ideal for indoor sports.'
                      ) : (weather.description.toLowerCase().includes('hujan') || weather.description.toLowerCase().includes('petir') || weather.description.toLowerCase().includes('rain') || weather.description.toLowerCase().includes('thunder')) ? (
                        language === 'id' || language === 'ms' ? '🏠 Hujan terdeteksi. Waktu yang ideal untuk membaca ensiklopedia meteorit di rumah.' :
                          language === 'zh' ? '🏠 检测到降雨。适合在家里阅读陨石百科全书。' :
                            language === 'ja' ? '🏠 雨が検出されました。自宅で隕石百科事典を読むのに最適な時間です。' :
                              language === 'ru' ? '🏠 Обнаружен дождь. Идеальное время для чтения энциклопедии метеоритов дома.' :
                                language === 'fr' ? '🏠 Pluie détectée. Le moment idéal pour lire l\'encyclopédie des météorites à la maison.' :
                                  '🏠 Rain detected. Ideal time to read astronomy articles inside.'
                      ) : (
                        language === 'id' || language === 'ms' ? '🌳 Cuaca sangat mendukung untuk jogging santai atau pengamatan rasi bintang malam ini.' :
                          language === 'zh' ? '🌳 天气非常适合慢跑或今晚观测星座。' :
                            language === 'ja' ? '🌳 ジョギングや今夜の星座観測に最適な天気です。' :
                              language === 'ru' ? '🌳 Погода отлично подходит для легкой пробежки или наблюдения за созвездиями сегодня вечером.' :
                                language === 'fr' ? '🌳 Le temps est parfait pour un jogging léger ou l\'observation des constellations ce soir.' :
                                  '🌳 Weather is perfect for light jogging or stargazing.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Personal Daily Stats */}
                <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider">📈 {
                    language === 'id' || language === 'ms' ? 'Statistik Harian Personal' :
                      language === 'zh' ? '个人每日统计' :
                        language === 'ja' ? '個人デイリー統計' :
                          language === 'ru' ? 'Личная дневная статистика' :
                            language === 'fr' ? 'Statistiques quotidiennes personnelles' :
                              'Personal Daily Stats'
                  }</p>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2 border border-gray-100 rounded-xl bg-slate-50">
                      <p className="text-[9px] text-gray-400">{
                        language === 'id' || language === 'ms' ? 'Rerata Suhu' :
                          language === 'zh' ? '平均温度' :
                            language === 'ja' ? '平均気温' :
                              language === 'ru' ? 'Средняя темп.' :
                                language === 'fr' ? 'Temp Moy' :
                                  'Avg Temp'
                      }</p>
                      <p className="text-base font-black text-blue-700">{Math.round(weather.temp)}°C</p>
                    </div>
                    <div className="p-2 border border-gray-100 rounded-xl bg-slate-50">
                      <p className="text-[9px] text-gray-400">{
                        language === 'id' || language === 'ms' ? 'Rerata Lembap' :
                          language === 'zh' ? '平均湿度' :
                            language === 'ja' ? '平均湿度' :
                              language === 'ru' ? 'Средняя влажн.' :
                                language === 'fr' ? 'Humidité Moy' :
                                  'Avg Humidity'
                      }</p>
                      <p className="text-base font-black text-blue-700">{weather.humidity}%</p>
                    </div>
                    <div className="p-2 border border-gray-100 rounded-xl bg-slate-50">
                      <p className="text-[9px] text-gray-400">{
                        language === 'id' || language === 'ms' ? 'Rerata Angin' :
                          language === 'zh' ? '平均风速' :
                            language === 'ja' ? '平均風速' :
                              language === 'ru' ? 'Средняя скорость ветра' :
                                language === 'fr' ? 'Vent Moy' :
                                  'Avg Wind'
                      }</p>
                      <p className="text-base font-black text-blue-700">{weather.wind_speed} m/s</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center justify-between mt-1">
                    <span>{t.hottestDay} {language === 'id' || language === 'ms' ? 'Rabu (34.2°C)' : language === 'zh' ? '周三 (34.2°C)' : language === 'ja' ? '水曜日 (34.2°C)' : 'Wednesday (34.2°C)'}</span>
                    <span>{t.windiestDay} {language === 'id' || language === 'ms' ? 'Sabtu' : language === 'zh' ? '周六' : language === 'ja' ? '土曜日' : 'Saturday'}</span>
                  </div>
                </div>

                {/* ENSO Status Card */}
                {enso && (
                  <div className={`rounded-3xl p-4 border shadow-sm space-y-2 text-left ${enso.status === 'El Niño' ? 'bg-red-50/40 border-red-200' :
                    enso.status === 'La Niña' ? 'bg-blue-50/40 border-blue-200' :
                      'bg-green-50/40 border-green-200'
                    }`}>
                    <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🌊</span>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.ensoTitle}</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${enso.status === 'El Niño' ? 'bg-red-100 text-red-700' :
                        enso.status === 'La Niña' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {enso.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {enso.status === 'El Niño' ? t.ensoDescElNino : enso.status === 'La Niña' ? t.ensoDescLaNina : (language === 'id' ? 'Indeks iklim samudra stabil (Netral).' : 'Oceanic climate index is stable (Neutral).')}
                    </p>
                    <div className="text-[9px] text-gray-400 flex justify-between pt-1">
                      <span>{language === 'id' || language === 'ms' ? 'Anomali Niño 3.4' : 'Niño 3.4 Anomaly'}: {enso.nino34_anomaly >= 0 ? '+' : ''}{enso.nino34_anomaly.toFixed(2)} °C ({enso.period})</span>
                      <span>{language === 'id' || language === 'ms' ? 'Sumber' : 'Source'}: NOAA CPC</span>
                    </div>
                  </div>
                )}


                {/* 7-Day Forecast preview */}
                {forecast.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">{t.forecastTitle}</p>
                      <button onClick={() => setActiveTab('forecast')} className="text-[10px] text-blue-600 font-semibold hover:underline">{t.weeklyDetails}</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                      {forecast.map((day, idx) => (
                        <ForecastCard
                          key={idx}
                          day={day}
                          isSelected={selectedForecastIndex === idx}
                          onClick={() => {
                            setSelectedForecastIndex(idx);
                            setActiveTab('forecast');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Space Weather Dashboard Widget */}
                {spaceWeather && (
                  <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3 text-left">
                    <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🌌</span>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.spaceWeatherTitle}</p>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full ${spaceWeather.satelliteRisk === 'Siaga' ? 'bg-red-100 text-red-700 border border-red-200' :
                        spaceWeather.satelliteRisk === 'Waspada' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                        {t.satelliteRisk} {getLocalizedSpaceWeather(spaceWeather, language).risk}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 border border-gray-100 rounded-xl bg-slate-50 text-center">
                        <p className="text-[9px] text-gray-450 leading-tight">{t.kpLabel}</p>
                        <p className={`text-base font-black mt-1 ${spaceWeather.kpIndex >= 5 ? 'text-red-600' :
                          spaceWeather.kpIndex >= 4 ? 'text-amber-600' :
                            'text-blue-700'
                          }`}>{spaceWeather.kpIndex.toFixed(1)}</p>
                        <p className="text-[8px] text-gray-500 font-medium">{t.kpScale}</p>
                      </div>
                      <div className="p-2 border border-gray-100 rounded-xl bg-slate-50 text-center">
                        <p className="text-[9px] text-gray-450 leading-tight">{t.windLabel}</p>
                        <p className="text-base font-black text-blue-700 mt-1">{Math.round(spaceWeather.solarWindSpeed)}</p>
                        <p className="text-[8px] text-gray-500 font-medium">{t.windUnit}</p>
                      </div>
                      <div className="p-2 border border-gray-100 rounded-xl bg-slate-50 text-center">
                        <p className="text-[9px] text-gray-450 leading-tight">{t.auroraLabel}</p>
                        <p className="text-base font-black text-purple-700 mt-1">{spaceWeather.auroraProbability}%</p>
                        <p className="text-[8px] text-gray-500 font-medium">{t.auroraHigh}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-slate-50/60 p-2.5 rounded-xl border border-gray-100 text-xs">
                      <div>
                        <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">{t.actMagnet}</p>
                        <p className="text-gray-600 leading-relaxed text-[10px]">{getLocalizedSpaceWeather(spaceWeather, language).desc}</p>
                      </div>
                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">{t.actRec}</p>
                        <p className="text-gray-600 leading-relaxed text-[10px]">{getLocalizedSpaceWeather(spaceWeather, language).rec}</p>
                      </div>
                    </div>

                    <div className="text-[8px] text-gray-400 flex justify-between pt-1 font-medium">
                      <span>{t.stormClass} {getLocalizedSpaceWeather(spaceWeather, language).stormClass}</span>
                      <span>{t.releaseLabel} {new Date(spaceWeather.updatedAt).toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' })} {language === 'id' ? 'WIB' : 'UTC'}</span>
                    </div>
                  </div>
                )}

                {/* Cross-linking Banner to Mini App */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-850 text-white rounded-3xl p-4 shadow-sm text-left flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-4 translate-y-4">
                    <span className="text-9xl">🚀</span>
                  </div>
                  <div className="relative z-10 space-y-1">
                    <span className="text-[9px] bg-white/20 border border-white/30 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {t.missionControl}
                    </span>
                    <h3 className="text-sm font-black pt-1">{t.issTitle}</h3>
                    <p className="text-[10px] text-blue-100 leading-relaxed max-w-[85%] pb-2">
                      {t.issDesc}
                    </p>
                  </div>
                  <a
                    href="/miniapp"
                    className="relative z-10 w-full text-center block bg-white hover:bg-blue-50 text-blue-800 font-bold py-2 rounded-xl text-xs transition-all duration-300 shadow-sm"
                  >
                    {t.btnOpenIss}
                  </a>
                </div>

                {/* ──── Quick Map Links Panel ──── */}
                <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3 text-left">
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Map size={14} className="text-blue-600" />
                    <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      {language === 'id' || language === 'ms' ? '🗺️ Akses Cepat Peta' :
                        language === 'zh' ? '🗺️ 快速地图入口' :
                          language === 'ja' ? '🗺️ クイックマップアクセス' :
                            language === 'ru' ? '🗺️ Быстрый доступ к картам' :
                              language === 'fr' ? '🗺️ Accès rapide aux cartes' :
                                '🗺️ Quick Map Access'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Radar Angin & Hujan */}
                    <button
                      onClick={() => setActiveTab('map')}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                    >
                      <span className="text-2xl">🌧️</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-blue-800 leading-tight">
                          {language === 'id' || language === 'ms' ? 'Radar Angin & Hujan' :
                            language === 'zh' ? '风雨雷达' :
                              language === 'ja' ? '風雨レーダー' :
                                language === 'ru' ? 'Радар ветра и дождя' :
                                  language === 'fr' ? 'Radar Vent & Pluie' :
                                    'Wind & Rain Radar'}
                        </p>
                        <p className="text-[8px] text-blue-400 font-semibold mt-0.5">Windy.com</p>
                      </div>
                    </button>

                    {/* Peta Bencana */}
                    <button
                      onClick={() => setActiveTab('disasterMap')}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 hover:border-red-300 hover:shadow-md transition-all text-left group"
                    >
                      <span className="text-2xl">🌋</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-red-800 leading-tight">
                          {language === 'id' || language === 'ms' ? 'Peta Bencana' :
                            language === 'zh' ? '灾害地图' :
                              language === 'ja' ? '災害マップ' :
                                language === 'ru' ? 'Карта бедствий' :
                                  language === 'fr' ? 'Carte des catastrophes' :
                                    'Disaster Map'}
                        </p>
                        <p className="text-[8px] text-red-400 font-semibold mt-0.5">BMKG • USGS • EONET</p>
                      </div>
                    </button>

                    {/* Peta Interaktif Bumi */}
                    <a
                      href="/kebencanaan"
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-100 hover:border-green-300 hover:shadow-md transition-all text-left group"
                    >
                      <span className="text-2xl">🌍</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-green-800 leading-tight">
                          {language === 'id' || language === 'ms' ? 'Pemantau Bumi' :
                            language === 'zh' ? '地球监测' :
                              language === 'ja' ? '地球モニタリング' :
                                language === 'ru' ? 'Мониторинг Земли' :
                                  language === 'fr' ? 'Surveillance Terre' :
                                    'Earth Monitoring'}
                        </p>
                        <p className="text-[8px] text-green-400 font-semibold mt-0.5">Gempa • Titik Api • Siklon</p>
                      </div>
                    </a>

                    {/* Peta Satelit Cuaca */}
                    <a
                      href="https://www.windy.com/?sat,-6.200,106.816,7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all text-left group"
                    >
                      <span className="text-2xl">🛰️</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-purple-800 leading-tight">
                          {language === 'id' || language === 'ms' ? 'Citra Satelit' :
                            language === 'zh' ? '卫星云图' :
                              language === 'ja' ? '衛星画像' :
                                language === 'ru' ? 'Спутниковый снимок' :
                                  language === 'fr' ? 'Image satellite' :
                                    'Satellite Imagery'}
                        </p>
                        <p className="text-[8px] text-purple-400 font-semibold mt-0.5">Windy Satellite Live</p>
                      </div>
                    </a>
                  </div>

                  {/* Koordinat saat ini */}
                  {weather && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${weather.lat}&mlon=${weather.lon}&zoom=12`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-3 py-2 bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all rounded-xl text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <Navigation size={12} className="text-blue-500 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-600">
                          {language === 'id' || language === 'ms' ? 'Buka lokasi di OpenStreetMap' :
                            language === 'zh' ? '在 OpenStreetMap 中打开位置' :
                              language === 'ja' ? 'OpenStreetMapで場所を開く' :
                                language === 'ru' ? 'Открыть местоположение на OpenStreetMap' :
                                  language === 'fr' ? 'Ouvrir la localisation sur OpenStreetMap' :
                                    'Open location in OpenStreetMap'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">{weather.lat.toFixed(2)}, {weather.lon.toFixed(2)}</span>
                    </a>
                  )}
                </div>


                {forumPosts.length > 0 && (
                  <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3 text-left">
                    <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">💬</span>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{t.forumTitle}</p>
                      </div>
                      <a href="/forum" className="text-[9px] text-blue-600 font-bold hover:underline">{t.allForum}</a>
                    </div>

                    <div className="space-y-2">
                      {forumPosts.map((post) => (
                        <a
                          key={post.id}
                          href="/forum"
                          className="block p-2.5 rounded-xl border border-gray-100 bg-slate-50/60 hover:bg-blue-50/30 hover:border-blue-200 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
                              {post.category}
                            </span>
                            <span className="text-[9px] text-gray-400 font-semibold">👍 {post.votes} {t.votesLabel}</span>
                          </div>
                          <p className="font-bold text-slate-800 leading-snug line-clamp-1">{post.title}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-gray-400">
                            <img src={post.authorPhoto || 'https://placehold.co/100x100/1e293b/fff?text=U'} alt={post.authorName} className="w-3.5 h-3.5 rounded-full object-cover" />
                            <span className="font-semibold text-gray-500">{post.authorName}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: FORECAST (PRAKIRAAN MINGGUAN) */}
        {activeTab === 'forecast' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-blue-800 uppercase tracking-wider">{t.forecastDetailTitle}</h2>
            {forecast.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-8">{t.forecastSearchPlaceholder}</p>
            ) : (
              <div className="space-y-2.5">
                {forecast.map((day, idx) => {
                  const localizedDayName = day.dayName === 'Hari ini'
                    ? (t.todayLabel || 'Hari ini')
                    : new Date(day.date).toLocaleDateString(getLocaleForLanguage(language), { weekday: 'short' });
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedForecastIndex(idx)}
                      className={`w-full text-left bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-4 transition-all ${selectedForecastIndex === idx ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/10' : 'border-gray-150 hover:bg-gray-50'}`}
                    >
                      <div className="w-12">
                        <p className="text-xs font-bold text-slate-700 leading-tight">{localizedDayName}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{day.date}</p>
                      </div>
                      <WeatherIcon code={day.icon} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 capitalize leading-tight">{getLocalizedDesc(day)}</p>
                        {day.precip_prob > 0 && (
                          <p className="text-[9px] text-blue-500 font-medium mt-0.5">💧 {t.rainChance}: {day.precip_prob}%</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-800">{Math.round(day.high)}°</p>
                        <p className="text-[10px] text-gray-400">{Math.round(day.low)}°</p>
                      </div>
                    </button>
                  );
                })}

                {/* Selected day detailed card */}
                <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md space-y-2 text-left">
                  <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">{t.selectedDetailTitle}</p>
                  <h3 className="text-sm font-black">
                    {forecast[selectedForecastIndex].dayName === 'Hari ini'
                      ? (t.todayLabel || 'Hari ini')
                      : new Date(forecast[selectedForecastIndex].date).toLocaleDateString(getLocaleForLanguage(language), { weekday: 'short' })}
                    , {new Date(forecast[selectedForecastIndex].date).toLocaleDateString(getLocaleForLanguage(language), { dateStyle: 'long' })}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-white/5 rounded-xl p-2">
                      <p className="text-[9px] text-slate-400">{t.tempMax}</p>
                      <p className="text-sm font-black text-white">{Math.round(forecast[selectedForecastIndex].high)}°C</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2">
                      <p className="text-[9px] text-slate-400">{t.tempMin}</p>
                      <p className="text-sm font-black text-white">{Math.round(forecast[selectedForecastIndex].low)}°C</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2">
                      <p className="text-[9px] text-slate-400">{t.windSpeedLabel}</p>
                      <p className="text-sm font-black text-white">{forecast[selectedForecastIndex].wind_speed} m/s</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 capitalize pt-1">
                    {t.conditionPred}: {getLocalizedDesc(forecast[selectedForecastIndex])}.{' '}
                    {forecast[selectedForecastIndex].precip_prob > 0
                      ? (t.rainChanceText || 'Terdapat peluang curah hujan sebesar {prob}%.').replace('{prob}', forecast[selectedForecastIndex].precip_prob.toString())
                      : (t.dryCondText || 'Kondisi kering tanpa ada potensi hujan.')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INTERACTIVE WEATHER MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-blue-800 uppercase tracking-wider">{t.interactiveMapTitle}</h2>
            <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm aspect-video w-full relative">
              {weather ? (
                <iframe
                  title={t.radarMapFrameTitle}
                  src={`https://embed.windy.com/embed2.html?lat=${weather.lat}&lon=${weather.lon}&zoom=7&level=surface&overlay=rain&menu=&message=true&marker=true&calendar=now&pressure=true&type=map&location=coordinates&detail=true&metricWind=m%2Fs&metricTemp=%C2%B0C&radarRange=-1`}
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-xs text-gray-400">
                  {t.mapSearchPrompt}
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed text-justify">
              {t.mapDesc}
            </p>
          </div>
        )}

        {/* TAB 4: COMMUNITY REPORTS & PHOTO UPLOAD */}
        {activeTab === 'community' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-blue-800 uppercase tracking-wider">{t.commReportTitle}</h2>

            {/* Form */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3 text-left">
              <p className="text-xs font-bold text-slate-700">{t.sendReportTitle}</p>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder={t.cityPlaceholder}
                  value={reportForm.city}
                  onChange={e => setReportForm(p => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                  value={reportForm.condition}
                  onChange={e => setReportForm(p => ({ ...p, condition: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">{t.selectCondition}</option>
                  <option value="clear">{t.cond_clear}</option>
                  <option value="cloudy">{t.cond_cloudy}</option>
                  <option value="drizzle">{t.cond_drizzle}</option>
                  <option value="heavy_rain">{t.cond_heavy_rain}</option>
                  <option value="thunderstorm">{t.cond_thunderstorm}</option>
                  <option value="foggy">{t.cond_foggy}</option>
                </select>
              </div>

              <input
                type="text"
                placeholder={t.notePlaceholder}
                value={reportForm.note}
                onChange={e => setReportForm(p => ({ ...p, note: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              {/* Photo Upload selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">{t.addPhotoLabel}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {reportPhoto && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img src={reportPhoto} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setReportPhoto('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
                  </div>
                )}
              </div>

              <button
                onClick={submitReport}
                disabled={!reportForm.city || !reportForm.condition}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50"
              >
                {reportSubmitted ? t.reportSent : t.sendGetXP}
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {communityReports.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-6">{t.noReports}</p>
              ) : communityReports.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-150 shadow-sm text-left flex gap-3">
                  <span className="text-3xl shrink-0">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-800">{r.city}</p>
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{getConditionLabel(r.condition, language)}</span>
                    </div>
                    {r.note && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.note}</p>}
                    {r.photoUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 max-h-32 bg-slate-50">
                        <img src={r.photoUrl} alt="Laporan Langit" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-300">
                      <Clock size={9} />
                      <span>{new Date(r.timestamp).toLocaleString(getLocaleForLanguage(language), { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CALENDAR INTEGRATION & ACTIVITY PLANNER */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-blue-800 uppercase tracking-wider">{t.calendarTitle}</h2>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3 text-left">
              <p className="text-xs font-bold text-slate-700">{t.planSchedule}</p>
              <form onSubmit={addCalendarEvent} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t.activityPlaceholder}
                    value={newActivity.title}
                    onChange={e => setNewActivity(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                  <input
                    type="text"
                    placeholder={t.locationPlaceholder}
                    value={newActivity.location}
                    onChange={e => setNewActivity(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newActivity.time}
                    onChange={e => setNewActivity(p => ({ ...p, time: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                  <button
                    type="submit"
                    className="flex-grow py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    {t.addScheduleBtn}
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-2.5 text-left">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.agendaTitle}</p>
              {activities.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-4 bg-white rounded-2xl border border-gray-100">{t.noAgenda}</p>
              ) : activities.map((act, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-150 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{getLocalizedActivityTitle(act.title, language)}</h4>
                      <p className="text-[9px] text-gray-400 mt-0.5">📍 {act.location} • ⏰ {t.timeLabel} {act.time}</p>
                    </div>
                    <button
                      onClick={() => {
                        const next = activities.filter((_, i) => i !== idx);
                        setActivities(next);
                        localStorage.setItem('cuaca_activities', JSON.stringify(next));
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title={t.deleteAgenda}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="border-t border-gray-50 pt-2 text-[10px] text-blue-700 font-bold leading-relaxed">
                    {getCalendarAdvice(act)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: EARTH MONITORING & TEWS DASHBOARD */}
        {activeTab === 'disaster' && (
          <div className="space-y-4 text-left">
            {/* Sub-tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-150">
              {[
                { key: 'quake', label: d.tabQuake },
                { key: 'hotspots', label: d.tabHotspots },
                { key: 'rain', label: d.tabRain },
                { key: 'volcano', label: d.tabVolcano },
                { key: 'enso', label: d.tabEnso },
              ].map(sub => (
                <button
                  key={sub.key}
                  onClick={() => setDisasterSubTab(sub.key as any)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black shrink-0 transition-all ${disasterSubTab === sub.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* PETA PANTAUAN SATELIT & SEISMIK - restored Leaflet-based satellite map */}
            {(disasterSubTab === 'quake' || disasterSubTab === 'hotspots' || disasterSubTab === 'rain' || disasterSubTab === 'volcano') && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d.mapTitle}</p>
                <EarthMonitoringMap
                  type={disasterSubTab as any}
                  quakeData={quakes}
                  hotspotData={hotspots}
                  volcanoData={magma?.vona || []}
                  centerLatLng={mapCenter}
                />
              </div>
            )}

            {/* Sub-tab 1: Gempa Bumi */}
            {disasterSubTab === 'quake' && (
              <div className="space-y-3">
                {/* Search & Filter */}
                <div className="bg-white rounded-2xl p-4 border border-gray-150 shadow-sm space-y-3">
                  <p className="text-xs font-bold text-slate-700">{d.quakeFilter}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{d.quakeMinMag}</label>
                      <select
                        value={quakeMinMag}
                        onChange={e => setQuakeMinMag(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-gray-50 focus:outline-none"
                      >
                        <option value="1.0">M &ge; 1.0</option>
                        <option value="3.0">M &ge; 3.0</option>
                        <option value="4.5">M &ge; 4.5</option>
                        <option value="5.0">M &ge; 5.0</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{d.quakeScope}</label>
                      <select
                        value={quakeScope}
                        onChange={e => setQuakeScope(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-gray-50 focus:outline-none"
                      >
                        <option value="indonesia">Indonesia</option>
                        <option value="all">{d.scopeAll}</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={fetchQuakes}
                    disabled={quakesLoading}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {quakesLoading ? <RefreshCw size={12} className="animate-spin" /> : d.btnFilter}
                  </button>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded-xl p-2.5 border border-gray-150 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{d.totalQuakes}</p>
                    <p className="text-lg font-black text-blue-600 mt-0.5">{quakes.length}</p>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 border border-gray-150 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{d.maxMag}</p>
                    <p className="text-lg font-black text-red-500 mt-0.5">
                      {quakes.length > 0 ? Math.max(...quakes.map(q => q.magnitude)).toFixed(1) : '-'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 border border-gray-150 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{d.tsunamiPotential}</p>
                    <p className="text-lg font-black text-amber-500 mt-0.5">
                      {quakes.filter(q => q.tsunami === 1 || q.tsunamiPotential?.toLowerCase().includes('tsunami')).length}
                    </p>
                  </div>
                </div>

                {/* Earthquake List */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">📋 {d.quakeListTitle}</p>
                  {quakesLoading ? (
                    <div className="text-center py-6"><RefreshCw size={20} className="animate-spin text-blue-500 mx-auto" /></div>
                  ) : quakes.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">{d.noQuakes}</p>
                  ) : (
                    quakes.slice(0, 15).map((q: any) => {
                      const color = q.magnitude >= 5.0 ? 'border-red-500 bg-red-50/10' : q.magnitude >= 4.0 ? 'border-amber-500 bg-amber-50/10' : 'border-blue-500 bg-blue-50/10';
                      return (
                        <div key={q.id} className={`p-3 rounded-2xl border shadow-sm ${color} flex items-start gap-3`}>
                          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-white">{q.magnitude.toFixed(1)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-slate-800 truncate">{q.place || q.region}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {d.depthLabel}: {q.depth} km &bull; {q.time ? new Date(q.time).toLocaleString(getLocaleForLanguage(language), { dateStyle: 'medium', timeStyle: 'short' }) : q.dateTime || '-'}
                            </p>
                            {q.tsunami === 1 && (
                              <span className="inline-block bg-red-100 text-red-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 border border-red-200 uppercase tracking-wider animate-pulse">
                                🚨 {d.tsunamiWarning}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Titik Api (NASA FIRMS Hotspots) */}
            {disasterSubTab === 'hotspots' && (
              <div className="space-y-4">
                {/* Control Panel */}
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100">
                    <span className="text-lg">🔥</span>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{d.hotspotTitle}</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider">{d.regionLabel}</label>
                      <select
                        value={hotspotCountry}
                        onChange={e => {
                          setHotspotCountry(e.target.value as any);
                          setHotspots([]); // Clear so loading animation triggers
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-gray-200 text-[10px] font-bold bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="IDN">🇮🇩 Indonesia</option>
                        <option value="world">🌐 Global</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider">{d.satelliteLabel}</label>
                      <select
                        value={hotspotSatellite}
                        onChange={e => {
                          setHotspotSatellite(e.target.value as any);
                          setHotspots([]);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-gray-200 text-[10px] font-bold bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="VIIRS_SNPP_NRT">🛰️ VIIRS (SNPP)</option>
                        <option value="MODIS_NRT">🛰️ MODIS (Terra/Aqua)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider">{d.timeframeLabel}</label>
                      <select
                        value={hotspotRange}
                        onChange={e => {
                          setHotspotRange(e.target.value);
                          setHotspots([]);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-gray-200 text-[10px] font-bold bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="1">{d.last24h}</option>
                        <option value="2">{d.last48h}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dashboard Metrics */}
                {hotspotsLoading ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
                    <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{d.nasaConnecting}</p>
                  </div>
                ) : hotspots.length === 0 ? (
                  <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-sm">
                    <span className="text-3xl block mb-2">🌴</span>
                    <p className="text-xs text-gray-500 font-bold leading-relaxed">
                      {d.nasaSafe}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Metrics Grid */}
                    {hotspotStats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                          <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">{d.totalHotspots}</p>
                          <p className="text-xl font-black text-red-500 mt-1">{hotspotStats.count} {d.points}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                          <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">{d.avgFrp}</p>
                          <p className="text-xl font-black text-amber-600 mt-1">{hotspotStats.avgFrp.toFixed(1)} MW</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                          <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">{d.maxFrp}</p>
                          <p className="text-xl font-black text-red-600 mt-1">{hotspotStats.maxFrp.toFixed(1)} MW</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                          <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">{d.dayNightCond}</p>
                          <p className="text-xs font-black text-slate-700 mt-1.5">
                            ☀️ {hotspotStats.dayCount} {d.day} &bull; 🌙 {hotspotStats.nightCount} {d.night}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Additional Stats Dashboard */}
                    {hotspotStats && (
                      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-2 text-xs">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">📊 {d.confidenceAnalysis}</p>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className="bg-red-50 text-red-700 p-2 rounded-xl border border-red-100 font-bold">
                            {d.confHigh}: {hotspotStats.highConf}
                          </div>
                          <div className="bg-amber-50 text-amber-700 p-2 rounded-xl border border-amber-100 font-bold">
                            {d.confNominal}: {hotspotStats.nominalConf}
                          </div>
                          <div className="bg-blue-50 text-blue-700 p-2 rounded-xl border border-blue-100 font-bold">
                            {d.confLow}: {hotspotStats.lowConf}
                          </div>
                        </div>

                        {/* Hottest Point details */}
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/50 mt-2 space-y-1">
                          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">📍 {d.hottestPoint}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-600">
                            <span>{d.coordinates}: <strong>{hotspotStats.maxFrpLat.toFixed(4)}&deg;S, {hotspotStats.maxFrpLon.toFixed(4)}&deg;E</strong></span>
                            <span>{d.detection}: UTC {hotspotStats.maxFrpDate} {hotspotStats.maxFrpTime}</span>
                          </div>
                        </div>

                        {/* Download button */}
                        <div className="pt-2">
                          <button
                            onClick={downloadHotspotReport}
                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            📥 {d.downloadHotspotReportBtn}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Interactive Hotspot List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">📋 {d.hotspotListTitle} ({hotspots.length} {d.points})</p>
                        <p className="text-[8px] text-blue-500 font-semibold italic">* {d.clickToFocusMap}</p>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {hotspots.slice(0, 50).map((fire: any, idx: number) => {
                          const conf = String(fire.confidence).toLowerCase();
                          const isHigh = conf === 'h' || conf === 'high' || parseInt(conf) >= 80;
                          const isLow = conf === 'l' || conf === 'low' || parseInt(conf) < 30;
                          const confLabel = isHigh ? d.confHigh : isLow ? d.confLow : d.confNominal;
                          const confBadge = isHigh ? 'bg-red-100 text-red-700' : isLow ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setMapCenter([fire.latitude, fire.longitude]);
                                // Scroll to map container
                                const mapEl = document.querySelector('.leaflet-container');
                                if (mapEl) {
                                  mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="w-full bg-white hover:bg-slate-50 transition-all rounded-2xl p-3 border border-gray-150 shadow-sm flex justify-between items-start gap-2 text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                                  <span>📍</span> {fire.latitude.toFixed(4)}&deg;, {fire.longitude.toFixed(4)}&deg;
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-500 flex-wrap">
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0">
                                    {fire.satellite || 'VIIRS'}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${confBadge}`}>
                                    Conf: {confLabel}
                                  </span>
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0">
                                    {fire.daynight === 'D' ? `☀️ ${d.day}` : `🌙 ${d.night}`}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[9px] font-black">
                                  {fire.frp.toFixed(1)} MW
                                </span>
                                <p className="text-[8px] text-gray-400 mt-1">UTC {fire.acq_date} {fire.acq_time}</p>
                              </div>
                            </button>
                          );
                        })}
                        {hotspots.length > 50 && (
                          <p className="text-center text-[10px] text-gray-400 font-semibold py-2 bg-gray-50 rounded-xl border border-gray-150">
                            {d.showingHotspots.replace('{total}', hotspots.length.toString())}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Sub-tab 3: Curah Hujan & Banjir (NASA GPM & GFMS) */}
            {disasterSubTab === 'rain' && (
              <div className="space-y-4">
                {/* Control Panel */}
                <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">🌧️</span>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{d.rainTitle}</h4>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase animate-pulse">
                      {language === 'id' || language === 'ms' ? 'Layer Peta Aktif' : language === 'zh' ? '活动地图图层' : language === 'ja' ? 'アクティブマップレイヤー' : 'Active Map Layer'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider">{language === 'id' || language === 'ms' ? 'Wilayah Pemantauan' : language === 'zh' ? '监测区域' : language === 'ja' ? '監視地域' : 'Monitoring Region'}</label>
                      <select
                        value={rainRegion}
                        onChange={e => {
                          const val = e.target.value as 'IDN' | 'world';
                          setRainRegion(val);
                          if (val === 'IDN') {
                            setMapCenter([-2.5, 118.0]);
                          } else {
                            setMapCenter([20.0, 0.0]);
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-gray-200 text-[10px] font-bold bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="IDN">🇮🇩 Indonesia</option>
                        <option value="world">{d.scopeAll}</option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        onClick={downloadRainReport}
                        className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        📥 {d.downloadRainReportBtn}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                    <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">{d.dailyRainStatus}</p>
                    <p className="text-base font-black text-blue-600 mt-1">18.5 mm ({d.avgLabel})</p>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                    <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">{d.maxRainRate}</p>
                    <p className="text-base font-black text-amber-600 mt-1">35.0 mm/jam</p>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                    <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">{d.floodRisk}</p>
                    <p className="text-base font-black text-red-500 mt-1">
                      {rainRegion === 'IDN'
                        ? (language === 'id' || language === 'ms' ? '2 Area Severe' : language === 'zh' ? '2个重度风险区' : language === 'ja' ? '2箇所重度リスク' : '2 Severe Areas')
                        : (language === 'id' || language === 'ms' ? '1 Area Extreme' : language === 'zh' ? '1个极度风险区' : language === 'ja' ? '1箇所極度リスク' : '1 Extreme Area')}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                    <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">{language === 'id' || language === 'ms' ? 'Satelit Misi' : language === 'zh' ? '任务卫星' : language === 'ja' ? 'ミッション衛星' : 'Mission Satellite'}</p>
                    <p className="text-xs font-black text-slate-700 mt-2">
                      🛰️ NASA GPM IMERG
                    </p>
                  </div>
                </div>

                {/* Flood Warning Events list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">🚨 {d.floodWarningTitle}</p>
                    <p className="text-[8px] text-blue-500 font-semibold italic">* {d.clickToFocusMap}</p>
                  </div>

                  <div className="space-y-2">
                    {(rainRegion === 'IDN'
                      ? [
                        { loc: 'Luwu, Sulawesi Selatan', lat: -3.1, lon: 120.3, rate: 35, rain: 210, severity: 'Severe', status: d.floodWarningLuwu },
                        { loc: 'Demak, Jawa Tengah', lat: -6.9, lon: 110.6, rate: 22, rain: 180, severity: 'Severe', status: d.floodWarningDemak },
                        { loc: 'Jakarta (Pesisir & DAS Ciliwung)', lat: -6.2, lon: 106.8, rate: 12, rain: 120, severity: 'Moderate', status: d.floodWarningJakarta }
                      ]
                      : [
                        { loc: 'Assam, India (DAS Brahmaputra)', lat: 26.1, lon: 91.7, rate: 45, rain: 310, severity: 'Extreme', status: d.floodWarningAssam },
                        { loc: 'Rio Grande do Sul, Brasil', lat: -30.0, lon: -51.2, rate: 28, rain: 220, severity: 'Severe', status: d.floodWarningBrazil }
                      ]
                    ).map((event, idx) => {
                      const colorBadge = event.severity === 'Extreme' ? 'bg-purple-100 text-purple-700' : event.severity === 'Severe' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setMapCenter([event.lat, event.lon]);
                            const mapEl = document.querySelector('.leaflet-container');
                            if (mapEl) {
                              mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                          className="w-full bg-white hover:bg-slate-50 transition-all rounded-2xl p-3.5 border border-gray-150 shadow-sm flex justify-between items-start gap-2 text-left"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                              <span>🌊</span> {event.loc}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1 leading-snug">
                              {language === 'id' || language === 'ms' ? 'Status' : language === 'zh' ? '预警状态' : language === 'ja' ? 'ステータス' : 'Status'}: <strong>{event.status}</strong><br />
                              {d.coordinates}: {event.lat.toFixed(2)}&deg;, {event.lon.toFixed(2)}&deg;
                            </p>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${colorBadge}`}>
                              {event.severity}
                            </span>
                            <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold border border-slate-100">
                              {language === 'id' || language === 'ms' ? 'Hujan' : language === 'zh' ? '累计降水' : language === 'ja' ? '降水量' : 'Precip'}: {event.rain} mm
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-[10px] text-slate-500 leading-relaxed text-justify space-y-1">
                  <p><strong>{d.aboutGpmTitle}</strong></p>
                  <p>
                    {language === 'id' || language === 'ms' ? 'Data presipitasi real-time diperoleh setiap 30 menit dari satelit GPM (Global Precipitation Measurement) Core Observatory. Laju presipitasi diintegrasikan ke sistem hidrologi GFMS (Global Flood Monitoring System) milik Universitas Maryland dan NASA untuk mensimulasikan limpasan air permukaan dan memprediksi luapan sungai penyebab banjir secara global.' :
                      language === 'zh' ? '实时降水数据每 30 分钟自 GPM（全球降水测量）核心观测卫星获取一次。降水率被整合到马里兰大学和 NASA 的 GFMS（全球洪水监测系统）水文系统中，以模拟地表径流并预测全球范围内导致洪水的河流泛滥。' :
                        language === 'ja' ? 'リアルタイム降水データは、GPM（全球降水観測計画）主衛星から30分ごとに取得されます。降水強度はメリーランド大学とNASAのGFMS（全球洪水監視システム）水文モデルに統合され、地表流出をシミュレートし、世界中の洪水原因となる河川溢水を予測します。' :
                          language === 'ru' ? 'Данные об осадках в реальном времени поступают каждые 30 минут со спутника GPM (Global Precipitation Measurement) Core Observatory. Скорость осадков интегрируется в гидрологическую модель GFMS (Global Flood Monitoring System) Мэрилендского университета и NASA для моделирования поверхностного стока и прогнозирования наводнений по всему миру.' :
                            language === 'fr' ? 'Les données de précipitation en temps réel sont obtenues toutes les 30 minutes depuis le satellite GPM (Global Precipitation Measurement) Core Observatory. Le taux de précipitation est intégré dans le modèle hydrologique GFMS (Global Flood Monitoring System) de l\'Université du Maryland et de la NASA pour simuler le ruissellement de surface et prédire les crues des rivières à l\'échelle mondiale.' :
                              'Real-time precipitation data is obtained every 30 minutes from the GPM (Global Precipitation Measurement) Core Observatory satellite. The precipitation rate is integrated into the GFMS (Global Flood Monitoring System) hydrological model owned by the University of Maryland and NASA to simulate surface water runoff and predict river flooding globally.'}
                  </p>
                </div>
              </div>
            )}

            {/* Sub-tab 4: Gunung Api (MAGMA Indonesia) */}
            {disasterSubTab === 'volcano' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 border border-gray-150 shadow-sm space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">{d.magmaReportTitle}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {d.magmaReportDesc}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">🚨 {d.latestVonaTitle}</p>
                  {magmaLoading ? (
                    <div className="text-center py-6"><RefreshCw size={20} className="animate-spin text-blue-500 mx-auto" /></div>
                  ) : magma.vona.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">{d.magmaVolcanoQuiet}</p>
                  ) : (
                    magma.vona.map((v: any, idx: number) => {
                      const color = v.current_code === 'RED' ? 'border-red-500 bg-red-50/10 text-red-700' : 'border-orange-500 bg-orange-50/10 text-orange-700';
                      return (
                        <div key={idx} className={`p-4 rounded-2xl border shadow-sm ${color} space-y-2`}>
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black">🌋 {d.mountLabel} {v.volcano_name}</h4>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                              {v.current_code} CODE
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-relaxed">
                            <strong>{d.volcanoActivity}:</strong> {v.volcanic_activity_summary}
                          </p>
                          <p className="text-[10px] text-slate-500 italic">
                            <strong>{d.ashCloud}:</strong> {v.ash_cloud}
                          </p>
                          <div className="text-[8px] text-gray-400 flex justify-between border-t border-gray-100 pt-1.5 mt-1.5">
                            <span>Notice: {v.notice_number}</span>
                            <span>{d.issuedLabel}: {new Date(v.issued_time).toLocaleString(getLocaleForLanguage(language), { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 5: Iklim ENSO */}
            {disasterSubTab === 'enso' && (
              <div className="space-y-4">
                {enso ? (
                  <div className="space-y-4">
                    <div className={`rounded-3xl p-5 border shadow-sm space-y-3 ${enso.status === 'El Niño' ? 'bg-red-50/40 border-red-200' :
                      enso.status === 'La Niña' ? 'bg-blue-50/40 border-blue-200' :
                        'bg-green-50/40 border-green-200'
                      }`}>
                      <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg">🌊</span>
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{d.ensoStatusTitle}</h4>
                        </div>
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${enso.status === 'El Niño' ? 'bg-red-100 text-red-700' :
                          enso.status === 'La Niña' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                          {getLocalizedEnsoStatus(enso.status, language)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {getLocalizedEnsoDesc(enso.status, enso.oni, language)}
                      </p>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        <div className="bg-white/70 rounded-xl p-2.5 border border-gray-100 shadow-sm">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">{d.oniIndexLabel}</p>
                          <p className="text-sm font-black text-blue-700 mt-0.5">
                            {enso.oni >= 0 ? '+' : ''}{enso.oni.toFixed(2)} &deg;C
                          </p>
                        </div>
                        <div className="bg-white/70 rounded-xl p-2.5 border border-gray-100 shadow-sm">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">{d.ninoAnomalyLabel}</p>
                          <p className="text-sm font-black text-blue-700 mt-0.5">
                            {enso.nino34_anomaly >= 0 ? '+' : ''}{enso.nino34_anomaly.toFixed(2)} &deg;C
                          </p>
                        </div>
                        <div className="bg-white/70 rounded-xl p-2.5 border border-gray-100 shadow-sm">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">{d.sstLabel}</p>
                          <p className="text-sm font-black text-blue-700 mt-0.5">{enso.nino34_sst.toFixed(2)} &deg;C</p>
                        </div>
                      </div>
                    </div>

                    {/* SVG Chart */}
                    {renderEnsoChart(enso.history)}

                    {/* Forecast seasonal transitions */}
                    {enso.forecasts && enso.forecasts.length > 0 && (
                      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3 text-xs">
                        <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">🔮 {d.seasonalTransitionTitle}</p>
                        <div className="grid grid-cols-1 gap-2">
                          {enso.forecasts.map((f: any, idx: number) => {
                            const isElNino = f.dominant === 'El Niño';
                            const isLaNina = f.dominant === 'La Niña';
                            const color = isElNino
                              ? 'text-red-700 bg-red-50/50 border-red-100'
                              : isLaNina
                                ? 'text-blue-700 bg-blue-50/50 border-blue-100'
                                : 'text-green-700 bg-green-50/50 border-green-100';
                            const prob = isElNino ? f.elNino : isLaNina ? f.laNina : f.neutral;

                            const localizedDominant = getLocalizedEnsoStatus(f.dominant, language);

                            return (
                              <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-[10px] ${color}`}>
                                <span className="font-extrabold">{getPeriodLabel(f.period, language)}</span>
                                <div className="text-right">
                                  <span className="font-black">{d.dominantLabel}: {localizedDominant} ({prob}%)</span>
                                  <p className="text-[8px] text-gray-500 mt-0.5">
                                    {d.probLabel} &mdash; El Niño: {f.elNino}% | La Niña: {f.laNina}% | {d.neutralLabel}: {f.neutral}%
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dampak Regional & Global */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3 text-xs">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-gray-100">
                        <span className="text-lg">🌪️</span>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{d.ensoImpactTitle}</h4>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-2xl border border-red-150 bg-red-50/20 space-y-1">
                          <p className="font-extrabold text-red-700 uppercase text-[9px] tracking-wider">{d.elNinoImpactTitle}</p>
                          <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-1 ml-1">
                            {language === 'id' || language === 'ms' ? (
                              <>
                                <li><strong>Indonesia/Malaysia:</strong> Kekeringan parah, penurunan curah hujan drastis, risiko tinggi kebakaran hutan, penurunan debit waduk, serta gagal panen.</li>
                                <li><strong>Global:</strong> Rata-rata suhu global memanas, memicu badai hebat di Pasifik tengah, dan kekeringan di Australia bagian utara.</li>
                              </>
                            ) : language === 'zh' ? (
                              <>
                                <li><strong>印度尼西亚/马来西亚:</strong> 严重干旱、降雨量急剧减少、森林火灾风险高、水库蓄水量下降以及作物歉收。</li>
                                <li><strong>全球:</strong> 全球平均气温上升，引发中太平洋的强风暴，以及澳大利亚北部干旱。</li>
                              </>
                            ) : language === 'ja' ? (
                              <>
                                <li><strong>インドネシア/マレーシア:</strong> 深刻な干ばつ、降水量の激減、森林火災の高リスク、ダム貯水量の低下、作物の凶作。</li>
                                <li><strong>全球:</strong> 世界平均気温が上昇し、中部太平洋で猛烈な嵐が発生、オーストラリア北部で干ばつが発生。</li>
                              </>
                            ) : language === 'ru' ? (
                              <>
                                <li><strong>Индонезия/Малайзия:</strong> Сильная засуха, резкое сокращение количества осадков, высокий риск лесных пожаров, снижение уровня воды в водохранилищах и неурожай.</li>
                                <li><strong>Глобальный:</strong> Средняя мировая температура повышается, вызывая сильные штормы в центральной части Тихого океана и засуху на севере Австралии.</li>
                              </>
                            ) : language === 'fr' ? (
                              <>
                                <li><strong>Indonésie/Malaisie :</strong> Sécheresse sévère, baisse drastique des précipitations, risque élevé de feux de forêt, baisse des niveaux des réservoirs et mauvaises récoltes.</li>
                                <li><strong>Global :</strong> Réchauffement de la température mondiale moyenne, déclenchement de tempêtes majeures dans le Pacifique central et sécheresse dans le nord de l'Australie.</li>
                              </>
                            ) : (
                              <>
                                <li><strong>Indonesia/Malaysia:</strong> Severe drought, drastic drop in precipitation, high forest fire risks, dropping reservoir levels, and crop failures.</li>
                                <li><strong>Global:</strong> Warming average global temperatures, triggering intense storms in central Pacific, and drought in northern Australia.</li>
                              </>
                            )}
                          </ul>
                        </div>

                        <div className="p-3 rounded-2xl border border-blue-150 bg-blue-50/20 space-y-1">
                          <p className="font-extrabold text-blue-700 uppercase text-[9px] tracking-wider">{d.laNinaImpactTitle}</p>
                          <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-1 ml-1">
                            {language === 'id' || language === 'ms' ? (
                              <>
                                <li><strong>Indonesia/Malaysia:</strong> Peningkatan curah hujan di atas normal, potensi banjir bandang/longsor masal, kerusakan infrastruktur sipil, dan cuaca lembab ekstrem.</li>
                                <li><strong>Global:</strong> Musim dingin ekstrem di Amerika Utara bagian utara, kekeringan parah di Brazil selatan dan Argentina.</li>
                              </>
                            ) : language === 'zh' ? (
                              <>
                                <li><strong>印度尼西亚/马来西亚:</strong> 降雨量高于常年、潜在山洪/大规模滑坡风险、民用基础设施受损以及极端的潮湿天气。</li>
                                <li><strong>全球:</strong> 北美北部冬季极寒，巴西南部和阿根廷严重干旱。</li>
                              </>
                            ) : language === 'ja' ? (
                              <>
                                <li><strong>インドネシア/マレーシア:</strong> 平年以上の降雨量の増加、鉄砲水・大規模な土砂崩れの危険性、民間インフラ의 피해, 극단적인 다습 기후.</li>
                                <li><strong>全球:</strong> 北米北部での厳しい冬、ブラジル南部やアルゼンチンでの深刻な干ばつ。</li>
                              </>
                            ) : language === 'ru' ? (
                              <>
                                <li><strong>Индонезия/Малайзия:</strong> Превышение нормы осадков, угроза внезапных наводнений и оползней, повреждение гражданской инфраструктуры и экстремально влажная погода.</li>
                                <li><strong>Глобальный:</strong> Суровая зима на севере Северной Америки, сильная засуха на юге Бразилии и в Аргентине.</li>
                              </>
                            ) : language === 'fr' ? (
                              <>
                                <li><strong>Indonésie/Malaisie :</strong> Précipitations supérieures à la normale, risques d'inondations soudaines et de glissements de terrain massifs, dégâts aux infrastructures civiles et humidité extrême.</li>
                                <li><strong>Global :</strong> Hiver rigoureux dans le nord de l'Amérique du Nord, sécheresse sévère dans le sud du Brésil et en Argentine.</li>
                              </>
                            ) : (
                              <>
                                <li><strong>Indonesia/Malaysia:</strong> Above-normal rainfall increase, flash floods/landslides risks, damage to civil infrastructures, and extreme humid conditions.</li>
                                <li><strong>Global:</strong> Severe winters in northern North America, severe droughts in southern Brazil and Argentina.</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Monthly History list */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">📋 {d.oniHistoryTitle}</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {enso.history.slice(-12).reverse().map((h: any, idx: number) => {
                          const statusColor = h.oniStatus === 'El Niño'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : h.oniStatus === 'La Niña'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-green-50 text-green-700 border-green-100';

                          const periodText = `${getHistoryMonthName(h.month, language)} ${h.year}`;
                          const localizedStatus = getLocalizedEnsoStatus(h.oniStatus, language);

                          return (
                            <div key={idx} className="bg-white rounded-2xl p-3 border border-gray-150 shadow-sm flex justify-between items-center text-xs">
                              <div>
                                <p className="font-black text-slate-800">{periodText}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">SST Niño 3.4: {h.sst.toFixed(2)}°C ({d.anomalyLabel.toLowerCase()}: {h.anomaly >= 0 ? '+' : ''}{h.anomaly.toFixed(2)}°C)</p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-[9px] font-extrabold border border-slate-100">
                                  ONI: {h.oni >= 0 ? '+' : ''}{h.oni.toFixed(2)}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${statusColor}`}>
                                  {localizedStatus}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explanations */}
                    <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm space-y-2">
                      <h4 className="text-xs font-bold text-slate-700">{d.oniExplanationTitle}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed text-justify">
                        {d.oniExplanationDesc}
                      </p>
                    </div>

                    <div className="text-[9px] text-gray-400 flex justify-between pt-1">
                      <span>{d.currentPeriodLabel}: {enso.period}</span>
                      <span>{d.dataSourceLabel}: NOAA CPC</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8"><RefreshCw size={24} className="animate-spin text-blue-500 mx-auto" /></div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* TAB 7: DEDICATED DISASTER MAP - Full-featured MapLibre with measurements, sharing, ETA */}
      {activeTab === 'disasterMap' && (
        <div className="max-w-md mx-auto px-4 pt-2 pb-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">{t.tabDisasterMap || '🗺️ Peta Bencana Interaktif'}</h2>
            <span className="text-[9px] bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">MapLibre GL</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Peta interaktif dengan fitur ukur jarak, area poligon, buffer radius, estimasi rute &amp; ETA, pencarian POI, analisis ancaman otomatis, dan berbagi lokasi ke media sosial.
          </p>
          <MapLibreDisasterMap
            records={[
              ...quakes.slice(0, 80).map((q: any) => ({
                id: q.id || `q-${q.latitude}-${q.longitude}`,
                type: 'quake',
                title: `M ${q.magnitude} - ${q.place || q.region}`,
                location: q.place || q.region || 'Indonesia',
                latitude: parseFloat(q.latitude),
                longitude: parseFloat(q.longitude),
                severity: q.magnitude >= 6 ? 'CRITICAL' : q.magnitude >= 5 ? 'HIGH' : 'MODERATE',
                timestamp: q.time || q.dateTime || new Date().toISOString(),
                details: `Mag: ${q.magnitude} | Depth: ${q.depth} km`
              })),
              ...hotspots.slice(0, 80).map((h: any) => ({
                id: `hs-${h.latitude}-${h.longitude}`,
                type: 'hotspots',
                title: `Hotspot FRP: ${h.frp || 0} MW`,
                location: `Lat: ${h.latitude}, Lon: ${h.longitude}`,
                latitude: parseFloat(h.latitude),
                longitude: parseFloat(h.longitude),
                severity: (h.frp || 0) >= 50 ? 'HIGH' : 'MODERATE',
                timestamp: h.acq_date ? `${h.acq_date}T00:00:00Z` : new Date().toISOString(),
                details: `Satellite: ${h.satellite || 'VIIRS'} | Confidence: ${h.confidence || 'nominal'}`
              })),
              ...(magma?.vona || []).slice(0, 30).map((v: any) => ({
                id: `vol-${v.id || v.name}`,
                type: 'volcano',
                title: `Gunung ${v.name || v.volcano_name}`,
                location: v.name || v.volcano_name || 'Gunung Api',
                latitude: parseFloat(v.latitude || -7.54),
                longitude: parseFloat(v.longitude || 110.44),
                severity: v.kode === 'RED' ? 'CRITICAL' : v.kode === 'ORANGE' ? 'HIGH' : 'MODERATE',
                timestamp: v.issued || new Date().toISOString(),
                details: `Kode: ${v.kode || '-'} | Abu: ${v.ash_height || '-'}`
              }))
            ]}
            language={language}
            centerLatLng={mapCenter}
          />
          {/* Feature guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-600">
            <p className="font-black text-slate-700 uppercase tracking-wider text-[10px]">{t.guideTitle || '📖 Panduan Fitur'}</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-start gap-1.5"><span className="text-cyan-500">📏</span><span><strong>{t.guideDistTitle || 'Ukur Jarak'}:</strong> {t.guideDistDesc || 'Klik titik-titik di peta untuk mengukur jarak lintas waypoint.'}</span></div>
              <div className="flex items-start gap-1.5"><span className="text-cyan-500">📐</span><span><strong>{t.guideAreaTitle || 'Luas Area'}:</strong> {t.guideAreaDesc || 'Buat poligon dan hitung luas dalam km² dan hektar.'}</span></div>
              <div className="flex items-start gap-1.5"><span className="text-cyan-500">⭕</span><span><strong>{t.guideRadiusTitle || 'Buffer Radius'}:</strong> {t.guideRadiusDesc || 'Tentukan pusat & radius lingkaran, lihat objek di dalamnya.'}</span></div>
              <div className="flex items-start gap-1.5"><span className="text-amber-500">🛣️</span><span><strong>{t.guideETATitle || 'Rute & ETA'}:</strong> {t.guideETADesc || 'Hitung rute jalan kaki, mobil, sepeda via OSRM.'}</span></div>
              <div className="flex items-start gap-1.5"><span className="text-blue-500">🔍</span><span><strong>{t.guideSearchTitle || 'Cari Lokasi'}:</strong> {t.guideSearchDesc || 'Cari restoran, kantor, dan tempat via OpenStreetMap.'}</span></div>
              <div className="flex items-start gap-1.5"><span className="text-rose-500">📤</span><span><strong>{t.guideShareTitle || 'Berbagi'}:</strong> {t.guideShareDesc || 'WhatsApp, Telegram, Email, QR Code, dan lainnya.'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
