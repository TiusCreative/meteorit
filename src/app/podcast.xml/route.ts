import { NextResponse } from 'next/server';
import R2_CONFIG from '@/lib/cloudflareR2Config';

export const dynamic = 'force-dynamic';

/**
 * Fungsi untuk memperbaiki karakter '&' yang tidak valid dalam XML.
 * Mengubah '&' menjadi '&amp;' jika tidak diikuti entitas resmi.
 */
function fixUnescapedAmpersands(xmlString: string): string {
  // Regex ini mencari '&' yang TIDAK diikuti oleh entitas valid seperti amp;, lt;, gt;, quot;, apos;, atau &#...;
  return xmlString.replace(/&(?!(amp|lt|gt|quot|apos|#\d+);)/g, '&amp;');
}

export async function GET() {
  try {
    const r2Url = `${R2_CONFIG.publicUrl}/data/podcast/podcast.xml`;
    const res = await fetch(r2Url, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`R2 returned status ${res.status}`);
    }

    let xml = await res.text();

    // Perbaikan karakter ampersand sebelum dikirim ke client
    xml = fixUnescapedAmpersands(xml);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800', // Cache selama 30 menit
      },
    });
  } catch (error) {
    console.error('[Podcast.xml GET] Failed to fetch podcast.xml from R2, serving fallback:', error);

    const logoUrl = 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev/logo-meteor-spotify.png';
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Meteorit Indonesia Podcast</title>
  <description>Membahas astronomi, meteor, komet, benda langit, dan peristiwa alam unik bersama Meteorit Indonesia.</description>
  <link>https://meteorit.my.id</link>
  <language>id</language>
  <itunes:author>Meteorit Indonesia</itunes:author>
  <itunes:subtitle>Sains Astronomi dan Edukasi Benda Langit</itunes:subtitle>
  <itunes:summary>Membahas astronomi, meteor, komet, benda langit, dan peristiwa alam unik bersama Meteorit Indonesia.</itunes:summary>
  <itunes:owner>
    <itunes:name>Meteorit Indonesia</itunes:name>
    <itunes:email>creativecortex168@gmail.com</itunes:email>
  </itunes:owner>
  <itunes:image href="${logoUrl}" />
  <itunes:category text="Science">
    <itunes:category text="Astronomy" />
  </itunes:category>
  <itunes:explicit>no</itunes:explicit>
  <image>
    <url>${logoUrl}</url>
    <title>Meteorit Indonesia Podcast</title>
    <link>https://meteorit.my.id</link>
  </image>
  <item>
    <title>Selamat Datang di Meteorit Indonesia Podcast</title>
    <description>Perkenalan tentang platform pemantauan benda langit dan edukasi sains astronomi Indonesia.</description>
    <itunes:summary>Perkenalan tentang platform pemantauan benda langit dan edukasi sains astronomi Indonesia.</itunes:summary>
    <pubDate>Wed, 22 Jul 2026 11:00:00 GMT</pubDate>
    <guid isPermaLink="false">fallback-welcome-episode</guid>
    <enclosure url="https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev/fallback.mp3" length="1024" type="audio/mpeg" />
    <itunes:duration>10</itunes:duration>
    <itunes:explicit>no</itunes:explicit>
    <itunes:author>Meteorit Indonesia</itunes:author>
  </item>
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
