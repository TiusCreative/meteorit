import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Keamanan: Pengecekan Secret Key di Header request 'x-agregator-secret'
    const secretHeader = request.headers.get('x-agregator-secret');
    const expectedSecret = process.env.AGREGATOR_SECRET_KEY;

    if (!expectedSecret || secretHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Secret Key Salah' },
        { status: 401 }
      );
    }

    // 2. Menyiapkan Konfigurasi Cloudflare D1 REST API
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '';
    const databaseId = process.env.CLOUDFLARE_D1_ID || process.env.CLOUDFLARE_D1_DATABASE_ID || '';
    const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';

    if (!accountId || !databaseId || !apiToken) {
      return NextResponse.json(
        { error: 'Konfigurasi Cloudflare D1 tidak lengkap di environment' },
        { status: 500 }
      );
    }

    const d1Endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

    // 3. Menjalankan Query ke Cloudflare D1: Total Artikel & 30 Artikel Terbaru
    const countSql = "SELECT COUNT(*) as total FROM articles WHERE status = 'Published'";
    const articlesSql = "SELECT id, title, category, createdAt, date, image, r2_path FROM articles WHERE status = 'Published' ORDER BY createdAt DESC LIMIT 30";

    const [countResponse, articlesResponse] = await Promise.all([
      fetch(d1Endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: countSql }),
        cache: 'no-store'
      }),
      fetch(d1Endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: articlesSql }),
        cache: 'no-store'
      })
    ]);

    if (!countResponse.ok || !articlesResponse.ok) {
      const countErrText = !countResponse.ok ? await countResponse.text() : '';
      const articlesErrText = !articlesResponse.ok ? await articlesResponse.text() : '';
      throw new Error(`Permintaan ke Cloudflare D1 gagal. Status Count: ${countResponse.status} (${countErrText}), Status Articles: ${articlesResponse.status} (${articlesErrText})`);
    }

    const countJson = await countResponse.json();
    const articlesJson = await articlesResponse.json();

    if (!countJson.success || !articlesJson.success) {
      throw new Error(`D1 Query gagal dieksekusi: ${JSON.stringify(countJson.errors || articlesJson.errors)}`);
    }

    const totalArticles = countJson.result?.[0]?.results?.[0]?.total || 0;
    const rawArticles = articlesJson.result?.[0]?.results || [];

    const siteUrl = getSiteUrl();
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

    // 4. Formatkan Data Respon
    const formattedArticles = rawArticles.map((art: any) => {
      let imageUrl = art.image || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${r2PublicUrl}/${imageUrl.replace(/^\//, '')}`;
      }

      return {
        id: String(art.id),
        title: art.title || '',
        category: art.category || 'Umum',
        published_at: art.createdAt || art.date || new Date().toISOString(),
        url: `${siteUrl}/blog/${art.id}`,
        image_url: imageUrl
      };
    });

    return NextResponse.json({
      source: process.env.NEXT_PUBLIC_SITE_NAME || 'Meteorit Indonesia',
      total_articles: Number(totalArticles),
      articles: formattedArticles
    }, { status: 200 });

  } catch (err: any) {
    console.error('[Agregator Data API Error]:', err);
    return NextResponse.json({
      error: 'Gagal mengambil data agregator dari Cloudflare D1',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
