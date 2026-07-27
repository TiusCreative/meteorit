import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import type { ComponentType, FormEvent } from 'react';
import {
  Activity,
  AlertTriangle,
  CloudRain,
  Mountain,
  Radio,
  RefreshCw,
  Search,
  Share2,
  Sun,
  Thermometer,
  Wind,
  Zap,
  Eye,
  Sunset,
  Sunrise,
  Camera,
  X,
  Navigation,
  Gauge
} from 'lucide-react';
import { cityWeatherSimulator, reAtlasEnergyRegions, type NormalizedEarthquake } from '@/lib/earthMonitoring';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';

type TabId = 'quake' | 'weather' | 'energy';

interface QuakeResponse {
  updatedAt: string;
  earthquake: NormalizedEarthquake;
}

interface LocationMonitoringData {
  updatedAt: string;
  location: {
    label: string;
    latitude: number;
    longitude: number;
  };
  weather: {
    temp: number;
    humidity: number;
    condition: string;
    precipitation: number;
    rainProbability: number;
    rainIntensity: number;
  };
  energy: {
    wind: number;
    windDirection: number;
    solarRadiation: number;
  };
}

function getTemperatureColor(temp: number) {
  if (temp < 22) return 'from-sky-500 to-cyan-300';
  if (temp <= 30) return 'from-emerald-400 to-amber-300';
  return 'from-orange-500 to-red-500';
}

function getTemperatureLabel(temp: number, t: Record<string, string>) {
  if (temp < 22) return t.weatherTempCold || 'Dingin/Sejuk';
  if (temp <= 30) return t.weatherTempNormal || 'Normal';
  return t.weatherTempHot || 'Panas';
}

function getRainColor(rain: number) {
  if (rain < 30) return 'bg-emerald-400';
  if (rain <= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function getRainLabel(rain: number, t: Record<string, string>) {
  if (rain < 30) return t.weatherRainLow || 'Rendah';
  if (rain <= 60) return t.weatherRainMid || 'Sedang';
  return t.weatherRainHigh || 'Tinggi';
}

function getAstronomyTip(temp: number, rain: number, condition: string, t: Record<string, string>) {
  // We keep astronomy tips in the display language but the logic is universal
  if (temp <= 22 && rain < 30) {
    return `${t.weatherCondition}: ${temp}°C, ${condition.toLowerCase()}`;
  }
  if (rain > 60) return t.weatherRainHigh + ' — ' + condition;
  if (temp > 31) return t.weatherTempHot + ' — ' + condition;
  return condition;
}

function createShareUrls(text: string) {
  const url = typeof window !== 'undefined' ? window.location.href : 'https://meteorit.my.id';
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  return {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };
}

function ShareButtons({ text }: { text: string }) {
  const [urls, setUrls] = useState({ whatsapp: '#', telegram: '#', facebook: '#' });

  useEffect(() => {
    setUrls(createShareUrls(text));
  }, [text]);

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-slate-400">
        <Share2 className="h-3.5 w-3.5" />
        Share
      </span>
      <a href={urls.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-400/20">
        WhatsApp
      </a>
      <a href={urls.telegram} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[11px] font-bold text-sky-200 hover:bg-sky-400/20">
        Telegram
      </a>
      <a href={urls.facebook} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-[11px] font-bold text-blue-200 hover:bg-blue-400/20">
        Facebook
      </a>
    </div>
  );
}

function LocationSearch({ t, onResult }: { t: Record<string, string>; onResult: (data: LocationMonitoringData) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setMessage(t.weatherSearchMin || 'Masukkan minimal 3 karakter lokasi atau koordinat lengkap.');
      return;
    }

    setIsSearching(true);
    setMessage('');

    try {
      const response = await fetch(`/api/earth-monitoring/location?q=${encodeURIComponent(normalizedQuery)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || (t.weatherSearchFail || 'Lokasi belum dapat dimuat.'));
      }
      onResult(data);
      setMessage((t.weatherSearchSuccess || 'Data realtime untuk {label} berhasil dimuat.').replace('{label}', data.location.label));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : (t.weatherSearchFail || 'Gagal mencari lokasi.'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
      <label className="mb-2 block text-[11px] font-bold uppercase text-slate-400">{t.weatherSearchLabel || 'Cari alamat, kawasan, desa, kota, atau koordinat'}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.weatherSearchPlaceholder || 'Jababeka, Jl Sudirman Jakarta, Desa Cibatu, -6.2088, 106.8456'}
          className="min-h-10 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 text-xs font-black text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {t.weatherSearchBtn || 'Cari'}
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        {t.weatherSearchHint || 'Bisa pakai nama kawasan, jalan, desa/kelurahan, kecamatan, kota/kabupaten, atau titik koordinat latitude, longitude.'}
      </p>
      {message ? <p className="mt-2 text-[11px] text-slate-300">{message}</p> : null}
    </form>
  );
}

function ThermometerBar({ temp, t }: { temp: number; t: Record<string, string> }) {
  const width = Math.min(100, Math.max(8, (temp / 40) * 100));

  return (
    <div className="space-y-2">
      <div className="h-2.5 rounded-full bg-slate-950/80 border border-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getTemperatureColor(temp)} transition-all duration-500`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>0°C</span>
        <span className="text-slate-200">{getTemperatureLabel(temp, t)}</span>
        <span>40°C</span>
      </div>
    </div>
  );
}

function QuakePanel({ quake, isLoading, error, onRefresh, t }: {
  quake: NormalizedEarthquake | null;
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
  t: Record<string, string>;
}) {
  const hasTsunamiRisk = quake?.tsunamiPotential.toLowerCase().includes('berpotensi') && !quake?.tsunamiPotential.toLowerCase().includes('tidak');
  const magnitudeTone = quake && quake.magnitude >= 5 ? 'text-red-300 border-red-400/30 bg-red-500/10' : 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10';

  const language = useSiteLanguage();

  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!quake || !quake.coordinates) return;
    const parts = quake.coordinates.split(',');
    if (parts.length !== 2) return;
    const lat = parseFloat(parts[0].trim());
    const lon = parseFloat(parts[1].trim());
    if (isNaN(lat) || isNaN(lon)) return;

    setWeatherLoading(true);
    fetch(`/api/nasa/openweather?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&lang=${language}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setWeather(json.data);
        }
      })
      .catch((err) => console.error('Error fetching earthquake weather:', err))
      .finally(() => setWeatherLoading(false));
  }, [quake, language]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-cyan-200">{t.quakePanelSub || 'Live JSON BMKG TEWS'}</p>
          <h3 className="text-xl font-black text-white">{t.quakePanelTitle || 'Gempa Bumi Terkini'}</h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-200 hover:bg-cyan-400/10"
          title={t.quakeRefreshTitle || 'Muat ulang data BMKG'}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 ${magnitudeTone}`}>
          <p className="text-xs text-slate-300">{t.quakeMagnitude || 'Magnitudo'}</p>
          <p className="text-3xl font-black">{quake ? `M ${quake.magnitude.toFixed(1)}` : '--'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs text-slate-400">{t.quakeDepth || 'Kedalaman'}</p>
          <p className="text-2xl font-black text-white">{quake?.depth || '--'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-1 text-xs text-slate-400">{t.quakeRegion || 'Wilayah'}</p>
        <p className="text-sm font-semibold leading-relaxed text-slate-100">{quake?.region || (t.quakeLoadingRegion || 'Memuat data wilayah...')}</p>
      </div>

      <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${hasTsunamiRisk ? 'border-red-400/40 bg-red-500/10' : 'border-emerald-400/30 bg-emerald-500/10'}`}>
        <div>
          <p className="text-xs text-slate-300">{t.quakeTsunami || 'Potensi Tsunami'}</p>
          <p className={`text-sm font-black ${hasTsunamiRisk ? 'text-red-200' : 'text-emerald-200'}`}>
            {quake?.tsunamiPotential || '--'}
          </p>
        </div>
        {hasTsunamiRisk ? <AlertTriangle className="h-6 w-6 text-red-300" /> : <Radio className="h-6 w-6 text-emerald-300" />}
      </div>

      {weatherLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/5 p-3 text-xs text-sky-300">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          {t.weatherOwLoading || 'Memuat cuaca pusat gempa...'}
        </div>
      )}

      {!weatherLoading && weather && (
        <div className="rounded-xl border border-sky-300/20 bg-sky-950/20 p-4">
          <p className="text-xs text-sky-300 font-bold mb-2">☁️ {t.weatherTitle || 'Cuaca Real-time'} ({quake?.coordinates})</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-950/50 p-2 border border-white/5">
              <p className="text-[9px] text-slate-400 mb-0.5">{t.weatherCondition || 'Kondisi'}</p>
              <p className="text-xs font-black text-white capitalize">{weather.description}</p>
            </div>
            <div className="rounded-lg bg-slate-950/50 p-2 border border-white/5">
              <p className="text-[9px] text-slate-400 mb-0.5">{t.weatherTemp || 'Suhu'}</p>
              <p className="text-xs font-black text-white">{weather.temp}°C</p>
            </div>
            <div className="rounded-lg bg-slate-950/50 p-2 border border-white/5">
              <p className="text-[9px] text-slate-400 mb-0.5">{t.weatherHumidity || 'Kelembapan'}</p>
              <p className="text-xs font-black text-white">{weather.humidity}%</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">{t.quakeUpdate || 'Update:'} {quake?.dateTime || '...'} • {t.quakeIndependent || 'Fetch independen dari BMKG.'}</p>
      {quake ? (
        <ShareButtons text={`Quake BMKG: M ${quake.magnitude.toFixed(1)}, ${quake.region}. ${t.quakeTsunami || 'Tsunami'}: ${quake.tsunamiPotential}.`} />
      ) : null}
    </div>
  );
}

// ── Interface untuk OpenWeather data real ───────────────────────────────
interface OpenWeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  clouds: number;
  description: string;
  icon: string;
  city?: string;
  country?: string;
  lat: number;
  lon: number;
}

// ── Helper: ambil emoji cuaca dari icon code OpenWeather ─────────────────
function getWeatherEmoji(icon: string): string {
  const code = icon?.substring(0, 2);
  const map: Record<string, string> = {
    '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
    '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️',
  };
  return map[code] || '🌤️';
}

// ── Weather Canvas Animation Component ─────────────────────────────────────────
function WeatherCanvas({ condition }: { condition: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 100);

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
      { x: 30, y: 25, r: 20, speed: 0.1 },
      { x: 120, y: 15, r: 28, speed: 0.08 },
      { x: 230, y: 30, r: 18, speed: 0.12 },
    ];

    let flash = 0;

    const createParticle = () => {
      if (isRain) {
        return {
          x: Math.random() * width,
          y: -10,
          vy: 5 + Math.random() * 4,
          vx: -1 + Math.random() * 2,
          l: 6 + Math.random() * 6,
        };
      }
      if (isSnow) {
        return {
          x: Math.random() * width,
          y: -10,
          vy: 1 + Math.random() * 1.5,
          vx: -0.5 + Math.random() * 1,
          r: 2 + Math.random() * 2.5,
        };
      }
      return null;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      if (isClear) {
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Sun
        ctx.beginPath();
        ctx.arc(width - 45, 35, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
      } else {
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw Clouds
      if (isCloudy || isRain || isSnow) {
        ctx.fillStyle = isRain ? 'rgba(71, 85, 105, 0.7)' : 'rgba(226, 232, 240, 0.6)';
        clouds.forEach((c) => {
          c.x += c.speed;
          if (c.x - c.r > width) c.x = -c.r;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.arc(c.x + c.r * 0.6, c.y - c.r * 0.4, c.r * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Lightning bolts
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

      // Update particles
      if ((isRain || isSnow) && particles.length < 50) {
        const p = createParticle();
        if (p) particles.push(p);
      }

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#38bdf8';
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

  return <canvas ref={canvasRef} className="w-full h-[100px] rounded-xl shadow-inner bg-slate-950 block" />;
}

// ── Forecast Day Interface ──────────────────────────────────────────────────
interface ForecastDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  code: number;
}

function WeatherPanel({ t }: { t: Record<string, string> }) {
  const [locationData, setLocationData] = useState<LocationMonitoringData | null>(null);
  const [owData, setOwData] = useState<OpenWeatherData | null>(null);
  const [owLoading, setOwLoading] = useState(false);
  const [owError, setOwError] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'denied' | 'error'>('idle');
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [selectedForecastIndex, setSelectedForecastIndex] = useState<number>(0);
  const [arMode, setArMode] = useState(false);
  const [arError, setArError] = useState('');
  const [extremeWarning, setExtremeWarning] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const featured = cityWeatherSimulator[0];
  const realtimeWeather = locationData?.weather;

  // Weather threat estimator based on temp, wind, rain, and BMKG quake magnitude
  const getDisasterAssessment = useCallback((temp: number, wind: number, humidity: number) => {
    const threats: string[] = [];
    if (temp > 36) threats.push('Gelombang Panas Ekstrem (Suhu > 36°C)');
    if (wind > 10) threats.push('Potensi Angin Kencang (Kecepatan > 10 m/s)');
    if (humidity > 90) threats.push('Potensi Curah Hujan Tinggi (Lembap > 90%)');
    return threats.length > 0 ? threats.join(', ') : 'Kondisi Aman & Kondusif';
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

  const fetchForecastData = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia%2FJakarta`);
      if (!res.ok) return;
      const data = await res.json();
      const daily = data.daily;
      if (daily) {
        const days: ForecastDay[] = daily.time.map((time: string, idx: number) => {
          const code = daily.weathercode[idx];
          return {
            date: time,
            dayName: new Date(time).toLocaleDateString('id-ID', { weekday: 'long' }),
            tempMax: daily.temperature_2m_max[idx],
            tempMin: daily.temperature_2m_min[idx],
            code,
            condition: getWmoConditionDesc(code)
          };
        });
        setForecast(days);
      }
    } catch (e) {
      console.error('Error fetching 7-day forecast:', e);
    }
  };

  function getWmoConditionDesc(code: number): string {
    if (code === 0) return 'Cerah';
    if (code <= 3) return 'Cerah Berawan';
    if (code <= 48) return 'Kabut';
    if (code <= 57) return 'Gerimis';
    if (code <= 67) return 'Hujan Ringan';
    if (code <= 82) return 'Hujan Lebat / Deras';
    if (code <= 99) return 'Badai Petir';
    return 'Berawan';
  }

  const fetchOpenWeather = async (lat: number, lon: number) => {
    setOwLoading(true);
    setOwError('');
    setExtremeWarning(null);
    try {
      const res = await fetch(`/api/nasa/openweather?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || (t.weatherOwError || 'Gagal fetch OpenWeather.'));
      const weatherInfo = json.data;
      setOwData(weatherInfo);

      // Threat check
      const assessment = getDisasterAssessment(weatherInfo.temp, weatherInfo.wind_speed, weatherInfo.humidity);
      if (assessment !== 'Kondisi Aman & Kondusif') {
        setExtremeWarning(assessment);
        triggerTelegramWarning(weatherInfo.city || 'Titik Kustom', assessment, 'extreme');
      }

      await fetchForecastData(lat, lon);
    } catch (err) {
      setOwError(err instanceof Error ? err.message : (t.weatherOwError || 'OpenWeather tidak tersedia.'));
    } finally {
      setOwLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setGpsStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `/api/earth-monitoring/location?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
            { cache: 'no-store' }
          );
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Lokasi tidak dapat dimuat.');
          setLocationData(data);
          setGpsStatus('success');
        } catch {
          setGpsStatus('error');
        }
        await fetchOpenWeather(latitude, longitude);
      },
      () => {
        setGpsStatus('denied');
        fetchOpenWeather(-6.2088, 106.8456); // Fallback to Jakarta
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startARMode = async () => {
    setArError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      streamRef.current = stream;
      setArMode(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (e: any) {
      setArError('Akses kamera ditolak atau tidak didukung di perangkat ini.');
    }
  };

  const stopARMode = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setArMode(false);
  };

  const humidityLabel = (h: number) => h > 70 ? (t.weatherHumidityHigh || 'Lembap') : h > 40 ? (t.weatherHumidityNormal || 'Normal') : (t.weatherHumidityLow || 'Kering');
  const cloudsLabel = (c: number) => c < 25 ? (t.weatherCloudsLow || 'Cerah') : c < 50 ? (t.weatherCloudsMid || 'Berawan') : (t.weatherCloudsHigh || 'Mendung');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-cyan-200">{t.weatherSub || 'Data cuaca real-time'}</p>
        <h3 className="text-xl font-black text-white">{t.weatherTitle || 'Info Cuaca & Kondisi Langit'}</h3>
      </div>

      {extremeWarning && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200 flex items-start gap-2.5 shadow-md">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-bold text-red-300">Peringatan Anomali Cuaca Ekstrem!</p>
            <p className="mt-1 leading-relaxed">{extremeWarning}</p>
            <p className="mt-2 text-[10px] text-red-400 font-semibold uppercase tracking-wider">⚠️ Notifikasi darurat terkirim ke Channel Telegram utama</p>
          </div>
        </div>
      )}

      {gpsStatus === 'detecting' && (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3">
          <RefreshCw className="h-4 w-4 animate-spin text-cyan-300" />
          <p className="text-xs text-cyan-200">{t.weatherGpsDetecting || 'Mendeteksi lokasi Anda secara otomatis via GPS/Wi-Fi...'}</p>
        </div>
      )}
      {gpsStatus === 'success' && locationData && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
          <span className="text-base">📍</span>
          <p className="text-xs text-emerald-200">{t.weatherGpsFound || 'Lokasi terdeteksi:'} <strong>{owData?.city || locationData.location.label}</strong>{owData?.country ? `, ${owData.country}` : ''}</p>
        </div>
      )}

      {/* Dynamic Canvas Simulator */}
      {owData && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-cyan-300 tracking-wider">📡 Simulator Atmosfer Real-time (Canvas)</p>
          <WeatherCanvas condition={owData.description} />
        </div>
      )}

      {owLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/5 px-4 py-3">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-400" />
          <p className="text-xs text-sky-300">{t.weatherOwLoading || 'Mengambil data cuaca aktual dari OpenWeather...'}</p>
        </div>
      )}

      {owData && !owLoading && (
        <div className="rounded-xl border border-sky-300/25 bg-gradient-to-br from-sky-900/30 to-slate-950/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-sky-400 tracking-wider">🌤️ OpenWeather — Data Aktual</p>
              <h4 className="text-base font-black text-white mt-0.5">
                {owData.city || 'Lokasi Anda'}{owData.country ? `, ${owData.country}` : ''}
              </h4>
              <p className="text-[10px] text-slate-400">{owData.lat.toFixed(4)}°, {owData.lon.toFixed(4)}°</p>
            </div>
            <div className="text-center">
              <span className="text-4xl">{getWeatherEmoji(owData.icon)}</span>
              <p className="text-[10px] text-slate-400 mt-1 capitalize">{owData.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-950/50 p-2.5 text-center border border-white/5">
              <p className="text-[10px] text-slate-400 mb-0.5"> Suhu</p>
              <p className="text-lg font-black text-cyan-100">{owData.temp}°C</p>
              <p className="text-[9px] text-slate-500">{t.weatherFeelsLike || 'Terasa'} {owData.feels_like}°C</p>
            </div>
            <div className="rounded-lg bg-slate-950/50 p-2.5 text-center border border-white/5">
              <p className="text-[10px] text-slate-400 mb-0.5"> Kelembapan</p>
              <p className="text-lg font-black text-blue-300">{owData.humidity}%</p>
              <p className="text-[9px] text-slate-500">{humidityLabel(owData.humidity)}</p>
            </div>
            <div className="rounded-lg bg-slate-950/50 p-2.5 text-center border border-white/5">
              <p className="text-[10px] text-slate-400 mb-0.5"> Angin</p>
              <p className="text-lg font-black text-emerald-300">{owData.wind_speed.toFixed(1)} m/s</p>
            </div>
            <div className="rounded-lg bg-slate-950/50 p-2.5 text-center border border-white/5">
              <p className="text-[10px] text-slate-400 mb-0.5"> Awan</p>
              <p className="text-lg font-black text-slate-300">{owData.clouds}%</p>
              <p className="text-[9px] text-slate-500">{cloudsLabel(owData.clouds)}</p>
            </div>
          </div>

          {/* AR Mode Trigger */}
          <div className="flex gap-2">
            {!arMode ? (
              <button
                type="button"
                onClick={startARMode}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400/20 transition-all"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Buka Mode AR Kamera</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopARMode}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/20 transition-all"
              >
                <X className="h-3.5 w-3.5" />
                <span>Tutup AR Mode</span>
              </button>
            )}
          </div>

          {arMode && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-full">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-x-3 bottom-3 bg-slate-950/80 border border-white/10 rounded-lg p-2.5 backdrop-blur-sm pointer-events-none text-left">
                <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">HUD AR Cuaca Aktif</p>
                <p className="text-sm font-black text-white mt-0.5">{owData.city} — {owData.temp}°C</p>
                <p className="text-[9px] text-slate-400 capitalize">Kondisi: {owData.description} | Kecepatan Angin: {owData.wind_speed} m/s</p>
              </div>
            </div>
          )}

          {arError && <p className="text-[10px] text-red-400">{arError}</p>}

          <p className="text-xs leading-relaxed text-slate-300">
            {getAstronomyTip(owData.temp, owData.clouds, owData.description, t)}
          </p>

          <ShareButtons text={`${t.weatherTemp || 'Cuaca'} ${owData.city || 'Lokasi'}: ${owData.description}, ${owData.temp}°C.`} />
        </div>
      )}

      {/* 7-Day Forecast & Date Selection */}
      {forecast.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-950/45 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-300">📅 Prakiraan 7 Hari & Detail Tanggal</p>
          <div className="flex gap-2 overflow-x-auto pb-2 select-none">
            {forecast.map((day, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedForecastIndex(idx)}
                className={`px-3 py-2 rounded-lg text-center text-xs font-bold border transition-all shrink-0 min-w-[90px] ${selectedForecastIndex === idx ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'}`}
              >
                <p className="text-[9px] text-slate-500 leading-none">{new Date(day.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</p>
                <p className="mt-1 leading-snug truncate">{day.dayName}</p>
                <p className="mt-1 font-black text-white">{Math.round(day.tempMax)}°</p>
              </button>
            ))}
          </div>

          <div className="bg-slate-950/70 border border-white/5 rounded-lg p-3 text-left">
            <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">Detail Kondisi Terpilih</p>
            <p className="text-xs font-black text-white mt-1">{forecast[selectedForecastIndex].dayName}, {new Date(forecast[selectedForecastIndex].date).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white/5 rounded p-2 text-center">
                <p className="text-[9px] text-slate-400">Temperatur Maks</p>
                <p className="text-sm font-black text-white">{Math.round(forecast[selectedForecastIndex].tempMax)}°C</p>
              </div>
              <div className="bg-white/5 rounded p-2 text-center">
                <p className="text-[9px] text-slate-400">Temperatur Min</p>
                <p className="text-sm font-black text-white">{Math.round(forecast[selectedForecastIndex].tempMin)}°C</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-350 capitalize">Kondisi: {forecast[selectedForecastIndex].condition}</p>
          </div>
        </div>
      )}

      <LocationSearch t={t} onResult={(data) => {
        setLocationData(data);
        setGpsStatus('success');
        fetchOpenWeather(data.location.latitude, data.location.longitude);
      }} />

      {locationData && realtimeWeather && !owData ? (
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4">
          <p className="text-xs text-emerald-200">{t.weatherSimResult || 'Hasil pencarian — Simulator BMKG'}</p>
          <h4 className="mt-1 text-base font-black text-white">{locationData.location.label}</h4>
          <p className="mt-1 text-[11px] text-emerald-100/80">
            {locationData.location.latitude.toFixed(5)}, {locationData.location.longitude.toFixed(5)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">{t.weatherTemp || 'Suhu'}</p>
              <p className="text-xl font-black text-cyan-100">{realtimeWeather.temp.toFixed(1)}°C</p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">{t.weatherRain || 'Hujan'}</p>
              <p className="text-xl font-black text-cyan-100">{getRainLabel(realtimeWeather.rainIntensity, t)}</p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">{t.weatherHumidity || 'Kelembapan'}</p>
              <p className="text-xl font-black text-cyan-100">{Math.round(realtimeWeather.humidity)}%</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-200">
            {realtimeWeather.condition}, {t.weatherRainChance || 'peluang hujan'} {Math.round(realtimeWeather.rainProbability)}%, {t.weatherPrecipitation || 'presipitasi'} {realtimeWeather.precipitation.toFixed(1)} mm.
          </p>
          <ShareButtons text={`${t.weatherCondition || 'Cuaca'} ${locationData.location.label}: ${realtimeWeather.condition}, ${realtimeWeather.temp.toFixed(1)}°C.`} />
        </div>
      ) : null}

      <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Thermometer className="h-5 w-5 text-cyan-200" />
          <div>
            <p className="text-sm font-black text-white">
              {(t.weatherCityTonight || 'Suhu Udara {city} Malam Ini:').replace('{city}', featured.city)} {featured.temp}°C
            </p>
            <p className="text-xs text-slate-300">({featured.condition})</p>
          </div>
        </div>
        <ThermometerBar temp={featured.temp} t={t} />
        <p className="mt-3 text-xs leading-relaxed text-slate-200">{getAstronomyTip(featured.temp, featured.rain, featured.condition, t)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cityWeatherSimulator.map((city) => (
          <div key={city.city} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{city.city}</p>
                <p className="text-[11px] text-slate-400">{city.condition}</p>
              </div>
              <span className="text-lg font-black text-cyan-100">{city.temp}°C</span>
            </div>
            <ThermometerBar temp={city.temp} t={t} />
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.weatherIntensity || 'Intensitas hujan'}</span>
                <span>{getRainLabel(city.rain, t)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${getRainColor(city.rain)}`} style={{ width: `${city.rain}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function EnergyPanel({ t }: { t: Record<string, string> }) {
  const [locationData, setLocationData] = useState<LocationMonitoringData | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'denied' | 'error'>('idle');
  const topSolar = useMemo(() => [...reAtlasEnergyRegions].sort((a, b) => b.solar - a.solar)[0], []);
  const realtimeEnergy = locationData?.energy;

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setGpsStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `/api/earth-monitoring/location?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`,
            { cache: 'no-store' }
          );
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Lokasi tidak dapat dimuat.');
          setLocationData(data);
          setGpsStatus('success');
        } catch {
          setGpsStatus('error');
        }
      },
      () => {
        setGpsStatus('denied');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-cyan-200">{t.energySub || 'Simulator potensi RE-Atlas'}</p>
        <h3 className="text-xl font-black text-white">{t.energyTitle || 'Energi Angin & Surya'}</h3>
      </div>

      {gpsStatus === 'detecting' && (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3">
          <RefreshCw className="h-4 w-4 animate-spin text-cyan-300" />
          <p className="text-xs text-cyan-200">{t.weatherGpsDetecting || 'Mendeteksi lokasi Anda secara otomatis via GPS/Wi-Fi...'}</p>
        </div>
      )}
      {gpsStatus === 'success' && locationData && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
          <span className="text-base">📍</span>
          <p className="text-xs text-emerald-200">{t.energyGpsFound || 'Lokasi terdeteksi otomatis:'} <strong>{locationData.location.label}</strong></p>
        </div>
      )}
      {gpsStatus === 'denied' && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
          <span className="text-base">📵</span>
          <p className="text-xs text-amber-200">{t.energyGpsDenied || 'Izin lokasi ditolak. Gunakan form pencarian manual di bawah.'}</p>
        </div>
      )}
      {gpsStatus === 'error' && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3">
          <span className="text-base">⚠️</span>
          <p className="text-xs text-red-200">{t.energyGpsError || 'Gagal memuat data lokasi otomatis. Coba cari lokasi secara manual.'}</p>
        </div>
      )}

      <LocationSearch t={t} onResult={(data) => { setLocationData(data); setGpsStatus('success'); }} />

      {locationData && realtimeEnergy ? (
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
          <p className="text-xs text-cyan-200">{t.energyRealtimeResult || 'Hasil pencarian realtime'}</p>
          <h4 className="mt-1 text-base font-black text-white">{locationData.location.label}</h4>
          <p className="mt-1 text-[11px] text-cyan-100/80">
            {locationData.location.latitude.toFixed(5)}, {locationData.location.longitude.toFixed(5)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">{t.energyWind10m || 'Angin 10m'}</p>
              <p className="text-xl font-black text-cyan-100">{realtimeEnergy.wind.toFixed(1)} km/j</p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">{t.energyWindDir || 'Arah Angin'}</p>
              <p className="text-xl font-black text-cyan-100">{Math.round(realtimeEnergy.windDirection)}°</p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">{t.energySolar || 'Radiasi Surya'}</p>
              <p className="text-xl font-black text-cyan-100">{Math.round(realtimeEnergy.solarRadiation)} W/m²</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-200">
            {t.energySolarNote || 'Data ini adalah pembacaan cuaca permukaan realtime dari Open-Meteo, cocok untuk indikasi awal kondisi angin dan matahari setempat.'}
          </p>
          <ShareButtons text={`${t.energyTitle || 'Angin & Surya'} ${locationData.location.label}: ${realtimeEnergy.wind.toFixed(1)} km/j, ${Math.round(realtimeEnergy.solarRadiation)} W/m².`} />
        </div>
      ) : null}

      <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4">
        <div className="mb-2 flex items-center gap-3">
          <Zap className="h-5 w-5 text-amber-200" />
          <p className="text-sm font-black text-white">{t.energyTopSolar || 'Radiasi Matahari:'} {topSolar.solar.toFixed(1)} kWh/m²/hari</p>
        </div>
        <p className="text-xs leading-relaxed text-slate-200">
          {topSolar.region} — {topSolar.label}
        </p>
      </div>

      <div className="space-y-3">
        {reAtlasEnergyRegions.map((region) => (
          <div key={region.region} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{region.region}</p>
                <p className="text-[11px] text-slate-400">{region.label}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Sun className="h-4 w-4 text-amber-300" />
                {region.solar.toFixed(1)}
                <Wind className="h-4 w-4 text-cyan-300" />
                {region.wind.toFixed(1)}
              </div>
            </div>
            <div className="grid grid-cols-[72px_1fr] items-center gap-2 text-[11px] text-slate-400">
              <span>{t.energySolarLabel || 'Surya'}</span>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${Math.min(100, region.solar * 18)}%` }} />
              </div>
              <span>{t.energyWindLabel || 'Angin'}</span>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" style={{ width: `${Math.min(100, region.wind * 14)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EarthMonitoringSimulator() {
  const language = useSiteLanguage();
  const t = landingText[language];

  const tabs: { id: TabId; label: string; icon: ComponentType<{ className?: string }> }[] = [
    { id: 'quake', label: t.tabQuake || '🌋 Gempa Terkini', icon: Mountain },
    { id: 'weather', label: t.tabWeather || '🌧️ Cuaca & Hujan', icon: CloudRain },
    { id: 'energy', label: t.tabEnergy || '☀️ Angin & Surya', icon: Sun },
  ];

  const [activeTab, setActiveTab] = useState<TabId>('quake');
  const [quake, setQuake] = useState<NormalizedEarthquake | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadQuake = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/earth-monitoring/quake', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Data BMKG belum dapat dimuat.');
      }
      const data = (await response.json()) as QuakeResponse;
      setQuake(data.earthquake);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data BMKG.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuake();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 text-left shadow-2xl shadow-cyan-950/30 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10">
          <Activity className="h-5 w-5 text-cyan-200" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">{t.earthMonitorSubtitle || 'Earth Monitoring Simulator'}</p>
          <h2 className="text-lg font-black text-white">{t.earthMonitorWidget || 'Live Data Bumi untuk Komunitas Langit Malam'}</h2>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                  : 'border-white/10 bg-slate-950/35 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'quake' ? (
        <QuakePanel quake={quake} isLoading={isLoading} error={error} onRefresh={loadQuake} t={t} />
      ) : null}
      {activeTab === 'weather' ? <WeatherPanel t={t} /> : null}
      {activeTab === 'energy' ? <EnergyPanel t={t} /> : null}

      <div className="mt-5 border-t border-white/10 pt-3 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>
          {t.earthDataSource || 'Data live disediakan oleh BMKG, Open-Meteo, dan ESDM RE-Atlas. Widget ini berjalan independen dari NASA_API_KEY.'}
        </span>
        <a 
          href="/cuaca" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-extrabold hover:underline whitespace-nowrap"
        >
          <span>Buka PWA Cuaca Utama (Fitur Lengkap) →</span>
        </a>
      </div>
    </div>
  );
}
