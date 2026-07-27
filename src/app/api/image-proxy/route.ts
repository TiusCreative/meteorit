import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Parameter url diperlukan.' }, { status: 400 });
  }

  try {
    // Unduh gambar dari URL asal (server-side bypass CORS)
    const res = await fetch(imageUrl, {
      next: { revalidate: 3600 } // Cache di level edge selama 1 jam
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Gagal mengambil gambar dari sumber: ${res.status}` }, { status: 500 });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    // Kembalikan response berupa stream gambar dengan CORS headers lengkap
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
