import { NextResponse } from 'next/server';
import { fetchAndCacheWeather } from '@/lib/openweather';

export const dynamic = 'force-dynamic';

type ResolvedLocation = {
  label: string;
  latitude: number;
  longitude: number;
  source: string;
};

function parseCoordinateQuery(query: string): ResolvedLocation | null {
  const normalized = query
    .replace(/lat(?:itude)?\s*[:=]/gi, '')
    .replace(/lon(?:gitude)?\s*[:=]/gi, '')
    .replace(/[|;]/g, ',')
    .trim();
  
  // Mendukung format "lat, lon" atau "lat lon"
  const match = normalized.match(/(-?\d+(?:\.\d+)?)\s*,?\s+(-?\d+(?:\.\d+)?)/) || normalized.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);

  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  
  const candidates = [
    { latitude: first, longitude: second },
    { latitude: second, longitude: first },
  ];
  
  const coordinate = candidates.find(({ latitude, longitude }) => (
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  ));

  if (!coordinate) return null;

  return {
    ...coordinate,
    label: `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`,
    source: 'Koordinat',
  };
}

function buildOsmLabel(place: any) {
  const address = place.address || {};
  return [
    address.road,
    address.neighbourhood || address.suburb || address.village || address.hamlet,
    address.city_district || address.district || address.county,
    address.city || address.town || address.municipality || address.regency,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .join(', ') || place.display_name || 'Lokasi terpilih';
}

async function reverseCoordinateLabel(location: ResolvedLocation) {
  try {
    const reverseUrl = new URL('https://nominatim.openstreetmap.org/reverse');
    reverseUrl.searchParams.set('format', 'jsonv2');
    reverseUrl.searchParams.set('lat', String(location.latitude));
    reverseUrl.searchParams.set('lon', String(location.longitude));
    reverseUrl.searchParams.set('zoom', '16');
    reverseUrl.searchParams.set('addressdetails', '1');

    const response = await fetch(reverseUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'id,en;q=0.8',
        'User-Agent': 'MeteoritIndonesia/1.0 (https://meteorit.my.id)',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) return location;
    const data = await response.json();
    return {
      ...location,
      label: buildOsmLabel(data),
    };
  } catch {
    return location;
  }
}

async function geocodeWithOpenStreetMap(query: string): Promise<ResolvedLocation | null> {
  const fetchGeocode = async (useCountryFilter: boolean) => {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');
    if (useCountryFilter) {
      url.searchParams.set('countrycodes', 'id'); // Prioritaskan pencarian di Indonesia
    }

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'id,en;q=0.8',
        'User-Agent': 'MeteoritIndonesia/1.0 (https://meteorit.my.id)',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) throw new Error(`OpenStreetMap status ${response.status}`);
    const places = await response.json();
    return places?.[0];
  };

  // 1. Coba batasi di Indonesia terlebih dahulu agar pencarian kawasan/kecamatan/jalan lokal akurat
  let place = await fetchGeocode(true).catch(() => null);

  // 2. Jika tidak ditemukan, cari secara global (untuk kota/negara luar negeri)
  if (!place) {
    place = await fetchGeocode(false).catch(() => null);
  }

  if (!place) return null;

  return {
    label: buildOsmLabel(place),
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    source: 'OpenStreetMap',
  };
}

async function geocodeWithOpenMeteo(query: string): Promise<ResolvedLocation | null> {
  try {
    const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    geocodeUrl.searchParams.set('name', query);
    geocodeUrl.searchParams.set('count', '1');
    geocodeUrl.searchParams.set('language', 'id');
    geocodeUrl.searchParams.set('format', 'json');

    const geocodeRes = await fetch(geocodeUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
    });

    if (!geocodeRes.ok) throw new Error(`Open-Meteo Geocoding status ${geocodeRes.status}`);
    const geocode = await geocodeRes.json();
    const place = geocode.results?.[0];
    if (!place) return null;

    const label = [place.name, place.admin2, place.admin1, place.country]
      .filter(Boolean)
      .filter((item, index, items) => items.indexOf(item) === index)
      .join(', ');

    return {
      label,
      latitude: place.latitude,
      longitude: place.longitude,
      source: 'Open-Meteo',
    };
  } catch (err) {
    console.warn('[Open-Meteo Geocoder] Gagal:', err);
    return null;
  }
}

async function fetchWeatherDirectlyWithOpenWeatherQuery(q: string, lang: string) {
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'c5d9548ca431c734f6a6f9beda41a9a1';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=${lang}`;
  const res = await fetch(url, { cache: 'no-store' });
  
  if (!res.ok) {
    return NextResponse.json({ success: false, error: `Lokasi "${q}" tidak ditemukan.` }, { status: 404 });
  }
  
  const raw = await res.json();
  const data = {
    temp: Math.round(raw.main?.temp || 0),
    feels_like: Math.round(raw.main?.feels_like || 0),
    humidity: raw.main?.humidity || 0,
    wind_speed: raw.wind?.speed || 0,
    clouds: raw.clouds?.all || 0,
    description: raw.weather?.[0]?.description || 'Tidak diketahui',
    icon: raw.weather?.[0]?.icon || '01d',
    city: raw.name,
    country: raw.sys?.country,
    lat: raw.coord?.lat || 0,
    lon: raw.coord?.lon || 0,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json({ success: true, data });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const q = searchParams.get('q');
  const lang = searchParams.get('lang') || 'id';

  // Jika parameter q disediakan (pencarian lokasi teks atau koordinat manual)
  if (q) {
    try {
      // 1. Coba parse koordinat
      const coordinateLocation = parseCoordinateQuery(q);
      
      let resolvedLoc: ResolvedLocation | null = null;
      if (coordinateLocation) {
        resolvedLoc = await reverseCoordinateLabel(coordinateLocation);
      } else {
        // 2. Geocode alamat spesifik
        resolvedLoc = await geocodeWithOpenStreetMap(q);
        
        // 3. Fallback ke Open-Meteo
        if (!resolvedLoc) {
          resolvedLoc = await geocodeWithOpenMeteo(q);
        }
      }

      if (!resolvedLoc) {
        // 4. Fallback terakhir ke OpenWeather API query langsung
        return await fetchWeatherDirectlyWithOpenWeatherQuery(q, lang);
      }

      // Ambil data cuaca dari OpenWeather berdasarkan koordinat hasil geocoding
      const data = await fetchAndCacheWeather(resolvedLoc.latitude, resolvedLoc.longitude, lang);
      if (!data) {
        throw new Error('Gagal mengambil data cuaca untuk lokasi tergeocoding.');
      }

      // Timpa nama kota dengan label hasil geocoding agar menampilkan detail (kecamatan/jalan) di UI
      data.city = resolvedLoc.label;

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error('[OpenWeather Route] Error processing query q:', error);
      // Fallback jika geocoder gagal
      try {
        return await fetchWeatherDirectlyWithOpenWeatherQuery(q, lang);
      } catch (fbErr) {
        return NextResponse.json({ success: false, error: String(fbErr) }, { status: 500 });
      }
    }
  }

  // Jika parameter lat dan lon disediakan langsung
  if (!lat || !lon) {
    return NextResponse.json({ error: 'Parameter lat dan lon diperlukan.' }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || isNaN(lonNum)) {
    return NextResponse.json({ error: 'Nilai lat/lon tidak valid.' }, { status: 400 });
  }

  try {
    const data = await fetchAndCacheWeather(latNum, lonNum, lang);
    if (!data) {
      throw new Error('Gagal mengambil data cuaca dari OpenWeather.');
    }
    
    // Reverse geocode koordinat yang dikirim langsung agar nama lokasi presisi
    try {
      const coordLoc = {
        latitude: latNum,
        longitude: lonNum,
        label: `${latNum.toFixed(5)}, ${lonNum.toFixed(5)}`,
        source: 'Koordinat'
      };
      const resolved = await reverseCoordinateLabel(coordLoc);
      data.city = resolved.label;
    } catch (e) {
      console.warn('[OpenWeather Route] Gagal reverse geocode untuk lat/lon:', e);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[OpenWeather API] Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
