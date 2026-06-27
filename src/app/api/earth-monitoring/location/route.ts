import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type GeocodingResult = {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
  country?: string;
};

type ResolvedLocation = {
  label: string;
  latitude: number;
  longitude: number;
  source: 'Koordinat' | 'OpenStreetMap' | 'Open-Meteo';
};

function buildPlaceLabel(place: GeocodingResult) {
  return [place.name, place.admin2, place.admin1, place.country]
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .join(', ');
}

function parseCoordinateQuery(query: string): ResolvedLocation | null {
  const normalized = query
    .replace(/lat(?:itude)?\s*[:=]/gi, '')
    .replace(/lon(?:gitude)?\s*[:=]/gi, '')
    .replace(/[|;]/g, ',')
    .trim();
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
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'id');

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
  const place = places?.[0];
  if (!place) return null;

  return {
    label: buildOsmLabel(place),
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    source: 'OpenStreetMap',
  };
}

async function geocodeWithOpenMeteo(query: string): Promise<ResolvedLocation | null> {
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
  const place = geocode.results?.[0] as GeocodingResult | undefined;
  if (!place) return null;

  return {
    label: buildPlaceLabel(place),
    latitude: place.latitude,
    longitude: place.longitude,
    source: 'Open-Meteo',
  };
}

function weatherCodeLabel(code: number) {
  if ([0, 1].includes(code)) return 'Cerah';
  if ([2, 3].includes(code)) return 'Berawan';
  if ([45, 48].includes(code)) return 'Berkabut';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Gerimis';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Hujan';
  if ([95, 96, 99].includes(code)) return 'Badai petir';
  return 'Cuaca variatif';
}

function rainIntensity(precipitation: number, probability: number) {
  return Math.min(100, Math.round(Math.max(probability, precipitation * 22)));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();

  if (query.length < 3) {
    return NextResponse.json({ error: 'Masukkan minimal 3 karakter lokasi.' }, { status: 400 });
  }

  try {
    const coordinateLocation = parseCoordinateQuery(query);
    const location = coordinateLocation
      ? await reverseCoordinateLabel(coordinateLocation)
      : await geocodeWithOpenStreetMap(query).catch(() => null) || await geocodeWithOpenMeteo(query);

    if (!location) {
      return NextResponse.json({ error: 'Lokasi tidak ditemukan.' }, { status: 404 });
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', String(location.latitude));
    forecastUrl.searchParams.set('longitude', String(location.longitude));
    forecastUrl.searchParams.set('timezone', 'Asia/Jakarta');
    forecastUrl.searchParams.set('current', [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'rain',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'shortwave_radiation',
    ].join(','));
    forecastUrl.searchParams.set('hourly', 'precipitation_probability');
    forecastUrl.searchParams.set('forecast_days', '1');

    const forecastRes = await fetch(forecastUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
    });

    if (!forecastRes.ok) throw new Error(`Forecast status ${forecastRes.status}`);
    const forecast = await forecastRes.json();
    const current = forecast.current || {};
    const hourlyTimes = Array.isArray(forecast.hourly?.time) ? forecast.hourly.time : [];
    const currentHour = typeof current.time === 'string' ? current.time.slice(0, 13) : '';
    const probabilityIndex = hourlyTimes.findIndex((time: string) => time.startsWith(currentHour));
    const probability = Number(forecast.hourly?.precipitation_probability?.[probabilityIndex >= 0 ? probabilityIndex : 0] || 0);
    const precipitation = Number(current.precipitation || current.rain || 0);

    return NextResponse.json({
      success: true,
      source: 'Open-Meteo',
      updatedAt: new Date().toISOString(),
      location: {
        query,
        label: location.label,
        latitude: location.latitude,
        longitude: location.longitude,
        geocodingSource: location.source,
      },
      weather: {
        temp: Number(current.temperature_2m || 0),
        humidity: Number(current.relative_humidity_2m || 0),
        condition: weatherCodeLabel(Number(current.weather_code || 0)),
        precipitation,
        rainProbability: probability,
        rainIntensity: rainIntensity(precipitation, probability),
      },
      energy: {
        wind: Number(current.wind_speed_10m || 0),
        windDirection: Number(current.wind_direction_10m || 0),
        solarRadiation: Number(current.shortwave_radiation || 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Gagal membaca data lokasi realtime.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
