import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface NeoObject {
  id: string;
  name: string;
  estimated_diameter_min_km: number;
  estimated_diameter_max_km: number;
  is_potentially_hazardous: boolean;
  close_approach_date: string;
  miss_distance_km: number;
  relative_velocity_km_per_h: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 1;

    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let endDateStr = todayStr;
    if (days > 1) {
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + (days - 1));
      endDateStr = endDate.toISOString().split('T')[0];
    }

    const res = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${todayStr}&end_date=${endDateStr}&api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      throw new Error(`NASA NeoWs API returned status ${res.status}`);
    }

    const data = await res.json();
    
    let nearEarthObjects: any[] = [];
    if (data.near_earth_objects) {
      if (days === 1) {
        nearEarthObjects = data.near_earth_objects[todayStr] || [];
      } else {
        nearEarthObjects = Object.values(data.near_earth_objects).flat();
      }
    }

    const neos: NeoObject[] = nearEarthObjects.map((neo: any) => {
      const closeApproach = neo.close_approach_data?.[0] || {};
      return {
        id: neo.id,
        name: neo.name,
        estimated_diameter_min_km: neo.estimated_diameter?.kilometers?.estimated_diameter_min || 0,
        estimated_diameter_max_km: neo.estimated_diameter?.kilometers?.estimated_diameter_max || 0,
        is_potentially_hazardous: neo.is_potentially_hazardous_asteroid || false,
        close_approach_date: closeApproach.close_approach_date || todayStr,
        miss_distance_km: parseFloat(closeApproach.miss_distance?.kilometers || '0'),
        relative_velocity_km_per_h: parseFloat(closeApproach.relative_velocity?.kilometers_per_hour || '0'),
      };
    });

    // Sort: hazardous first, then by miss distance
    neos.sort((a, b) => {
      if (a.is_potentially_hazardous !== b.is_potentially_hazardous) {
        return a.is_potentially_hazardous ? -1 : 1;
      }
      return a.miss_distance_km - b.miss_distance_km;
    });

    return NextResponse.json({
      success: true,
      count: neos.length,
      date: todayStr,
      data: neos,
    });
  } catch (error) {
    console.error('[API NASA NEO] Error:', error);
    return NextResponse.json(
      { success: false, count: 0, date: '', data: [], error: String(error) },
      { status: 200 }
    );
  }
}
