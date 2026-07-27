import { NextRequest, NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1Client';

export const dynamic = 'force-dynamic';

const FIRMS_API_KEY = process.env.FIRMS_API_KEY || '928afc4f93ec07708c5c46bd4d3db1e3';

const VOLCANO_COORDS: Record<string, [number, number]> = {
  'merapi': [-7.540231, 110.446132],
  'lewotobi laki-laki': [-8.53, 122.78],
  'lewotobi': [-8.53, 122.78],
  'semeru': [-8.108, 112.92],
  'anak krakatau': [-6.102, 105.423],
  'krakatau': [-6.102, 105.423],
  'ibu': [1.488, 127.63],
  'marapi': [-0.38, 100.47],
  'dukono': [1.685, 127.894],
  'sinabung': [3.17, 98.39],
  'kerinci': [-1.697, 101.264],
  'raung': [-8.125, 114.042],
  'karangetang': [2.78, 125.40],
  'soputan': [1.112, 124.73]
};

const INDO_CITIES = [
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Surabaya', lat: -7.2504, lon: 112.7688 },
  { name: 'Bandung', lat: -6.9175, lon: 107.6191 },
  { name: 'Medan', lat: 3.5952, lon: 98.6722 },
  { name: 'Makassar', lat: -5.1476, lon: 119.4327 },
  { name: 'Denpasar', lat: -8.6500, lon: 115.2167 },
  { name: 'Yogyakarta', lat: -7.7956, lon: 110.3695 },
  { name: 'Palembang', lat: -2.9909, lon: 104.7565 },
  { name: 'Banjarmasin', lat: -3.3194, lon: 114.5908 },
  { name: 'Jayapura', lat: -2.5413, lon: 140.7181 }
];

function getWeatherDesc(code: number): string {
  const codes: Record<number, string> = {
    0: 'Cerah',
    1: 'Cerah Berawan',
    2: 'Berawan',
    3: 'Mendung',
    45: 'Kabut',
    48: 'Kabut Rime',
    51: 'Gerimis Ringan',
    53: 'Gerimis Sedang',
    55: 'Gerimis Lebat',
    56: 'Gerimis Beku Ringan',
    57: 'Gerimis Beku Lebat',
    61: 'Hujan Ringan',
    63: 'Hujan Sedang',
    65: 'Hujan Lebat',
    66: 'Hujan Beku Ringan',
    67: 'Hujan Beku Lebat',
    71: 'Salju Ringan',
    73: 'Salju Sedang',
    75: 'Salju Lebat',
    77: 'Butiran Salju',
    80: 'Hujan Shower Ringan',
    81: 'Hujan Shower Sedang',
    82: 'Hujan Shower Lebat',
    85: 'Hujan Salju Ringan',
    86: 'Hujan Salju Lebat',
    95: 'Badai Petir',
    96: 'Badai Petir dengan Es Ringan',
    99: 'Badai Petir dengan Es Lebat'
  };
  return codes[code] || 'Cuaca Tidak Diketahui';
}

function isNear(lat1: number, lon1: number, lat2: number, lon2: number, maxDiff = 0.5): boolean {
  return Math.abs(lat1 - lat2) <= maxDiff && Math.abs(lon1 - lon2) <= maxDiff;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const category = searchParams.get('category') || 'all'; // all, volcano, quake, hotspots, tsunami, cyclone, flood, weather
    const searchQuery = (searchParams.get('searchQuery') || '').toLowerCase().trim();
    const region = searchParams.get('region') || 'all'; // all, indonesia

    // Geocode searchQuery to support custom cities/districts (like Bekasi, Cikarang)
    let targetCoords: [number, number] | null = null;
    if (searchQuery) {
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=id&format=json`;
        const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(2500) });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const firstResult = geoData.results?.[0];
          if (firstResult) {
            targetCoords = [firstResult.latitude, firstResult.longitude];
          }
        }
      } catch (err) {
        console.warn('[Data Center API] Geocoding query failed:', err);
      }
    }

    const results: any[] = [];
    const tasks: Promise<void>[] = [];

    // 1. FETCH VOLCANO LOGS FROM D1 (with enriched metadata)
    if (category === 'all' || category === 'volcano') {
      tasks.push((async () => {
        try {
          // Pre-fetch current volcano details to merge metadata
          let volcanoesMap = new Map<string, any>();
          try {
            const volcanoesDbResult = await queryD1(`SELECT * FROM volcanoes`);
            if (volcanoesDbResult && volcanoesDbResult.results) {
              volcanoesDbResult.results.forEach((v: any) => {
                if (v.name) {
                  volcanoesMap.set(v.name.toLowerCase().trim(), v);
                }
              });
            }
          } catch (dbErr) {
            console.error('[Data Center API] Error pre-fetching volcanoes details:', dbErr);
          }

          const dbResult = await queryD1(
            `SELECT * FROM volcano_activity_log 
             WHERE timestamp >= ? AND timestamp <= ? 
             ORDER BY timestamp DESC`,
            [startDate + 'T00:00:00.000Z', endDate + 'T23:59:59.999Z']
          );
          const volcanoLogs = dbResult.results || [];
          volcanoLogs.forEach((log: any) => {
            const name = log.volcano_name || '';
            const lowercaseName = name.toLowerCase().trim();
            const lowercaseDesc = (log.description || '').toLowerCase();
            
            const vDetail = volcanoesMap.get(lowercaseName);
            const coords = vDetail
              ? [vDetail.latitude || VOLCANO_COORDS[lowercaseName]?.[0] || -7.54, vDetail.longitude || VOLCANO_COORDS[lowercaseName]?.[1] || 110.44]
              : (VOLCANO_COORDS[lowercaseName] || [-7.54, 110.44]);

            // Match search query (text match or location proximity)
            const matchesQuery = !searchQuery || 
              lowercaseName.includes(searchQuery) || 
              lowercaseDesc.includes(searchQuery) ||
              (targetCoords && isNear(coords[0], coords[1], targetCoords[0], targetCoords[1]));

            if (!matchesQuery) {
              return;
            }

            let extraDetails = '';
            if (vDetail) {
              const ashHeight = vDetail.ash_height > 0 ? `${vDetail.ash_height} m` : 'Tidak teramati';
              const ashDir = vDetail.ash_direction || 'Nihil';
              const weather = vDetail.weather || 'Cerah';
              const riskAviation = vDetail.risk_aviation || 'GREEN';
              const riskResident = vDetail.risk_resident || 'NORMAL';
              const riskHiker = vDetail.risk_hiker || 'NORMAL';
              const aviationCode = vDetail.aviation_code || 'GREEN';

              extraDetails = ` &bull; Tinggi Kolom Abu: ${ashHeight} &bull; Arah Abu: ${ashDir} &bull; Cuaca Sekitar: ${weather} &bull; Kode Aviasi: ${aviationCode} &bull; Risiko Penerbangan: ${riskAviation} &bull; Risiko Penduduk: ${riskResident} &bull; Risiko Pendaki: ${riskHiker}`;
            }

            results.push({
              id: log.id,
              type: 'volcano',
              title: `Gunung ${name} - Aktivitas Vulkanik`,
              location: name,
              latitude: coords[0],
              longitude: coords[1],
              severity: log.status_level === 'Awas' ? 'CRITICAL' : log.status_level === 'Siaga' ? 'HIGH' : 'MODERATE',
              timestamp: log.timestamp,
              details: `${log.description || 'Aktivitas gunung api terekam.'}${extraDetails} &bull; Sumber: ESDM MAGMA Indonesia`
            });
          });
        } catch (dbErr) {
          console.error('[Data Center API] Error querying D1 for volcano logs:', dbErr);
        }
      })());
    }

    // 2. FETCH EARTHQUAKES AND TSUNAMIS FROM USGS (with enriched properties)
    if (category === 'all' || category === 'quake' || category === 'tsunami') {
      tasks.push((async () => {
        try {
          let usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&endtime=${endDate}&minmagnitude=1.0`;
          if (region === 'indonesia') {
            usgsUrl += `&minlatitude=-11&maxlatitude=6&minlongitude=95&maxlongitude=141`;
          }

          const res = await fetch(usgsUrl, { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            const data = await res.json();
            const features = data.features || [];
            features.forEach((f: any) => {
              const p = f.properties || {};
              const g = f.geometry || {};
              const coords = g.coordinates || [0, 0, 0];
              const place = p.place || 'Lokasi tidak diketahui';
              const lowercasePlace = place.toLowerCase();

              // Match search query (text match or location proximity)
              const matchesQuery = !searchQuery || 
                lowercasePlace.includes(searchQuery) ||
                (targetCoords && isNear(coords[1], coords[0], targetCoords[0], targetCoords[1]));

              if (!matchesQuery) {
                return;
              }

              const magnitude = p.mag || 0;
              const timeISO = p.time ? new Date(p.time).toISOString() : new Date().toISOString();
              const isTsunamiEvent = p.tsunami === 1;

              if (category === 'tsunami' && !isTsunamiEvent) {
                return;
              }

              const type = isTsunamiEvent ? 'tsunami' : 'quake';
              const severity = isTsunamiEvent 
                ? 'CRITICAL' 
                : magnitude >= 6.0 ? 'CRITICAL' : magnitude >= 5.0 ? 'HIGH' : magnitude >= 4.0 ? 'MODERATE' : 'LOW';

              const felt = p.felt ?? null;
              const sig = p.sig ?? null;
              const rms = p.rms ?? null;
              const gap = p.gap ?? null;
              const alert = p.alert ?? null;
              const cdi = p.cdi ?? null;
              const mmi = p.mmi ?? null;

              const tsunamiPotential = isTsunamiEvent ? '🚨 Ya (Berpotensi Tsunami)' : 'Tidak berpotensi';
              const feltStr = felt ? ` &bull; Dirasakan: ${felt} laporan (skala cdi: ${cdi || '-'})` : '';
              const sigStr = sig ? ` &bull; Signifikansi: ${sig}` : '';
              const rmsStr = rms ? ` &bull; RMS: ${rms}s` : '';
              const gapStr = gap ? ` &bull; Azimuthal Gap: ${gap}°` : '';
              const alertStr = alert ? ` &bull; Tingkat Siaga: ${alert.toUpperCase()}` : '';
              const mmiStr = mmi ? ` &bull; Intensitas MMI Maks: ${mmi}` : '';

              results.push({
                id: f.id,
                type: type,
                title: isTsunamiEvent ? `Peringatan Tsunami: Gempa M ${magnitude.toFixed(1)} - ${place}` : `Gempa Bumi M ${magnitude.toFixed(1)} - ${place}`,
                location: place,
                latitude: coords[1],
                longitude: coords[0],
                severity: severity,
                timestamp: timeISO,
                details: `Magnitudo: ${magnitude.toFixed(1)} M &bull; Kedalaman: ${coords[2] || 0} km &bull; Koordinat: ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)} &bull; Potensi Tsunami: ${tsunamiPotential}${mmiStr}${feltStr}${sigStr}${rmsStr}${gapStr}${alertStr} &bull; Sumber: USGS TEWS / GEOFON`
              });
            });
          }
        } catch (quakeErr) {
          console.error('[Data Center API] Error querying USGS:', quakeErr);
        }
      })());
    }

    // 2.5 FETCH FLOODS, CYCLONES, AND EXTREME WEATHER FROM NASA EONET v3 (Date-ranged, status=all)
    if (category === 'all' || category === 'cyclone' || category === 'flood' || category === 'weather') {
      tasks.push((async () => {
        try {
          const eonetUrl = `https://eonet.gsfc.nasa.gov/api/v3/events?start=${startDate}&end=${endDate}&status=all&limit=200`;
          const eonetRes = await fetch(eonetUrl, { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) });
          if (eonetRes.ok) {
            const eonetData = await eonetRes.json();
            const events = eonetData.events || [];
            events.forEach((event: any) => {
              const cats = (event.categories || []).map((c: any) => c.id);
              let type = '';
              let severity = 'MODERATE';
              
              if (cats.includes('severeStorms')) {
                type = 'cyclone';
                severity = 'HIGH';
              } else if (cats.includes('floods')) {
                type = 'flood';
                severity = 'MODERATE';
              } else if (cats.includes('tempExtremes') || cats.includes('landslides') || cats.includes('dust') || cats.includes('wildfires')) {
                type = 'weather';
                severity = 'LOW';
              } else {
                return; // Skip other categories
              }

              if (category !== 'all' && category !== type) {
                return;
              }

              const title = event.title || 'Fenomena Hidrometeorologi';
              const lowercaseTitle = title.toLowerCase();

              const geometries = event.geometry || [];
              if (geometries.length === 0) return;

              const latestGeom = geometries[geometries.length - 1];
              const coords = latestGeom.coordinates || [0, 0];
              const timeISO = latestGeom.date || new Date().toISOString();

              const isIndo = coords[0] >= 95 && coords[0] <= 141 && coords[1] >= -11 && coords[1] <= 6;
              if (region === 'indonesia' && !isIndo) {
                return;
              }

              // Match search query (text match or location proximity)
              const matchesQuery = !searchQuery || 
                lowercaseTitle.includes(searchQuery) ||
                (targetCoords && isNear(coords[1], coords[0], targetCoords[0], targetCoords[1]));

              if (!matchesQuery) {
                return;
              }

              const sources = (event.sources || []).map((s: any) => s.id).join(', ') || 'NASA EONET';
              const locationStr = isIndo ? `Indonesia (Wilayah Spasial EONET)` : `Global (${coords[1].toFixed(2)}, ${coords[0].toFixed(2)})`;

              results.push({
                id: event.id,
                type: type,
                title: title,
                location: locationStr,
                latitude: coords[1],
                longitude: coords[0],
                severity: severity,
                timestamp: timeISO,
                details: `Sumber: ${sources} &bull; Kategori: ${event.categories.map((c: any) => c.title).join(', ')} &bull; Koordinat: ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)} &bull; Deskripsi: ${event.description || 'Tidak ada deskripsi tambahan.'}`
              });
            });
          }
        } catch (eonetErr) {
          console.error('[Data Center API] Error querying EONET:', eonetErr);
        }
      })());
    }

    // 3. FETCH HOTSPOTS FROM NASA FIRMS (MODIS NRT - has actual Indonesia data)
    if (category === 'all' || category === 'hotspots') {
      tasks.push((async () => {
        try {
          // MODIS NRT supports max 2 days per request with date. VIIRS NRT often has no data for Indonesia.
          const areaParam = '95,-11,141,6';
          // Fetch both MODIS Terra+Aqua and VIIRS NOAA-20 in parallel for best coverage
          const modisFetch = fetch(
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_API_KEY}/MODIS_NRT/${areaParam}/2`,
            { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) }
          );
          const viirsFetch = fetch(
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_API_KEY}/VIIRS_NOAA20_NRT/${areaParam}/2`,
            { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) }
          );

          const [modisRes, viirsRes] = await Promise.allSettled([modisFetch, viirsFetch]);

          const parseFirmsCsv = async (res: Response | null) => {
            if (!res || !res.ok) return [];
            const csvText = await res.text();
            if (!csvText || csvText.includes('Invalid') || csvText.includes('invalid') || csvText.startsWith('error')) return [];
            const lines = csvText.split('\n').map((l: string) => l.trim()).filter(Boolean);
            if (lines.length <= 1) return [];
            const headers = lines[0].split(',');
            const rows: any[] = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',');
              if (cols.length < headers.length) continue;
              const entry: any = {};
              headers.forEach((h: string, idx: number) => { entry[h] = cols[idx]; });
              rows.push(entry);
            }
            return rows;
          };

          const modisRows = await parseFirmsCsv(modisRes.status === 'fulfilled' ? modisRes.value : null);
          const viirsRows = await parseFirmsCsv(viirsRes.status === 'fulfilled' ? viirsRes.value : null);
          const allRows = [...modisRows, ...viirsRows];

          // Filter by date range on the client side (acq_date field)
          const seenIds = new Set<string>();
          for (const entry of allRows) {
            const acqDate = entry.acq_date || '';
            // Only include rows within the requested date range
            if (acqDate < startDate || acqDate > endDate) continue;

            const lat = parseFloat(entry.latitude || '0');
            const lon = parseFloat(entry.longitude || '0');
            const frp = parseFloat(entry.frp || '0');
            const confidence = entry.confidence || 'low';
            const satellite = entry.satellite || entry.instrument || 'MODIS';
            const instrument = entry.instrument || 'MODIS';
            const acqTime = String(entry.acq_time || '0000').padStart(4, '0');
            const hotspotId = `hotspot-${lat}-${lon}-${acqDate}-${acqTime}`;

            if (seenIds.has(hotspotId)) continue;
            seenIds.add(hotspotId);

            // Match query by proximity (wider range for fire hotspots: 1.5 degrees)
            const matchesQuery = !searchQuery ||
              (targetCoords && isNear(lat, lon, targetCoords[0], targetCoords[1], 1.5));
            if (!matchesQuery) continue;

            const timeHour = acqTime.substring(0, 2);
            const timeMin = acqTime.substring(2, 4);

            results.push({
              id: hotspotId,
              type: 'hotspots',
              title: `Titik Api Karhutla (FRP: ${frp.toFixed(1)} MW)`,
              location: `Koordinat: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
              latitude: lat,
              longitude: lon,
              severity: frp >= 50 ? 'HIGH' : frp >= 20 ? 'MODERATE' : 'LOW',
              timestamp: `${acqDate}T${timeHour}:${timeMin}:00.000Z`,
              details: `Satelit: ${satellite} &bull; Instrumen: ${instrument} &bull; Kepercayaan (Confidence): ${confidence} &bull; Kekuatan Termal (FRP): ${frp.toFixed(1)} MW &bull; Waktu Deteksi: UTC ${acqDate} ${timeHour}:${timeMin} &bull; Sumber: NASA FIRMS MODIS/VIIRS`
            });
          }
        } catch (hotspotErr) {
          console.error('[Data Center API] Error querying FIRMS:', hotspotErr);
        }
      })());
    }

    // 4. FETCH WEATHER DATA - Current forecast OR historical archive depending on date range
    if (category === 'all' || category === 'weather') {
      tasks.push((async () => {
        try {
          const todayStr = new Date().toISOString().split('T')[0];

          // Resolve city targets: geocode searchQuery → specific city, else use static list
          let targets = INDO_CITIES;
          if (searchQuery) {
            try {
              const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=id&format=json`;
              const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(3000) });
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                const foundTargets = (geoData.results || [])
                  .filter((r: any) => r.country_code === 'ID' || r.country === 'Indonesia' || (r.timezone && r.timezone.includes('Asia')))
                  .map((r: any) => ({ name: r.name, lat: r.latitude, lon: r.longitude }));
                if (foundTargets.length > 0) targets = foundTargets;
              }
            } catch (geoErr) {
              console.warn('[Data Center API] Geocoding failed, using static cities');
            }
          }

          const lats = targets.map(c => c.lat).join(',');
          const lons = targets.map(c => c.lon).join(',');

          // CASE 1: Date range includes today or is in future → use forecast API
          if (endDate >= todayStr) {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=Asia%2FJakarta`;
            const res = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(6000) });
            if (res.ok) {
              const data = await res.json();
              const currentList = Array.isArray(data) ? data : [data];
              currentList.forEach((item: any, idx: number) => {
                const city = targets[idx];
                if (!city) return;
                const current = item.current || {};
                const temp = current.temperature_2m ?? 25;
                const humidity = current.relative_humidity_2m ?? 80;
                const windSpeed = current.wind_speed_10m ?? 0;
                const precip = current.precipitation ?? 0;
                const code = current.weather_code ?? 0;
                const desc = getWeatherDesc(code);
                const severity = code >= 95 ? 'HIGH' : (code === 65 || code === 82 || precip > 10) ? 'MODERATE' : 'LOW';
                results.push({
                  id: `weather-city-${city.name.toLowerCase()}-${city.lat}-${city.lon}`,
                  type: 'weather',
                  title: `Cuaca di ${city.name}: ${temp}°C, ${desc}`,
                  location: `${city.name}, Indonesia`,
                  latitude: city.lat,
                  longitude: city.lon,
                  severity: severity,
                  timestamp: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
                  details: `Suhu: ${temp}°C &bull; Kelembapan: ${humidity}% &bull; Kecepatan Angin: ${windSpeed} km/jam &bull; Presipitasi: ${precip} mm &bull; Kondisi: ${desc} &bull; Sumber: Open-Meteo Realtime`
                });
              });
            }
          }

          // CASE 2: Date range is historical (startDate < today) → use archive API per city
          // Only do this for up to 3 cities to avoid too many requests
          if (startDate < todayStr) {
            const archiveEndDate = endDate < todayStr ? endDate : new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const archiveTargets = targets.slice(0, 5);
            const archiveFetches = archiveTargets.map(city =>
              fetch(
                `https://archive-api.open-meteo.com/v1/archive?latitude=${city.lat}&longitude=${city.lon}&start_date=${startDate}&end_date=${archiveEndDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Asia%2FJakarta`,
                { next: { revalidate: 3600 }, signal: AbortSignal.timeout(6000) }
              ).then(r => r.ok ? r.json() : null).catch(() => null)
            );
            const archiveResults = await Promise.allSettled(archiveFetches);
            archiveResults.forEach((settled, idx) => {
              if (settled.status !== 'fulfilled' || !settled.value) return;
              const city = archiveTargets[idx];
              const data = settled.value;
              const daily = data.daily || {};
              const times: string[] = daily.time || [];
              times.forEach((dateStr: string, dIdx: number) => {
                const tempMax = daily.temperature_2m_max?.[dIdx] ?? 25;
                const tempMin = daily.temperature_2m_min?.[dIdx] ?? 20;
                const precip = daily.precipitation_sum?.[dIdx] ?? 0;
                const wind = daily.wind_speed_10m_max?.[dIdx] ?? 0;
                const code = daily.weather_code?.[dIdx] ?? 0;
                const desc = getWeatherDesc(code);
                const severity = code >= 95 ? 'HIGH' : (precip > 20) ? 'MODERATE' : 'LOW';
                results.push({
                  id: `weather-hist-${city.name.toLowerCase()}-${dateStr}`,
                  type: 'weather',
                  title: `Cuaca ${city.name} (${dateStr}): ${tempMax}°C, ${desc}`,
                  location: `${city.name}, Indonesia`,
                  latitude: city.lat,
                  longitude: city.lon,
                  severity,
                  timestamp: `${dateStr}T12:00:00.000Z`,
                  details: `Suhu Maks: ${tempMax}°C &bull; Suhu Min: ${tempMin}°C &bull; Presipitasi: ${precip} mm &bull; Kecepatan Angin Maks: ${wind} km/jam &bull; Kondisi: ${desc} &bull; Sumber: Open-Meteo Archive`
                });
              });
            });
          }
        } catch (weatherErr) {
          console.error('[Data Center API] Error querying Open-Meteo weather:', weatherErr);
        }
      })());
    }

    // Await all tasks concurrently
    await Promise.allSettled(tasks);

    // Sort chronologically descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      count: results.length,
      records: results,
      filters: { startDate, endDate, category, searchQuery, region },
      updatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Data Center API General Error]:', err);
    return NextResponse.json({
      success: false,
      error: 'Failed to process data center request',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
