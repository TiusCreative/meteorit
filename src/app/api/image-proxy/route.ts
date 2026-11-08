export const runtime = 'edge';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getFallbackSvgResponse(label?: string) {
  const displayTitle = label ? label.replace(/[+_-]/g, ' ').substring(0, 45) : 'Meteorit Indonesia';
  const isBmkg = displayTitle.toLowerCase().includes('bmkg') || displayTitle.toLowerCase().includes('hujan') || displayTitle.toLowerCase().includes('cuaca');
  const icon = isBmkg ? '🌤️' : '🌌';
  const accentColor = isBmkg ? '#38bdf8' : '#22d3ee';
  const categoryTag = isBmkg ? 'BMKG • Sains Atmosfer' : 'NASA • Astronomi Antariksa';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0.8" />
      </linearGradient>
    </defs>
    <rect width="800" height="480" fill="url(#bg)"/>
    <circle cx="700" cy="80" r="140" fill="${accentColor}" opacity="0.05" />
    <circle cx="100" cy="400" r="180" fill="#a855f7" opacity="0.04" />
    <rect x="50" y="50" width="700" height="380" rx="20" fill="none" stroke="${accentColor}" stroke-opacity="0.2" stroke-width="1.5"/>
    <circle cx="400" cy="180" r="54" fill="#1e293b" stroke="${accentColor}" stroke-width="2"/>
    <text x="400" y="196" font-size="44" text-anchor="middle">${icon}</text>
    <text x="400" y="275" font-size="12" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="bold" letter-spacing="3" text-anchor="middle" fill="#94a3b8" text-transform="uppercase">${categoryTag}</text>
    <text x="400" y="320" font-size="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" text-anchor="middle" fill="#f8fafc">${displayTitle}</text>
    <text x="400" y="360" font-size="13" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" text-anchor="middle" fill="${accentColor}">meteorit.my.id • Ensiklopedia Sains &amp; Antariksa</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}

function extractLabelFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Pollinations prompt format: /prompt/<prompt text>?...
    if (parsed.pathname.includes('/prompt/')) {
      const rawPrompt = decodeURIComponent(parsed.pathname.replace(/.*\/prompt\//, ''));
      const cleaned = rawPrompt
        .replace(/science glossary illustration/gi, '')
        .replace(/meteorology astronomy educational poster realistic/gi, '')
        .replace(/professional.*portrait/gi, '')
        .trim();
      if (cleaned) return cleaned;
    }
  } catch {}
  return 'Meteorit Indonesia';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return getFallbackSvgResponse();
  }

  // Jika URL mengarah ke r2.dev (yang sering diblokir ISP Indonesia), arahkan ke domain kustom CDN cdn.meteorit.my.id
  let targetUrl = imageUrl;
  if (targetUrl.includes('pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev')) {
    targetUrl = targetUrl.replace('pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev', 'cdn.meteorit.my.id');
  }

  // Jika provider gambar adalah pollinations.ai (yang saat ini mengembalikan 402 Payment Required),
  // langsung layani banner SVG sains beranimasi tanpa membuang waktu subrequest
  if (targetUrl.includes('pollinations.ai')) {
    return getFallbackSvgResponse(extractLabelFromUrl(targetUrl));
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

  return getFallbackSvgResponse(extractLabelFromUrl(targetUrl));
}
