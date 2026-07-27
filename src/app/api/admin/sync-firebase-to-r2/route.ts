import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { isValidCronRequest } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint: Sync all Firestore articles → Cloudflare R2
 * POST /api/admin/sync-firebase-to-r2
 * 
 * - Reads all 'Published' articles from Firestore
 * - Uploads each article as data/blog/articles/{id}.json to R2
 * - Rebuilds data/blog/posts.json index (sorted by createdAt desc)
 *
 * Protected: requires CRON_SECRET header or query param
 */
export async function POST(request: Request) {
  // Auth: accept cron secret (same as cron jobs)
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Sync Firebase→R2] Mulai sinkronisasi...');

    // 1. Fetch all articles from Firestore
    const snapshot = await adminDb.collection('articles').get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada artikel di Firestore untuk disinkronkan.',
        synced: 0,
        total: 0
      });
    }

    const allArticles: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      // Ensure id field is set
      allArticles.push({ id: doc.id, ...data });
    });

    console.log(`[Sync Firebase→R2] Total artikel di Firestore: ${allArticles.length}`);

    // 2. Filter only published articles for index
    const publishedArticles = allArticles.filter((a) => a.status === 'Published');

    // 3. Sort descending by createdAt
    publishedArticles.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // 4. Upload each article as individual JSON
    let syncedCount = 0;
    const errors: string[] = [];

    for (const article of allArticles) {
      try {
        const key = `data/blog/articles/${article.id}.json`;
        await uploadToR2(key, JSON.stringify(article, null, 2), 'application/json');
        syncedCount++;
        if (syncedCount % 10 === 0) {
          console.log(`[Sync Firebase→R2] Progress: ${syncedCount}/${allArticles.length}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${article.id}: ${msg}`);
        console.error(`[Sync Firebase→R2] Gagal upload artikel ${article.id}:`, msg);
      }
    }

    // 5. Rebuild posts.json index (only published articles)
    await uploadToR2(
      'data/blog/posts.json',
      JSON.stringify(publishedArticles, null, 2),
      'application/json'
    );

    console.log(`[Sync Firebase→R2] Selesai! Synced ${syncedCount}/${allArticles.length} artikel.`);
    console.log(`[Sync Firebase→R2] posts.json diperbarui dengan ${publishedArticles.length} artikel published.`);

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${syncedCount} artikel diupload ke R2.`,
      synced: syncedCount,
      published: publishedArticles.length,
      total: allArticles.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[Sync Firebase→R2] Error:', error);
    return NextResponse.json(
      {
        error: 'Gagal melakukan sinkronisasi',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing via browser
export async function GET(request: Request) {
  return POST(request);
}
