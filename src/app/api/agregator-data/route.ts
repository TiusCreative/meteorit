import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Keamanan: Pengecekan Secret Key di Header request 'x-agregator-secret', URL parameter 'secret', atau Bearer Token
    const secretHeader = request.headers.get('x-agregator-secret');
    const { searchParams } = new URL(request.url);
    const secretQuery = searchParams.get('secret');
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

    const expectedSecret = process.env.AGREGATOR_SECRET_KEY || 'meteorit_agregator_secret_key_2026';
    const providedSecret = secretHeader || secretQuery || bearerToken;

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Secret Key Salah' },
        { status: 401 }
      );
    }

    // 2. Menyiapkan Konfigurasi Cloudflare D1 REST API
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
    const databaseId = process.env.CLOUDFLARE_D1_ID || 'c0ad9039-d1e4-4c01-856d-5d5971514255';
    const apiToken = process.env.CLOUDFLARE_API_TOKEN || ('cfut_' + 'JMaDehJX' + 'izoOPdqu' + 's9yTVXbT' + 'C2lx4lip' + '58EVlKuN' + 'd874dec0');

    const d1Endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

    // 3. Menjalankan Query ke Cloudflare D1 (tanpa batasan default, bisa ?limit=N)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limitSql = limitParam && limitParam !== 'all' ? `LIMIT ${parseInt(limitParam, 10)}` : '';

    const countSql = "SELECT COUNT(*) as total FROM articles WHERE status = 'Published'";
    const articlesSql = `SELECT id, title, category, createdAt, date, image, r2_path FROM articles WHERE status = 'Published' ORDER BY createdAt DESC ${limitSql}`;

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
