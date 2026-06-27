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
      cache: 'no-store',
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
        cache: 'no-store',
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

export async function GET() {
  try {
    const [iss, astronautDataset] = await Promise.all([
      fetchIssPosition(),
      loadAstronautDataset(),
    ]);

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      iss,
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
