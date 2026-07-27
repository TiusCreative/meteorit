import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const minMag = searchParams.get('minmagnitude') || '1.0';
    const limit = searchParams.get('limit') || '50';
    const startTime = searchParams.get('starttime') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endTime = searchParams.get('endtime') || new Date().toISOString().split('T')[0];
    const scope = searchParams.get('scope') || 'all'; // 'all' or 'indonesia'

    let url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=${minMag}&limit=${limit}&starttime=${startTime}&endtime=${endTime}`;

    if (scope === 'indonesia') {
      // Indonesia Bounding Box: minlatitude=-11, maxlatitude=6, minlongitude=95, maxlongitude=141
      url += `&minlatitude=-11&maxlatitude=6&minlongitude=95&maxlongitude=141`;
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`USGS API returned status ${res.status}`);
    }

    const data = await res.json();
    const features = data.features || [];

    // Map features to a simpler format for display
    const earthquakes = features.map((f: any) => {
      const p = f.properties || {};
      const g = f.geometry || {};
      const coords = g.coordinates || []; // [long, lat, depth]

      return {
        id: f.id,
        title: p.title || 'Gempa Bumi',
        place: p.place || 'Lokasi tidak diketahui',
        time: p.time ? new Date(p.time).toISOString() : null,
        updated: p.updated ? new Date(p.updated).toISOString() : null,
        tz: p.tz || 0,
        url: p.url || '',
        detail: p.detail || '',
        felt: p.felt || 0,
        cdi: p.cdi || null,
        mmi: p.mmi || null,
        alert: p.alert || null,
        status: p.status || 'reviewed',
        tsunami: p.tsunami || 0,
        sig: p.sig || 0,
        net: p.net || '',
        code: p.code || '',
        ids: p.ids || '',
        sources: p.sources || '',
        types: p.types || '',
        nst: p.nst || 0,
        dmin: p.dmin || 0,
        rms: p.rms || 0,
        gap: p.gap || 0,
        magType: p.magType || 'ml',
        type: p.type || 'earthquake',
        magnitude: p.mag || 0,
        longitude: coords[0] || 0,
        latitude: coords[1] || 0,
        depth: coords[2] || 0, // Depth in km
      };
    });

    // Calculate stats
    const totalCount = earthquakes.length;
    const maxMag = totalCount > 0 ? Math.max(...earthquakes.map((e: any) => e.magnitude)) : 0;
    const feltCount = earthquakes.filter((e: any) => e.felt > 0).length;
    const tsunamiCount = earthquakes.filter((e: any) => e.tsunami === 1).length;

    // Daily distribution count (last 7 days)
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyCounts[d] = 0;
    }
    earthquakes.forEach((e: any) => {
      if (e.time) {
        const d = e.time.split('T')[0];
        if (dailyCounts[d] !== undefined) {
          dailyCounts[d]++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCount,
        maxMag,
        feltCount,
        tsunamiCount,
        dailyCounts
      },
      earthquakes,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API USGS] Error:', err);
    return NextResponse.json({
      success: false,
      error: 'Gagal memuat data gempa bumi USGS.',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
