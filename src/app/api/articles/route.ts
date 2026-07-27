import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1Client';
import { fetchJsonFromR2 } from '@/lib/r2Client';

export const dynamic = 'force-dynamic';

/**
 * GET: Ambil daftar artikel dengan pencarian kata kunci dan kategori.
 * Mencari langsung di Cloudflare D1 untuk kecepatan optimal, dengan fallback ke R2.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category') || '';
    const q = searchParams.get('q') || '';

    let articles: any[] = [];

    try {
      let sql = `SELECT * FROM articles WHERE status = 'Published'`;
      const params: any[] = [];

      if (category) {
        sql += ` AND category = ?`;
        params.push(category);
      }

      if (q) {
        sql += ` AND (title LIKE ? OR excerpt LIKE ? OR tags LIKE ?)`;
        const likeVal = `%${q}%`;
        params.push(likeVal, likeVal, likeVal);
      }

      sql += ` ORDER BY createdAt DESC LIMIT ?`;
      params.push(limit);

      const d1Res = await queryD1(sql, params);
      articles = d1Res.results || [];
    } catch (d1Err) {
      console.warn('[api/articles] Gagal membaca dari Cloudflare D1, menggunakan fallback R2 posts.json:', d1Err);
      
      // Fallback ke R2 posts.json cache catalog
      try {
        const posts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
        articles = posts.filter(p => {
          if (p.status !== 'Published') return false;
          if (category && p.category !== category) return false;
          if (q) {
            const queryLower = q.toLowerCase();
            const titleMatch = p.title?.toLowerCase().includes(queryLower);
            const excerptMatch = p.excerpt?.toLowerCase().includes(queryLower);
            const tagsMatch = Array.isArray(p.tags)
              ? p.tags.some((t: string) => t.toLowerCase().includes(queryLower))
              : p.tags?.toLowerCase().includes(queryLower);
            return titleMatch || excerptMatch || tagsMatch;
          }
          return true;
        }).slice(0, limit);
      } catch (r2Err) {
        console.error('[api/articles] Fallback R2 juga gagal:', r2Err);
        throw d1Err; // Lempar error D1 asli jika R2 juga bermasalah
      }
    }

    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error('[api/articles] Error:', error);
    return NextResponse.json(
      { success: false, articles: [], error: String(error) },
      { status: 500 }
    );
  }
}
