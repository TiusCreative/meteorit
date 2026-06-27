import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

    // Fetch last 7 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Fetch CME and Solar Flare in parallel
    const [cmeRes, flrRes] = await Promise.allSettled([
      fetch(
        `https://api.nasa.gov/DONKI/CME?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.nasa.gov/DONKI/FLR?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}`,
        { next: { revalidate: 3600 } }
      ),
    ]);

    let cmeData: any[] = [];
    let flrData: any[] = [];

    if (cmeRes.status === 'fulfilled' && cmeRes.value.ok) {
      cmeData = await cmeRes.value.json();
    }
    if (flrRes.status === 'fulfilled' && flrRes.value.ok) {
      flrData = await flrRes.value.json();
    }

    // Determine activity level based on flare class
    let activityLevel: 'Rendah' | 'Sedang' | 'Tinggi' = 'Rendah';
    let activityColor = 'cyan';

    const hasXFlare = flrData.some((f: any) => f.classType?.startsWith('X'));
    const hasMFlare = flrData.some((f: any) => f.classType?.startsWith('M'));
    const hasCME = cmeData.length > 0;

    if (hasXFlare || (hasMFlare && hasCME)) {
      activityLevel = 'Tinggi';
      activityColor = 'red';
    } else if (hasMFlare || hasCME) {
      activityLevel = 'Sedang';
      activityColor = 'amber';
    }

    const cme = cmeData.slice(0, 5).map((c: any) => ({
      activityID: c.activityID,
      startTime: c.startTime,
      note: c.note,
      speed: c.cmeAnalyses?.[0]?.speed || null,
    }));

    const flares = flrData.slice(0, 5).map((f: any) => ({
      flrID: f.flrID,
      beginTime: f.beginTime,
      peakTime: f.peakTime,
      classType: f.classType,
      sourceLocation: f.sourceLocation,
    }));

    return NextResponse.json({
      success: true,
      activityLevel,
      activityColor,
      cmeCount: cmeData.length,
      flareCount: flrData.length,
      cme,
      flares,
      period: { start: startStr, end: endStr },
    });
  } catch (error) {
    console.error('[API DONKI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        activityLevel: 'Rendah',
        activityColor: 'cyan',
        cmeCount: 0,
        flareCount: 0,
        cme: [],
        flares: [],
        error: String(error),
      },
      { status: 200 }
    );
  }
}
