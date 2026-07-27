import { NextResponse } from 'next/server';
import R2_CONFIG from '@/lib/cloudflareR2Config';

export const dynamic = 'force-dynamic';

/**
 * Fungsi untuk memperbaiki karakter '&' yang tidak valid dalam XML.
 * Mengubah '&' menjadi '&amp;' HANYA jika tidak diikuti oleh entitas XML resmi.
 */
function fixUnescapedAmpersands(xmlString: string): string {
  // Regex ini mencari '&' yang TIDAK diikuti oleh entitas valid seperti amp;, lt;, gt;, quot;, apos;, atau &#...;
  return xmlString.replace(/&(?!(amp|lt|gt|quot|apos|#\d+);)/g, '&amp;');
}

export async function GET() {
  try {
    const r2Url = `${R2_CONFIG.publicUrl}/rss.xml`;
    const res = await fetch(r2Url, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`R2 returned status ${res.status}`);
    }

    let xml = await res.text();

    // PERBAIKAN: Bersihkan teks XML dari R2 sebelum dikirim ke browser
    xml = fixUnescapedAmpersands(xml);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[RSS.xml GET] Failed to fetch rss.xml from R2, serving fallback error:', error);

    const fallbackXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Meteorit Indonesia</title>
  <link>https://meteorit.my.id</link>
  <description>Pusat data astronomi, edukasi sains, forum komunitas, dan jembatan transaksi meteorit terpercaya di Indonesia</description>
  <language>id</language>
</channel>
</rss>`;

    return new NextResponse(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}