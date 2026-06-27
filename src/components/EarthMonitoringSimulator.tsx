"use client";

import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { cityWeatherSimulator, reAtlasEnergyRegions, type NormalizedEarthquake } from '@/lib/earthMonitoring';

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

const tabs: { id: TabId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'quake', label: '🌋 Gempa Terkini', icon: Mountain },
  { id: 'weather', label: '🌧️ Cuaca & Hujan', icon: CloudRain },
  { id: 'energy', label: '☀️ Angin & Surya', icon: Sun },
];

function getTemperatureColor(temp: number) {
  if (temp < 22) return 'from-sky-500 to-cyan-300';
  if (temp <= 30) return 'from-emerald-400 to-amber-300';
  return 'from-orange-500 to-red-500';
}

function getTemperatureLabel(temp: number) {
  if (temp < 22) return 'Dingin/Sejuk';
  if (temp <= 30) return 'Normal';
  return 'Panas';
}

function getRainColor(rain: number) {
  if (rain < 30) return 'bg-emerald-400';
  if (rain <= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function getRainLabel(rain: number) {
  if (rain < 30) return 'Rendah';
  if (rain <= 60) return 'Sedang';
  return 'Tinggi';
}

function getAstronomyTip(temp: number, rain: number, condition: string) {
  if (temp <= 22 && rain < 30) {
    return `Tips Astronomi: Suhu ${temp}°C dan kondisi ${condition.toLowerCase()} sangat ideal untuk stargazing. Distorsi atmosfer cenderung lebih rendah, tapi siapkan jaket.`;
  }

  if (rain > 60) {
    return 'Tips Astronomi: Intensitas hujan tinggi membuat observasi visual kurang ideal. Gunakan malam ini untuk merencanakan target langit berikutnya.';
  }

  if (temp > 31) {
    return 'Tips Astronomi: Udara panas dapat meningkatkan turbulensi dekat permukaan. Pilih lokasi terbuka dan tunggu udara lebih stabil setelah tengah malam.';
  }

  return 'Tips Astronomi: Kondisi masih cukup layak. Cari area minim polusi cahaya dan pantau awan rendah sebelum mulai observasi.';
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

function LocationSearch({ label, onResult }: { label: string; onResult: (data: LocationMonitoringData) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setMessage('Masukkan minimal 3 karakter lokasi atau koordinat lengkap.');
      return;
    }

    setIsSearching(true);
    setMessage('');

    try {
      const response = await fetch(`/api/earth-monitoring/location?q=${encodeURIComponent(normalizedQuery)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lokasi belum dapat dimuat.');
      }
      onResult(data);
      setMessage(`Data realtime untuk ${data.location.label} berhasil dimuat.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal mencari lokasi.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
      <label className="mb-2 block text-[11px] font-bold uppercase text-slate-400">{label}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jababeka, Jl Sudirman Jakarta, Desa Cibatu, -6.2088, 106.8456"
          className="min-h-10 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 text-xs font-black text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Cari
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
        Bisa pakai nama kawasan, jalan, desa/kelurahan, kecamatan, kota/kabupaten, atau titik koordinat latitude, longitude.
      </p>
      {message ? <p className="mt-2 text-[11px] text-slate-300">{message}</p> : null}
    </form>
  );
}

function ThermometerBar({ temp }: { temp: number }) {
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
        <span className="text-slate-200">{getTemperatureLabel(temp)}</span>
        <span>40°C</span>
      </div>
    </div>
  );
}

function QuakePanel({ quake, isLoading, error, onRefresh }: {
  quake: NormalizedEarthquake | null;
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const hasTsunamiRisk = quake?.tsunamiPotential.toLowerCase().includes('berpotensi') && !quake?.tsunamiPotential.toLowerCase().includes('tidak');
  const magnitudeTone = quake && quake.magnitude >= 5 ? 'text-red-300 border-red-400/30 bg-red-500/10' : 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-cyan-200">Live JSON BMKG TEWS</p>
          <h3 className="text-xl font-black text-white">Gempa Bumi Terkini</h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-200 hover:bg-cyan-400/10"
          title="Muat ulang data BMKG"
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
          <p className="text-xs text-slate-300">Magnitudo</p>
          <p className="text-3xl font-black">{quake ? `M ${quake.magnitude.toFixed(1)}` : '--'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs text-slate-400">Kedalaman</p>
          <p className="text-2xl font-black text-white">{quake?.depth || '--'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-1 text-xs text-slate-400">Wilayah</p>
        <p className="text-sm font-semibold leading-relaxed text-slate-100">{quake?.region || 'Memuat data wilayah...'}</p>
      </div>

      <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${hasTsunamiRisk ? 'border-red-400/40 bg-red-500/10' : 'border-emerald-400/30 bg-emerald-500/10'}`}>
        <div>
          <p className="text-xs text-slate-300">Potensi Tsunami</p>
          <p className={`text-sm font-black ${hasTsunamiRisk ? 'text-red-200' : 'text-emerald-200'}`}>
            {quake?.tsunamiPotential || '--'}
          </p>
        </div>
        {hasTsunamiRisk ? <AlertTriangle className="h-6 w-6 text-red-300" /> : <Radio className="h-6 w-6 text-emerald-300" />}
      </div>

      <p className="text-xs text-slate-400">Update: {quake?.dateTime || 'menunggu data'} • Fetch independen dari BMKG.</p>
      {quake ? (
        <ShareButtons text={`Gempa BMKG: M ${quake.magnitude.toFixed(1)}, ${quake.region}. Potensi: ${quake.tsunamiPotential}.`} />
      ) : null}
    </div>
  );
}

function WeatherPanel() {
  const [locationData, setLocationData] = useState<LocationMonitoringData | null>(null);
  const featured = cityWeatherSimulator[0];
  const realtimeWeather = locationData?.weather;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-cyan-200">Simulator cuaca kota besar</p>
        <h3 className="text-xl font-black text-white">Info Cuaca & Intensitas Hujan</h3>
      </div>

      <LocationSearch label="Cari alamat, kawasan, desa, kota, atau koordinat" onResult={setLocationData} />

      {locationData && realtimeWeather ? (
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4">
          <p className="text-xs text-emerald-200">Hasil pencarian realtime</p>
          <h4 className="mt-1 text-base font-black text-white">{locationData.location.label}</h4>
          <p className="mt-1 text-[11px] text-emerald-100/80">
            Koordinat {locationData.location.latitude.toFixed(5)}, {locationData.location.longitude.toFixed(5)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">Suhu</p>
              <p className="text-xl font-black text-cyan-100">{realtimeWeather.temp.toFixed(1)}°C</p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">Hujan</p>
              <p className="text-xl font-black text-cyan-100">{getRainLabel(realtimeWeather.rainIntensity)}</p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">Kelembapan</p>
              <p className="text-xl font-black text-cyan-100">{Math.round(realtimeWeather.humidity)}%</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-200">
            Kondisi {realtimeWeather.condition.toLowerCase()}, peluang hujan {Math.round(realtimeWeather.rainProbability)}%, presipitasi {realtimeWeather.precipitation.toFixed(1)} mm.
          </p>
          <ShareButtons text={`Cuaca ${locationData.location.label}: ${realtimeWeather.condition}, ${realtimeWeather.temp.toFixed(1)}°C, peluang hujan ${Math.round(realtimeWeather.rainProbability)}%.`} />
        </div>
      ) : null}

      <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Thermometer className="h-5 w-5 text-cyan-200" />
          <div>
            <p className="text-sm font-black text-white">Suhu Udara {featured.city} Malam Ini: {featured.temp}°C</p>
            <p className="text-xs text-slate-300">({featured.condition})</p>
          </div>
        </div>
        <ThermometerBar temp={featured.temp} />
        <p className="mt-3 text-xs leading-relaxed text-slate-200">{getAstronomyTip(featured.temp, featured.rain, featured.condition)}</p>
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
            <ThermometerBar temp={city.temp} />
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Intensitas hujan</span>
                <span>{getRainLabel(city.rain)}</span>
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

function EnergyPanel() {
  const [locationData, setLocationData] = useState<LocationMonitoringData | null>(null);
  const topSolar = useMemo(() => [...reAtlasEnergyRegions].sort((a, b) => b.solar - a.solar)[0], []);
  const realtimeEnergy = locationData?.energy;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-cyan-200">Simulator potensi RE-Atlas</p>
        <h3 className="text-xl font-black text-white">Energi Angin & Surya</h3>
      </div>

      <LocationSearch label="Cari alamat, kawasan, desa, kota, atau koordinat" onResult={setLocationData} />

      {locationData && realtimeEnergy ? (
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
          <p className="text-xs text-cyan-200">Hasil pencarian realtime</p>
          <h4 className="mt-1 text-base font-black text-white">{locationData.location.label}</h4>
          <p className="mt-1 text-[11px] text-cyan-100/80">
            Koordinat {locationData.location.latitude.toFixed(5)}, {locationData.location.longitude.toFixed(5)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">Angin 10m</p>
              <p className="text-xl font-black text-cyan-100">{realtimeEnergy.wind.toFixed(1)} km/j</p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">Arah Angin</p>
              <p className="text-xl font-black text-cyan-100">{Math.round(realtimeEnergy.windDirection)}°</p>
            </div>
            <div className="rounded-lg bg-slate-950/45 p-3">
              <p className="text-[11px] text-slate-400">Radiasi Surya</p>
              <p className="text-xl font-black text-cyan-100">{Math.round(realtimeEnergy.solarRadiation)} W/m²</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-200">
            Data ini adalah pembacaan cuaca permukaan realtime dari Open-Meteo, cocok untuk indikasi awal kondisi angin dan matahari setempat.
          </p>
          <ShareButtons text={`Angin & Surya ${locationData.location.label}: angin ${realtimeEnergy.wind.toFixed(1)} km/j, radiasi surya ${Math.round(realtimeEnergy.solarRadiation)} W/m².`} />
        </div>
      ) : null}

      <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4">
        <div className="mb-2 flex items-center gap-3">
          <Zap className="h-5 w-5 text-amber-200" />
          <p className="text-sm font-black text-white">Radiasi Matahari: {topSolar.solar.toFixed(1)} kWh/m²/hari</p>
        </div>
        <p className="text-xs leading-relaxed text-slate-200">
          {topSolar.region} sedang menjadi kandidat terbaik dalam simulator ini. Nilai tersebut sangat baik untuk estimasi awal panel surya dan edukasi energi bersih.
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
              <span>Surya</span>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${Math.min(100, region.solar * 18)}%` }} />
              </div>
              <span>Angin</span>
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
          <p className="text-xs font-bold uppercase text-cyan-200">Earth Monitoring Simulator</p>
          <h2 className="text-lg font-black text-white">Live Data Bumi untuk Komunitas Langit Malam</h2>
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
        <QuakePanel quake={quake} isLoading={isLoading} error={error} onRefresh={loadQuake} />
      ) : null}
      {activeTab === 'weather' ? <WeatherPanel /> : null}
      {activeTab === 'energy' ? <EnergyPanel /> : null}

      <div className="mt-5 border-t border-white/10 pt-3 text-[11px] text-slate-500">
        Data live disediakan oleh BMKG, Open-Meteo, dan ESDM RE-Atlas. Widget ini berjalan independen dari NASA_API_KEY.
      </div>
    </div>
  );
}
