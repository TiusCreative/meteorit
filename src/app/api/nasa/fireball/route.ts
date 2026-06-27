import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface FireballEvent {
  date: string;
  energy: string | null;
  impact_e: string | null;
  lat: string | null;
  lon: string | null;
  lat_dir: string | null;
  lon_dir: string | null;
  alt: string | null;
  vel: string | null;
}

export async function GET() {
  try {
    // Fireball data from JPL (no API key needed)
    const res = await fetch(
      'https://ssd-api.jpl.nasa.gov/fireball.api?limit=30&sort=-date',
      { next: { revalidate: 21600 } } // Cache 6 hours
    );

    if (!res.ok) {
      throw new Error(`JPL Fireball API returned status ${res.status}`);
    }

    const raw = await res.json();

    // Map the field names array to structured objects
    const fields: string[] = raw.fields || [];
    const dataRows: (string | null)[][] = raw.data || [];

    const events: FireballEvent[] = dataRows.map((row) => {
      const obj: Record<string, string | null> = {};
      fields.forEach((field, i) => {
        obj[field] = row[i] ?? null;
      });
      return {
        date: obj['date'] || '',
        energy: obj['energy'],
        impact_e: obj['impact-e'],
        lat: obj['lat'],
        lon: obj['lon'],
        lat_dir: obj['lat-dir'],
        lon_dir: obj['lon-dir'],
        alt: obj['alt'],
        vel: obj['vel'],
      };
    });

    return NextResponse.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('[API Fireball] Error:', error);
    return NextResponse.json(
      { success: false, count: 0, data: [], error: String(error) },
      { status: 200 }
    );
  }
}
