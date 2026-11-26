export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { loadAstronautDataset } from '@/lib/astronautData';

export const dynamic = 'force-dynamic';

const ISS_FALLBACK_POSITION = {
  latitude: -6.2,
  longitude: 106.8,
  timestamp: Math.floor(Date.now() / 1000),
  source: 'Fallback',
};

async function fetchIssPosition() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
            headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });

    if (!res.ok) throw new Error(`WhereTheISS status ${res.status}`);
    const data = await res.json();

    return {
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      timestamp: Number(data.timestamp || Math.floor(Date.now() / 1000)),
      source: 'WhereTheISS',
    };
  } catch {
    try {
      const res = await fetch('https://api.open-notify.org/iss-now.json', {
                headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4500),
      });

      if (!res.ok) throw new Error(`Open Notify status ${res.status}`);
      const data = await res.json();

      return {
        latitude: Number(data.iss_position?.latitude),
        longitude: Number(data.iss_position?.longitude),
        timestamp: Number(data.timestamp || Math.floor(Date.now() / 1000)),
        source: 'Open Notify',
      };
    } catch {
      return {
        ...ISS_FALLBACK_POSITION,
        timestamp: Math.floor(Date.now() / 1000),
      };
    }
  }
}

let cachedLaunch: { data: any; expiresAt: number } | null = null;

async function fetchUpcomingLaunchServer() {
  if (cachedLaunch && cachedLaunch.expiresAt > Date.now()) {
    return cachedLaunch.data;
  }

  // 1. RocketLaunch.Live (tanpa rate limit ketat)
  try {
    const res = await fetch('https://fdo.rocketlaunch.live/json/launches/next/1', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      const json = await res.json();
      const r = json?.result?.[0];
      if (r) {
        const mapped = {
          name: r.name || 'Misi Peluncuran Mendatang',
          net: r.net || r.win_open || new Date(Date.now() + 3 * 86400000).toISOString(),
          launch_service_provider: { name: r.provider?.name || 'SpaceX', type: 'Commercial' },
          rocket: { configuration: { name: r.vehicle?.name || 'Falcon 9' } },
          status: { name: r.launch_description || 'Terjadwal' },
          mission: r.missions?.[0] ? { description: r.missions[0].description || '' } : undefined,
        };
        cachedLaunch = { data: mapped, expiresAt: Date.now() + 15 * 60 * 1000 };
        return mapped;
      }
    }
  } catch {}

  // 2. Fallback Launch Library 2 (server-side cached 30 menit agar tidak 429)
  try {
    const res = await fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=1&format=json', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.results?.[0]) {
        cachedLaunch = { data: json.results[0], expiresAt: Date.now() + 30 * 60 * 1000 };
        return json.results[0];
      }
    }
  } catch {}

  return null;
}

export async function GET() {
  try {
    const [iss, astronautDataset, upcomingLaunch] = await Promise.all([
      fetchIssPosition(),
      loadAstronautDataset(),
      fetchUpcomingLaunchServer(),
    ]);

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      iss,
      upcomingLaunch,
      astronauts: astronautDataset.astronauts,
      astronautCount: astronautDataset.astronauts.filter((astronaut) => (astronaut.status || 'active') === 'active').length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memuat live data antariksa.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
