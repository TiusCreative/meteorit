import { NextResponse } from 'next/server';
import { fetchLatestBmkgEarthquake } from '@/lib/earthMonitoring';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const earthquake = await fetchLatestBmkgEarthquake();
    return NextResponse.json({
      source: 'BMKG autogempa',
      updatedAt: new Date().toISOString(),
      earthquake,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Gagal membaca data gempa BMKG.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
