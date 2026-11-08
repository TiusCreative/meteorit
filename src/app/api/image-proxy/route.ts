export const runtime = 'edge';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const R2_FALLBACK_METEORITE = 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev/data/glossary/images/nasa-meteorite.webp';
const R2_FALLBACK_SPACE = 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev/data/glossary/images/nasa-apod.webp';

function getRealisticFallbackUrl(labelOrUrl: string): string {
  const lower = labelOrUrl.toLowerCase();
  if (
    lower.includes('meteorit') ||
    lower.includes('meteor') ||
    lower.includes('chondrite') ||
    lower.includes('iron') ||
    lower.includes('pallasite') ||
    lower.includes('howardite') ||
    lower.includes('rock') ||
    lower.includes('crust') ||
    lower.includes('stone')
  ) {
    return R2_FALLBACK_METEORITE;
  }
  return R2_FALLBACK_SPACE;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.redirect(R2_FALLBACK_SPACE, 302);
  }

  // Jika URL mengarah ke r2.dev (yang sering diblokir ISP Indonesia), arahkan ke domain kustom CDN cdn.meteorit.my.id
  let targetUrl = imageUrl;
  if (targetUrl.includes('pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev')) {
    targetUrl = targetUrl.replace('pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev', 'cdn.meteorit.my.id');
  }

  // Jika provider gambar adalah pollinations.ai (yang sering 402/lambat),
  // langsung redirect ke gambar AI fotorealistik dari R2 sesuai jenisnya
  if (targetUrl.includes('pollinations.ai')) {
    return NextResponse.redirect(getRealisticFallbackUrl(targetUrl), 302);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
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
          'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        },
      });
    }
  } catch (error) {
    console.warn('[Image Proxy] Fetch failed for URL:', targetUrl, error);
  }

  return NextResponse.redirect(getRealisticFallbackUrl(targetUrl), 302);
}
