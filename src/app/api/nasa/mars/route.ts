import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FALLBACK_PHOTOS = [
  {
    id: 102685,
    sol: 1000,
    earth_date: '2015-05-30',
    img_src: 'https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg',
    camera_name: 'Mast Camera (MAST)',
    camera_abbrev: 'MAST',
    rover_name: 'Curiosity'
  },
  {
    id: 102686,
    sol: 1000,
    earth_date: '2015-05-30',
    img_src: 'https://images-assets.nasa.gov/image/PIA19819/PIA19819~orig.jpg',
    camera_name: 'Mast Camera (MAST)',
    camera_abbrev: 'MAST',
    rover_name: 'Curiosity'
  },
  {
    id: 102687,
    sol: 1000,
    earth_date: '2015-05-30',
    img_src: 'https://images-assets.nasa.gov/image/PIA19818/PIA19818~orig.jpg',
    camera_name: 'Navigation Camera (NAVCAM)',
    camera_abbrev: 'NAVCAM',
    rover_name: 'Curiosity'
  },
  {
    id: 102688,
    sol: 1000,
    earth_date: '2015-05-30',
    img_src: 'https://images-assets.nasa.gov/image/PIA16226/PIA16226~orig.jpg',
    camera_name: 'Front Hazard Avoidance Camera (FHAZ)',
    camera_abbrev: 'FHAZ',
    rover_name: 'Curiosity'
  },
  {
    id: 102689,
    sol: 1000,
    earth_date: '2015-05-30',
    img_src: 'https://images-assets.nasa.gov/image/PIA16227/PIA16227~orig.jpg',
    camera_name: 'Rear Hazard Avoidance Camera (RHAZ)',
    camera_abbrev: 'RHAZ',
    rover_name: 'Curiosity'
  },
  {
    id: 102690,
    sol: 1000,
    earth_date: '2015-05-30',
    img_src: 'https://images-assets.nasa.gov/image/PIA16239/PIA16239~orig.jpg',
    camera_name: 'Mars Hand Lens Imager (MAHLI)',
    camera_abbrev: 'MAHLI',
    rover_name: 'Curiosity'
  }
];

export async function GET() {
  try {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

    const res = await fetch(
      `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${apiKey}`,
      { next: { revalidate: 43200 } } // Cache 12 hours
    );

    if (!res.ok) {
      throw new Error(`Mars Rover API returned status ${res.status}`);
    }

    const data = await res.json();
    const latestPhotos = data.latest_photos || [];

    if (latestPhotos.length === 0) {
      throw new Error('No photos returned from Mars Rover API');
    }

    // Pick variety from different cameras
    const cameras = ['NAVCAM', 'MAST', 'CHEMCAM', 'MAHLI', 'FHAZ', 'RHAZ'];
    const photosByCamera: Record<string, any[]> = {};

    for (const photo of latestPhotos) {
      const cam = photo.camera?.name;
      if (!photosByCamera[cam]) photosByCamera[cam] = [];
      if (photosByCamera[cam].length < 2) {
        photosByCamera[cam].push(photo);
      }
    }

    // Flatten and limit to 12 photos
    const selected: any[] = [];
    for (const cam of cameras) {
      if (photosByCamera[cam]) {
        selected.push(...photosByCamera[cam]);
      }
      if (selected.length >= 12) break;
    }

    const finalPhotos = selected.length >= 4 ? selected.slice(0, 12) : latestPhotos.slice(0, 12);

    const photos = finalPhotos.map((p: any) => ({
      id: p.id,
      sol: p.sol,
      earth_date: p.earth_date,
      img_src: p.img_src,
      camera_name: p.camera?.full_name || p.camera?.name || 'Unknown Camera',
      camera_abbrev: p.camera?.name || 'UNK',
      rover_name: p.rover?.name || 'Curiosity',
    }));

    return NextResponse.json({
      success: true,
      rover: 'Curiosity',
      count: photos.length,
      data: photos,
    });
  } catch (error) {
    console.warn('[API Mars Rover] Menggunakan data fallback akibat API NASA offline:', error);
    return NextResponse.json(
      { success: true, rover: 'Curiosity', count: FALLBACK_PHOTOS.length, data: FALLBACK_PHOTOS },
      { status: 200 }
    );
  }
}
