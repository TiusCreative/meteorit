import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { queryD1 } from '@/lib/d1Client';
import { fetchJsonFromR2 } from '@/lib/r2Client';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: Request): Promise<boolean> {
  const adminUid = request.headers.get('x-admin-uid');
  if (!adminUid) return false;
  try {
    const userSnap = await adminDb.collection('users').doc(adminUid).get();
    return userSnap.exists && userSnap.data()?.role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    console.log('[Admin Sync D1] Memulai migrasi metadata dari Firestore ke Cloudflare D1...');

    // 1. Ambil artikel dari Firestore
    let articlesList: any[] = [];
    try {
      const articlesSnapshot = await adminDb.collection('articles').get();
      articlesSnapshot.forEach((doc: any) => {
        articlesList.push({ id: doc.id, ...doc.data() });
      });
      console.log(`[Admin Sync D1] Berhasil mengambil ${articlesList.length} artikel dari Firestore.`);
    } catch (fsErr) {
      console.warn('[Admin Sync D1] Gagal membaca Firestore, mencoba fallback ke R2 posts.json:', fsErr);
      // Fallback ke R2
      articlesList = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
    }

    if (articlesList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada artikel yang ditemukan untuk disinkronkan.',
        synced: 0
      });
    }

    // 2. Lakukan sinkronisasi ke D1
    let successCount = 0;
    const errors: string[] = [];

    for (const art of articlesList) {
      try {
        const r2Path = `data/blog/articles/${art.id}.json`;
        const tags = Array.isArray(art.tags) 
          ? art.tags.join(',') 
          : (art.tags || '');

        await queryD1(
          `INSERT OR REPLACE INTO articles (
            id, title, category, r2_path, createdAt, tags, image, excerpt, date, views, status, review_status, ai_provider
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            art.id,
            art.title || '',
            art.category || 'Trivia',
            r2Path,
            art.createdAt || new Date().toISOString(),
            tags,
            art.image || art.imageUrl || '',
            art.excerpt || art.content?.substring(0, 150) + '...' || '',
            art.date || '',
            art.views || 0,
            art.status || 'Published',
            art.review_status || 'Otomatis',
            art.ai_provider || ''
          ]
        );
        successCount++;
      } catch (d1Err) {
        const msg = d1Err instanceof Error ? d1Err.message : String(d1Err);
        errors.push(`${art.id}: ${msg}`);
        console.error(`[Admin Sync D1] Gagal sinkronisasi artikel ${art.id}:`, msg);
      }
    }

    console.log(`[Admin Sync D1] Migrasi selesai. Sukses: ${successCount}/${articlesList.length}`);

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan ${successCount} metadata artikel dari Firebase ke Cloudflare D1.`,
      stats: {
        total: articlesList.length,
        synced: successCount,
        failed: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Admin Sync D1 Error]:', errMsg);
    return NextResponse.json({
      error: 'Gagal melakukan sinkronisasi database ke D1.',
      details: errMsg
    }, { status: 500 });
  }
}
