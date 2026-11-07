import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/r2Client';
import R2_CONFIG from '@/lib/cloudflareR2Config';

export const dynamic = 'force-dynamic';

function getFallbackSvgResponse() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#020617"/>
    <circle cx="300" cy="170" r="55" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>
    <text x="300" y="180" font-size="36" text-anchor="middle" fill="#67e8f9">🌌</text>
    <text x="300" y="265" font-size="20" font-family="sans-serif" font-weight="900" text-anchor="middle" fill="#22d3ee">Meteorit Indonesia</text>
    <text x="300" y="295" font-size="13" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="#94a3b8">Media Astronomi &amp; Antariksa</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

function getContentTypeFromKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  if (ext === 'webp') return 'image/webp';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  return 'image/jpeg';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return getFallbackSvgResponse();
  }

  // 1. Jika URL berasal dari R2 (r2.dev atau cloudflarestorage.com), gunakan SDK S3 langsung
  const isR2Url = imageUrl.includes('r2.dev') || imageUrl.includes('cloudflarestorage.com');
  if (isR2Url) {
    try {
      const urlObj = new URL(imageUrl);
      const key = decodeURIComponent(urlObj.pathname.replace(/^\//, ''));
      
      const s3Res = await s3Client.send(new GetObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: key
      }));

      if (s3Res.Body) {
        const bytes = await s3Res.Body.transformToByteArray();
        const contentType = s3Res.ContentType || getContentTypeFromKey(key);

        return new NextResponse(Buffer.from(bytes), {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch (r2Err) {
      console.warn('[Image Proxy] Gagal membaca gambar dari R2 S3 SDK:', r2Err);
    }
  }

  // 2. Jika bukan R2 URL (misal NASA APOD, Pollinations, placehold.co), coba fetch HTTP biasa
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      next: { revalidate: 3600 }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch (error) {
    console.warn('[Image Proxy] Upstream fetch failed for URL:', imageUrl, error);
  }

  // 3. Fallback jika R2 dan HTTP fetch dua-duanya gagal
  return getFallbackSvgResponse();
}
