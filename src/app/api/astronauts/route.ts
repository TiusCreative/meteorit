import { NextResponse } from 'next/server';
import { loadAstronautDataset } from '@/lib/astronautData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataset = await loadAstronautDataset();
    return NextResponse.json({
      success: true,
      ...dataset
    });
  } catch (error) {
    console.error('[api/astronauts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data astronot.' },
      { status: 500 }
    );
  }
}
