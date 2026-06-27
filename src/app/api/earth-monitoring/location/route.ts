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

function buildPlaceLabel(place: GeocodingResult) {
  return [place.name, place.admin2, place.admin1, place.country]
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .join(', ');
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

    if (!geocodeRes.ok) throw new Error(`Geocoding status ${geocodeRes.status}`);
    const geocode = await geocodeRes.json();
    const place = geocode.results?.[0] as GeocodingResult | undefined;

    if (!place) {
      return NextResponse.json({ error: 'Lokasi tidak ditemukan.' }, { status: 404 });
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', String(place.latitude));
    forecastUrl.searchParams.set('longitude', String(place.longitude));
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
    const probability = Number(forecast.hourly?.precipitation_probability?.[0] || 0);
    const precipitation = Number(current.precipitation || current.rain || 0);

    return NextResponse.json({
      success: true,
      source: 'Open-Meteo',
      updatedAt: new Date().toISOString(),
      location: {
        query,
        label: buildPlaceLabel(place),
        latitude: place.latitude,
        longitude: place.longitude,
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
