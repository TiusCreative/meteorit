import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface EpicImage {
  identifier: string;
  caption: string;
  image: string;
  date: string;
  image_url: string;
  coords: {
    lat: number;
    lon: number;
    centroid: { lat: number; lon: number };
    dscovr_position: { x: number; y: number; z: number };
    lunar_position: { x: number; y: number; z: number };
    sun_position: { x: number; y: number; z: number };
  };
}

export async function GET() {
  try {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    
    // Fetch latest natural color images
    const res = await fetch(
      `https://api.nasa.gov/EPIC/api/natural?api_key=${apiKey}`,
      { next: { revalidate: 43200 } } // Cache 12 hours
    );

    if (!res.ok) {
      throw new Error(`NASA EPIC API returned status ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid response structure from NASA EPIC API');
    }

    const items: EpicImage[] = data.map((item: any) => {
      // date is in format "YYYY-MM-DD HH:MM:SS"
      const datePart = item.date.split(' ')[0]; // "YYYY-MM-DD"
      const [year, month, day] = datePart.split('-');

      // Construct image URL using epic.gsfc.nasa.gov CDN (which doesn't require API key for raw files, high performance)
      const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${item.image}.png`;

      return {
        identifier: item.identifier,
        caption: item.caption,
        image: item.image,
        date: item.date,
        image_url: imageUrl,
        coords: {
          lat: item.centroid_coordinates?.lat || 0,
          lon: item.centroid_coordinates?.lon || 0,
          centroid: {
            lat: item.centroid_coordinates?.lat || 0,
            lon: item.centroid_coordinates?.lon || 0,
          },
          dscovr_position: {
            x: item.dscovr_j2000_position?.x || 0,
            y: item.dscovr_j2000_position?.y || 0,
            z: item.dscovr_j2000_position?.z || 0,
          },
          lunar_position: {
            x: item.lunar_j2000_position?.x || 0,
            y: item.lunar_j2000_position?.y || 0,
            z: item.lunar_j2000_position?.z || 0,
          },
          sun_position: {
            x: item.sun_j2000_position?.x || 0,
            y: item.sun_j2000_position?.y || 0,
            z: item.sun_j2000_position?.z || 0,
          },
        },
      };
    });

    return NextResponse.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('[API NASA EPIC] Error:', error);
    return NextResponse.json(
      { success: false, count: 0, data: [], error: String(error) },
      { status: 200 }
    );
  }
}
