import { getAbsoluteUrl } from './siteUrl';

export interface BmkgEarthquake {
  Tanggal?: string;
  Jam?: string;
  DateTime?: string;
  Coordinates?: string;
  Lintang?: string;
  Bujur?: string;
  Magnitude?: string;
  Kedalaman?: string;
  Wilayah?: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;
}

export interface NormalizedEarthquake {
  dateTime: string;
  magnitude: number;
  depth: string;
  region: string;
  tsunamiPotential: string;
  coordinates: string;
  felt: string;
  signature: string;
}

export interface MonitoringLocation {
  city: string;
  province: string;
  latitude: number;
  longitude: number;
}

export interface LiveWeatherPoint extends MonitoringLocation {
  temp: number;
  humidity: number;
  precipitation: number;
  rainProbability: number;
  windSpeed: number;
  weatherCode: number;
  condition: string;
  eveningClearHours: number;
  eveningRainProbability: number;
  updatedAt: string;
}

export type ExtremeWeatherReason = 'rain' | 'wind' | 'heat' | 'storm' | 'bmkg_alert';

export interface ExtremeWeatherAlert {
  type: ExtremeWeatherReason;
  city: string;
  province: string;
  severity: 'waspada' | 'siaga';
  label: string;
  detail: string;
  signaturePart: string;
}

const BMKG_AUTOGEMPA_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const EXTREME_WEATHER_KEYWORDS = [
  'badai',
  'siklon',
  'puting beliung',
  'angin kencang',
  'hujan lebat',
  'hujan ekstrem',
  'cuaca ekstrem',
  'gelombang tinggi',
];

const EXTREME_THRESHOLDS = {
  rainProbability: 85,
  precipitationMm: 12,
  windKmh: 45,
  heatCelsius: 37,
};

export const weatherMonitoringLocations: MonitoringLocation[] = [
  { city: 'Banda Aceh', province: 'Aceh', latitude: 5.5483, longitude: 95.3238 },
  { city: 'Medan', province: 'Sumatera Utara', latitude: 3.5952, longitude: 98.6722 },
  { city: 'Padang', province: 'Sumatera Barat', latitude: -0.9471, longitude: 100.4172 },
  { city: 'Palembang', province: 'Sumatera Selatan', latitude: -2.9761, longitude: 104.7754 },
  { city: 'Jakarta', province: 'DKI Jakarta', latitude: -6.2088, longitude: 106.8456 },
  { city: 'Bandung', province: 'Jawa Barat', latitude: -6.9175, longitude: 107.6191 },
  { city: 'Semarang', province: 'Jawa Tengah', latitude: -6.9667, longitude: 110.4167 },
  { city: 'Yogyakarta', province: 'DIY', latitude: -7.7956, longitude: 110.3695 },
  { city: 'Surabaya', province: 'Jawa Timur', latitude: -7.2575, longitude: 112.7521 },
  { city: 'Denpasar', province: 'Bali', latitude: -8.6500, longitude: 115.2167 },
  { city: 'Mataram', province: 'NTB', latitude: -8.5833, longitude: 116.1167 },
  { city: 'Kupang', province: 'NTT', latitude: -10.1772, longitude: 123.6070 },
  { city: 'Pontianak', province: 'Kalimantan Barat', latitude: -0.0263, longitude: 109.3425 },
  { city: 'Banjarmasin', province: 'Kalimantan Selatan', latitude: -3.3186, longitude: 114.5944 },
  { city: 'Balikpapan', province: 'Kalimantan Timur', latitude: -1.2379, longitude: 116.8529 },
  { city: 'Makassar', province: 'Sulawesi Selatan', latitude: -5.1477, longitude: 119.4327 },
  { city: 'Manado', province: 'Sulawesi Utara', latitude: 1.4748, longitude: 124.8421 },
  { city: 'Ambon', province: 'Maluku', latitude: -3.6954, longitude: 128.1814 },
  { city: 'Ternate', province: 'Maluku Utara', latitude: 0.7893, longitude: 127.3639 },
  { city: 'Jayapura', province: 'Papua', latitude: -2.5916, longitude: 140.6690 },
];

export const reAtlasEnergyRegions = [
  { region: 'NTB', solar: 5.2, wind: 6.1, label: 'Sangat Baik' },
  { region: 'NTT', solar: 5.1, wind: 6.4, label: 'Sangat Baik' },
  { region: 'Sulawesi Selatan', solar: 4.9, wind: 5.3, label: 'Baik' },
  { region: 'DIY', solar: 4.8, wind: 3.8, label: 'Baik' },
  { region: 'Jawa Barat', solar: 4.4, wind: 3.4, label: 'Menengah' },
];

export const cityWeatherSimulator = [
  { city: 'Yogyakarta', temp: 21, condition: 'Cerah & Dingin', rain: 18, humidity: 72 },
  { city: 'Jakarta', temp: 30, condition: 'Berawan Lembap', rain: 46, humidity: 82 },
  { city: 'Bandung', temp: 22, condition: 'Cerah Berawan', rain: 28, humidity: 76 },
  { city: 'Surabaya', temp: 32, condition: 'Panas Berawan', rain: 34, humidity: 70 },
];

export function normalizeEarthquake(gempa: BmkgEarthquake): NormalizedEarthquake {
  const magnitude = Number.parseFloat(String(gempa.Magnitude || '0').replace(',', '.')) || 0;
  const dateTime = gempa.DateTime || `${gempa.Tanggal || ''} ${gempa.Jam || ''}`.trim();
  const signature = [
    dateTime,
    gempa.Coordinates,
    gempa.Magnitude,
    gempa.Kedalaman,
    gempa.Wilayah,
  ].filter(Boolean).join('|');

  return {
    dateTime,
    magnitude,
    depth: gempa.Kedalaman || '-',
    region: gempa.Wilayah || 'Wilayah belum tersedia',
    tsunamiPotential: gempa.Potensi || 'Tidak tersedia',
    coordinates: gempa.Coordinates || [gempa.Lintang, gempa.Bujur].filter(Boolean).join(', '),
    felt: gempa.Dirasakan || '-',
    signature,
  };
}

export function isTsunamiPotential(potential: string) {
  const value = potential.toLowerCase();
  return value.includes('berpotensi') && !value.includes('tidak');
}

export function shouldSendEarthquakeAlert(earthquake: NormalizedEarthquake) {
  return earthquake.magnitude >= 5 || isTsunamiPotential(earthquake.tsunamiPotential);
}

export function getEarthquakeEventType(earthquake: NormalizedEarthquake) {
  return isTsunamiPotential(earthquake.tsunamiPotential) ? 'tsunami_alert' : 'earthquake_alert';
}

export function weatherCodeLabel(code: number) {
  if ([0, 1].includes(code)) return 'Cerah';
  if ([2, 3].includes(code)) return 'Berawan';
  if ([45, 48].includes(code)) return 'Berkabut';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Gerimis';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Hujan';
  if ([95, 96, 99].includes(code)) return 'Badai petir';
  return 'Cuaca variatif';
}

function isClearSkyCode(code: number) {
  return [0, 1, 2].includes(code);
}

function isStormCode(code: number) {
  return [95, 96, 99].includes(code);
}

function buildForecastUrl(location: MonitoringLocation) {
  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set('timezone', 'Asia/Jakarta');
  url.searchParams.set('current', [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation',
    'rain',
    'weather_code',
    'wind_speed_10m',
  ].join(','));
  url.searchParams.set('hourly', [
    'weather_code',
    'precipitation_probability',
  ].join(','));
  url.searchParams.set('forecast_days', '1');
  return url;
}

async function fetchLocationWeather(location: MonitoringLocation): Promise<LiveWeatherPoint> {
  const response = await fetch(buildForecastUrl(location), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo ${location.city} error: ${response.status}`);
  }

  const data = await response.json();
  const current = data.current || {};
  const hourly = data.hourly || {};
  const hourlyTimes = Array.isArray(hourly.time) ? hourly.time : [];
  const hourlyCodes = Array.isArray(hourly.weather_code) ? hourly.weather_code : [];
  const hourlyRain = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability : [];
  const currentHour = new Date().getHours();
  const currentIndex = Math.max(0, hourlyTimes.findIndex((time: string) => {
    const hour = Number(time.slice(11, 13));
    return hour >= currentHour;
  }));
  const eveningIndexes = hourlyTimes
    .map((time: string, index: number) => ({ hour: Number(time.slice(11, 13)), index }))
    .filter(({ hour }: { hour: number }) => hour >= 18 && hour <= 23)
    .map(({ index }: { index: number }) => index);
  const eveningClearHours = eveningIndexes.filter((index: number) => isClearSkyCode(Number(hourlyCodes[index]))).length;
  const eveningRainProbability = eveningIndexes.length
    ? Math.round(eveningIndexes.reduce((total: number, index: number) => total + Number(hourlyRain[index] || 0), 0) / eveningIndexes.length)
    : Number(hourlyRain[currentIndex] || 0);
  const precipitation = Number(current.precipitation || current.rain || 0);
  const rainProbability = Number(hourlyRain[currentIndex] || 0);
  const weatherCode = Number(current.weather_code || 0);

  return {
    ...location,
    temp: Number(current.temperature_2m || 0),
    humidity: Number(current.relative_humidity_2m || 0),
    precipitation,
    rainProbability,
    windSpeed: Number(current.wind_speed_10m || 0),
    weatherCode,
    condition: weatherCodeLabel(weatherCode),
    eveningClearHours,
    eveningRainProbability,
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchLiveWeatherSnapshot() {
  const results = await Promise.allSettled(weatherMonitoringLocations.map(fetchLocationWeather));
  const points = results
    .filter((result): result is PromiseFulfilledResult<LiveWeatherPoint> => result.status === 'fulfilled')
    .map((result) => result.value);
  const failures = results.length - points.length;

  if (!points.length) {
    throw new Error('Semua sumber cuaca live gagal dibaca.');
  }

  return {
    source: 'Open-Meteo live forecast',
    updatedAt: new Date().toISOString(),
    points,
    failures,
  };
}

export async function fetchBmkgWeatherAlertText() {
  const alertUrl = process.env.BMKG_WEATHER_ALERT_URL || '';
  if (!alertUrl) return null;

  try {
    const response = await fetch(alertUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json,text/plain,*/*' },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export function detectExtremeWeather(
  points: LiveWeatherPoint[],
  bmkgAlertText?: string | null
): ExtremeWeatherAlert[] {
  const alerts: ExtremeWeatherAlert[] = [];

  for (const point of points) {
    if (
      point.precipitation >= EXTREME_THRESHOLDS.precipitationMm ||
      (point.rainProbability >= EXTREME_THRESHOLDS.rainProbability && point.precipitation >= 4)
    ) {
      alerts.push({
        type: 'rain',
        city: point.city,
        province: point.province,
        severity: point.precipitation >= 20 ? 'siaga' : 'waspada',
        label: 'Hujan intensitas tinggi',
        detail: `${point.city}: presipitasi ${point.precipitation.toFixed(1)} mm, peluang hujan ${Math.round(point.rainProbability)}%.`,
        signaturePart: `rain:${point.city}:${Math.round(point.precipitation)}:${Math.round(point.rainProbability)}`,
      });
    }

    if (point.windSpeed >= EXTREME_THRESHOLDS.windKmh) {
      alerts.push({
        type: 'wind',
        city: point.city,
        province: point.province,
        severity: point.windSpeed >= 60 ? 'siaga' : 'waspada',
        label: 'Angin kencang',
        detail: `${point.city}: kecepatan angin ${point.windSpeed.toFixed(1)} km/jam.`,
        signaturePart: `wind:${point.city}:${Math.round(point.windSpeed)}`,
      });
    }

    if (point.temp >= EXTREME_THRESHOLDS.heatCelsius) {
      alerts.push({
        type: 'heat',
        city: point.city,
        province: point.province,
        severity: point.temp >= 39 ? 'siaga' : 'waspada',
        label: 'Suhu panas ekstrem',
        detail: `${point.city}: suhu permukaan ${point.temp.toFixed(1)}°C, kelembapan ${Math.round(point.humidity)}%.`,
        signaturePart: `heat:${point.city}:${Math.round(point.temp)}`,
      });
    }

    if (isStormCode(point.weatherCode)) {
      alerts.push({
        type: 'storm',
        city: point.city,
        province: point.province,
        severity: point.weatherCode >= 96 ? 'siaga' : 'waspada',
        label: 'Badai petir',
        detail: `${point.city}: kode cuaca ${point.weatherCode} (${point.condition}).`,
        signaturePart: `storm:${point.city}:${point.weatherCode}`,
      });
    }
  }

  if (bmkgAlertText) {
    const normalized = bmkgAlertText.toLowerCase();
    const matchedKeyword = EXTREME_WEATHER_KEYWORDS.find((keyword) => normalized.includes(keyword));
    if (matchedKeyword) {
      alerts.unshift({
        type: 'bmkg_alert',
        city: 'Indonesia',
        province: 'BMKG',
        severity: 'siaga',
        label: 'Peringatan dini BMKG',
        detail: `BMKG memuat indikasi "${matchedKeyword}" pada kanal peringatan cuaca.`,
        signaturePart: `bmkg:${matchedKeyword}:${new Date().toISOString().slice(0, 13)}`,
      });
    }
  }

  return alerts;
}

export function buildExtremeWeatherSignature(alerts: ExtremeWeatherAlert[]) {
  return alerts
    .map((alert) => alert.signaturePart)
    .sort()
    .join('|');
}

export function buildExtremeWeatherMessage(alerts: ExtremeWeatherAlert[]) {
  const topAlerts = alerts.slice(0, 8);

  return [
    '⛈️ <b>Peringatan Cuaca Ekstrem</b>',
    '',
    ...topAlerts.map((alert) => {
      const severity = alert.severity === 'siaga' ? 'SIAGA' : 'WASPADA';
      return `<b>${severity} - ${alert.label}</b>\n${alert.detail}`;
    }),
    alerts.length > topAlerts.length ? `\n+${alerts.length - topAlerts.length} indikasi lain dipantau agar channel tidak terlalu padat.` : '',
    '',
    'Disarankan menunda observasi langit terbuka di wilayah terdampak.',
    `Pantau simulator Earth Monitoring: ${getAbsoluteUrl('/monitoring')}`,
  ].filter(Boolean).join('\n');
}

export async function fetchLatestBmkgEarthquake(): Promise<NormalizedEarthquake> {
  const response = await fetch(BMKG_AUTOGEMPA_URL, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`BMKG autogempa error: ${response.status}`);
  }

  const data = await response.json();
  const gempa = data?.Infogempa?.gempa;
  if (!gempa) {
    throw new Error('Format data BMKG autogempa tidak dikenali.');
  }

  return normalizeEarthquake(gempa);
}

export function buildEarthquakeAlertMessage(earthquake: NormalizedEarthquake) {
  const tsunami = isTsunamiPotential(earthquake.tsunamiPotential)
    ? 'BERPOTENSI TSUNAMI'
    : earthquake.tsunamiPotential;

  return [
    '🚨 <b>PERINGATAN GEMPA BMKG</b>',
    '',
    `<b>Magnitudo:</b> M ${earthquake.magnitude.toFixed(1)}`,
    `<b>Kedalaman:</b> ${earthquake.depth}`,
    `<b>Wilayah:</b> ${earthquake.region}`,
    `<b>Potensi:</b> ${tsunami}`,
    `<b>Waktu:</b> ${earthquake.dateTime}`,
    earthquake.coordinates ? `<b>Koordinat:</b> ${earthquake.coordinates}` : '',
    '',
    `Pantau simulator Earth Monitoring: ${getAbsoluteUrl('/monitoring')}`,
  ].filter(Boolean).join('\n');
}

export async function buildDailySkyMessage() {
  const snapshot = await fetchLiveWeatherSnapshot();
  const clearLocations = snapshot.points
    .filter((point) => point.eveningClearHours >= 3 && point.eveningRainProbability <= 35)
    .sort((a, b) => b.eveningClearHours - a.eveningClearHours || a.eveningRainProbability - b.eveningRainProbability)
    .slice(0, 8);
  const cloudyLocations = snapshot.points
    .filter((point) => point.eveningRainProbability >= 65 || point.eveningClearHours <= 1)
    .sort((a, b) => b.eveningRainProbability - a.eveningRainProbability)
    .slice(0, 5);
  const clearCities = clearLocations.map((point) => `${point.city} (${point.province})`).join(', ');
  const cautionCities = cloudyLocations.map((point) => point.city).join(', ');

  return [
    '🌌 <b>Prediksi Langit Malam Ini</b>',
    '',
    clearCities
      ? `${clearCities} terpantau paling prospektif untuk observasi malam ini berdasarkan forecast live.`
      : 'Belum ada kota pantau yang cukup cerah untuk rekomendasi observasi malam ini.',
    cautionCities ? `Wilayah yang sebaiknya diwaspadai karena peluang awan/hujan lebih tinggi: ${cautionCities}.` : '',
    `Sumber: ${snapshot.source}. ${snapshot.failures ? `${snapshot.failures} titik gagal dibaca dan dilewati.` : 'Semua titik pantau terbaca.'}`,
    '',
    `Cek simulator lengkapnya: ${getAbsoluteUrl('/langit-malam')}`,
  ].filter(Boolean).join('\n');
}

async function fetchReAtlasSummary() {
  const reAtlasUrl = process.env.RE_ATLAS_SUMMARY_URL || '';
  if (!reAtlasUrl) return null;

  try {
    const response = await fetch(reAtlasUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const region = String(data.region || data.topRegion || '');
    const solar = Number(data.solar || data.solarKwh || data.solar_kwh_m2_day);
    const wind = Number(data.wind || data.windMs || data.wind_m_s || 0);
    const label = String(data.label || data.status || 'Baik');
    if (!region || !Number.isFinite(solar)) return null;
    return { region, solar, wind, label, source: 'RE-Atlas live/custom endpoint' };
  } catch {
    return null;
  }
}

export async function buildWeeklyEnergyMessage() {
  const liveSummary = await fetchReAtlasSummary();
  const top = [...reAtlasEnergyRegions].sort((a, b) => b.solar - a.solar)[0];
  const summary = liveSummary || { ...top, source: 'baseline simulasi RE-Atlas lokal' };

  return [
    '☀️ <b>Update Energi Hijau Mingguan</b>',
    '',
    `${summary.region} mencatat indeks radiasi matahari tertinggi: ${summary.solar.toFixed(1)} kWh/m²/hari.`,
    `Potensi angin regional: ${summary.wind.toFixed(1)} m/s. Status: ${summary.label}.`,
    liveSummary
      ? 'Ringkasan ini memakai endpoint RE-Atlas yang dikonfigurasi di environment.'
      : 'Catatan: RE_ATLAS_SUMMARY_URL belum tersedia, jadi pesan ini memakai baseline simulasi lokal sebagai fallback transparan.',
    '',
    `Pantau ringkasannya di PWA: ${getAbsoluteUrl('/monitoring')}`,
  ].join('\n');
}
