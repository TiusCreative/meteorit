const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'c5d9548ca431c734f6a6f9beda41a9a1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface WeatherData {
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
  timestamp: string;
}

// In-memory cache for Cloudflare Edge worker instances
const memoryCache = new Map<string, { data: WeatherData & { cachedAt: string }; timestamp: number }>();

export async function fetchAndCacheWeather(lat: number, lon: number, lang: string = 'id'): Promise<WeatherData | null> {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (isNaN(latNum) || isNaN(lonNum)) return null;

  // Cache key based on coordinate rounded to 1 decimal place and language
  const cacheKey = `weather_${latNum.toFixed(1)}_${lonNum.toFixed(1)}_${lang}`;

  try {
    // 1. Check in-memory Cache
    const cached = memoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }

    // Map lang code
    const langMap: Record<string, string> = {
      id: 'id',
      en: 'en',
      ms: 'en',
      zh: 'zh_cn',
      ja: 'ja',
    };
    const owLang = langMap[lang] || 'id';

    // 2. Fetch from OpenWeather API (Standard fetch, Edge compatible)
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=${owLang}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`[OpenWeather Lib] API returned status ${res.status}`);
      return null;
    }

    const raw = await res.json();

    const weatherData: WeatherData & { cachedAt: string } = {
      temp: Math.round(raw.main?.temp || 0),
      feels_like: Math.round(raw.main?.feels_like || 0),
      humidity: raw.main?.humidity || 0,
      wind_speed: raw.wind?.speed || 0,
      clouds: raw.clouds?.all || 0,
      description: raw.weather?.[0]?.description || 'Tidak diketahui',
      icon: raw.weather?.[0]?.icon || '01d',
      city: raw.name || undefined,
      country: raw.sys?.country || undefined,
      lat: latNum,
      lon: lonNum,
      timestamp: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
    };

    // 3. Save to memory cache (keep max 100 entries to prevent memory leak)
    if (memoryCache.size > 100) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }
    memoryCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

    return weatherData;
  } catch (error) {
    console.error('[OpenWeather Lib] Error fetching weather:', error);
    return null;
  }
}
