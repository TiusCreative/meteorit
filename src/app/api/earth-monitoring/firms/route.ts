import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FIRMS_API_KEY = process.env.FIRMS_API_KEY || '928afc4f93ec07708c5c46bd4d3db1e3';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let source = searchParams.get('source') || 'VIIRS_SNPP_NRT';

    // Pastikan akhiran NRT (Near Real-Time) ada untuk data terbaru agar tidak kosong
    if (source === 'VIIRS_SNPP') {
      source = 'VIIRS_SNPP_NRT';
    } else if (source === 'MODIS') {
      source = 'MODIS_NRT';
    }

    const country = searchParams.get('country') || 'IDN';
    const dayRange = searchParams.get('range') || '1';

    // Map kode negara / parameter area ke bounding box coordinates
    // Indonesia: 95,-11,141,6 (west,south,east,north)
    let areaParam = 'world';
    if (country === 'IDN') {
      areaParam = '95,-11,141,6';
    } else if (country && country.includes(',')) {
      areaParam = country; // Mendukung custom bounding box jika dikirimkan
    }

    // MENGGUNAKAN NASA FIRMS AREA API KARENA COUNTRY API SUDAH DEPRECATED/OUTAGES
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${FIRMS_API_KEY}/${source}/${areaParam}/${dayRange}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`NASA FIRMS API returned status ${res.status}`);
    }

    const text = await res.text();

    // Jika NASA mengembalikan pesan error teks, tangkap di sini
    if (text.includes("invalid api call") || text.includes("error")) {
      throw new Error(`NASA Response Error: ${text}`);
    }

    const hotspots = parseCsvHotspots(text);

    return NextResponse.json({
      success: true,
      count: hotspots.length,
      hotspots,
      updatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[API FIRMS] Error:', err);
    return NextResponse.json({
      success: false,
      error: 'Gagal memuat data titik api NASA FIRMS.',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

interface Hotspot {
  latitude: number;
  longitude: number;
  bright_ti4?: number;
  scan?: number;
  track?: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: string;
  version?: string;
  bright_ti5?: number;
  frp: number;
  daynight: string;
}

function parseCsvHotspots(csvText: string): Hotspot[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const results: Hotspot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < headers.length) continue;

    const entry: any = {};
    headers.forEach((h, idx) => {
      const val = cols[idx];
      if (h === 'latitude' || h === 'longitude' || h === 'frp' || h.startsWith('bright_')) {
        entry[h] = parseFloat(val);
      } else {
        entry[h] = val;
      }
    });

    results.push({
      latitude: entry.latitude || 0,
      longitude: entry.longitude || 0,
      bright_ti4: entry.bright_ti4,
      acq_date: entry.acq_date || '',
      acq_time: entry.acq_time || '',
      satellite: entry.satellite || 'VIIRS',
      confidence: entry.confidence || 'low',
      frp: entry.frp || 0,
      daynight: entry.daynight || 'D',
    });
  }

  return results;
}