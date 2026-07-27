import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response('Parameter URL wajib diisi.', { status: 400 });
    }

    // Validasi domain agar endpoint ini hanya melakukan proxy untuk Cloudflare R2
    const urlPattern = /^https:\/\/pub-[a-zA-Z0-9]+\.r2\.dev\//;
    if (!urlPattern.test(targetUrl)) {
      return new Response('Akses ditolak. Endpoint ini hanya mendukung proxy untuk Cloudflare R2.', { status: 403 });
    }

    // Lakukan fetch dari Cloudflare R2 secara server-side
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
      next: { revalidate: 86400 } // Cache di level Next.js server selama 24 jam
    });

    if (!res.ok) {
      console.error(`[R2 Proxy] Gagal mengunduh gambar dari R2. Status: ${res.status}`);
      return new Response('Gagal memuat gambar dari penyimpanan cloud.', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    // Kembalikan gambar dengan header cache yang agresif untuk peranti seluler / PWA
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[R2 Proxy] Terjadi kesalahan:', error);
    return new Response('Terjadi kesalahan server saat memproses gambar.', { status: 500 });
  }
}
