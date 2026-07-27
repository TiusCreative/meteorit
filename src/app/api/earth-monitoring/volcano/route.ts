import { NextRequest, NextResponse } from 'next/server';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import { getAbsoluteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Try reading cached data from Cloudflare R2
    const cacheKey = 'data/volcanoes/status.json';
    const cachedData = await fetchJsonFromR2<any>(cacheKey);

    if (cachedData) {
      console.log('[Volcano API] Serving data from Cloudflare R2 cache.');
      return NextResponse.json(cachedData);
    }

    // 2. R2 cache is empty, return fallbacks immediately to prevent loopback deadlocks in dev
    console.log('[Volcano API] Serving fallback data.');

    // 3. Static fallback if everything else fails
    console.error('[Volcano API] Sync failed or cache unavailable. Returning hard fallbacks.');
    return NextResponse.json({
      success: true,
      volcanoes: getFallbackVolcanoes(),
      logs: getFallbackLogs(),
      stats: {
        activeVolcanoes: 3,
        highestActivityVolcano: 'Lewotobi Laki-laki',
        eruptionsToday: 1,
        satelliteHotspots: 2,
        updatedAt: new Date().toISOString()
      },
      source: 'MAGMA Indonesia (ESDM) Fallback',
      updatedAt: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('[Volcano API Route Error]:', err);
    return NextResponse.json({
      success: false,
      error: 'Failed to read volcano data.',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}

function getFallbackVolcanoes() {
  return [
    {
      id: 'merapi',
      name: 'Merapi',
      status: 'Level III (Siaga)',
      latitude: -7.540231,
      longitude: 110.446132,
      status_level: 'Siaga',
      description: 'Erupsi lava pijar aktif dengan guguran sejauh 1.5 km ke barat daya. Daerah bahaya sektoral 3-7 km dari puncak.',
      last_updated: new Date().toISOString(),
      aviation_code: 'ORANGE',
      risk_aviation: 'ORANGE',
      risk_resident: 'ORANGE',
      risk_hiker: 'RED',
      ash_height: 3500,
      ash_direction: 'Barat Daya',
      weather: 'Cerah Berawan'
    },
    {
      id: 'lewotobi-laki-laki',
      name: 'Lewotobi Laki-laki',
      status: 'Level IV (Awas)',
      latitude: -8.53,
      longitude: 122.78,
      status_level: 'Awas',
      description: 'Letusan eksplosif dengan kolom abu tebal kelabu setinggi 2000 meter di atas puncak. Warga diimbau berada di luar radius sektoral 5 km.',
      last_updated: new Date().toISOString(),
      aviation_code: 'RED',
      risk_aviation: 'RED',
      risk_resident: 'RED',
      risk_hiker: 'RED',
      ash_height: 3584,
      ash_direction: 'Barat',
      weather: 'Hujan Gerimis'
    },
    {
      id: 'semeru',
      name: 'Semeru',
      status: 'Level II (Waspada)',
      latitude: -8.108,
      longitude: 112.92,
      status_level: 'Waspada',
      description: 'Aktivitas hembusan gas dan gempa letusan beruntun. Ketinggian asap kelabu mencapai 600 meter condong ke utara.',
      last_updated: new Date().toISOString(),
      aviation_code: 'ORANGE',
      risk_aviation: 'ORANGE',
      risk_resident: 'YELLOW',
      risk_hiker: 'ORANGE',
      ash_height: 4276,
      ash_direction: 'Utara',
      weather: 'Mendung'
    }
  ];
}

function getFallbackLogs() {
  return [
    {
      id: 'vona-merapi-1',
      volcano_name: 'Merapi',
      timestamp: new Date().toISOString(),
      event_type: 'VONA',
      description: 'Rilis VONA Notice 2026/MER/01. Penerbangan waspada oranye. Guguran lava pijar aktif.',
      status_level: 'Siaga'
    },
    {
      id: 'vona-lewotobi-1',
      volcano_name: 'Lewotobi Laki-laki',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      event_type: 'VONA',
      description: 'Rilis VONA Notice 2026/LEW/02. Status Awas merah. Letusan abu vulkanik tinggi.',
      status_level: 'Awas'
    }
  ];
}
