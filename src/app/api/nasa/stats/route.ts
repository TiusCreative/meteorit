import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.NASA_API_KEY;
    if (!apiKey) {
      console.warn('[API NASA Stats] NASA_API_KEY is not defined in environment variables. Using DEMO_KEY.');
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    const keyToUse = apiKey || 'DEMO_KEY';
    
    const res = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${todayStr}&end_date=${todayStr}&api_key=${keyToUse}`,
      { next: { revalidate: 3600 } } // Cache di sisi server Next.js selama 1 jam
    );

    if (!res.ok) {
      throw new Error(`NASA API returned status ${res.status}`);
    }

    const data = await res.json();
    const count = data.element_count || 2; // Default fallback count

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('[API NASA Stats] Error fetching asteroid count:', error);
    // Berikan fallback aman agar tampilan tidak pecah/error 500
    return NextResponse.json(
      { success: false, count: 2, error: String(error) },
      { status: 200 } // Gunakan 200 agar client-side fetch tetap sukses menerima json fallback
    );
  }
}
