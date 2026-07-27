import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { buildArticleTranslations } from '@/lib/articleLocalization';
import { uploadToR2 } from '@/lib/r2Client';

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

async function rebuildR2BlogCache() {
  const allArticlesSnapshot = await adminDb.collection('articles').get();
  const articlesList: any[] = [];
  allArticlesSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.status === 'Published') {
      articlesList.push({ id: doc.id, ...data });
    }
  });
  articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
}

/**
 * POST /api/admin/translate-article
 * Mentrigger terjemahan manual untuk artikel tertentu.
 * Body: { id, type?, title, excerpt, content }
 */
export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, type, title, excerpt, content } = body;

    if (!id || !title || !content) {
      return NextResponse.json({ error: 'ID, title, dan content wajib diisi.' }, { status: 400 });
    }

    const collectionName = type || 'articles';

    console.log(`[translate-article] Memulai terjemahan untuk ${id} di koleksi ${collectionName}...`);

    // Bangun terjemahan ke 4 bahasa (EN, MS, ZH, JA)
    const translations = await buildArticleTranslations({ title, excerpt: excerpt || '', content });

    // Simpan ke Firestore
    const docRef = adminDb.collection(collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: `Dokumen ${id} tidak ditemukan di koleksi ${collectionName}.` }, { status: 404 });
    }

    await docRef.update({
      translations,
      updatedAt: new Date().toISOString(),
    });

    // Rebuild R2 cache untuk artikel
    if (collectionName === 'articles') {
      await rebuildR2BlogCache();
    }

    console.log(`[translate-article] ✅ Terjemahan berhasil untuk ${id}`);

    return NextResponse.json({
      success: true,
      message: `Terjemahan untuk artikel "${title}" berhasil disimpan ke database.`,
      languages: Object.keys(translations),
    });
  } catch (error) {
    console.error('[translate-article] Error:', error);
    return NextResponse.json(
      { error: 'Gagal menterjemahkan artikel.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/translate-article?batch=true
 * Batch translate: semua artikel yang memiliki translations kosong ({})
 */
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('type') || 'articles';
    const limitParam = parseInt(searchParams.get('limit') || '5', 10);

    // Ambil artikel yang belum punya terjemahan
    const allSnapshot = await adminDb.collection(collectionName).get();

    const untranslated: { id: string; title: string; excerpt: string; content: string }[] = [];

    allSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === 'Published') {
        const translationsObj = data.translations || {};
        const hasTranslation =
          Object.keys(translationsObj).length > 0 &&
          Object.values(translationsObj).some((t: any) => t?.content && t.content.length > 50);

        if (!hasTranslation) {
          untranslated.push({
            id: doc.id,
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
          });
        }
      }
    });

    const toProcess = untranslated.slice(0, limitParam);

    if (toProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua artikel sudah memiliki terjemahan.',
        processed: 0,
        remaining: 0,
      });
    }

    let processedCount = 0;
    const results: { id: string; success: boolean; error?: string }[] = [];

    for (const article of toProcess) {
      try {
        const translations = await buildArticleTranslations({
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
        });

        await adminDb.collection(collectionName).doc(article.id).update({
          translations,
          updatedAt: new Date().toISOString(),
        });

        processedCount++;
        results.push({ id: article.id, success: true });
        console.log(`[translate-article] ✅ Batch: berhasil terjemahkan ${article.id}`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({ id: article.id, success: false, error: errMsg });
        console.error(`[translate-article] ❌ Batch: gagal ${article.id}:`, errMsg);
      }
    }

    // Rebuild R2 cache setelah batch selesai
    if (collectionName === 'articles') {
      await rebuildR2BlogCache();
    }

    return NextResponse.json({
      success: true,
      message: `Batch translate selesai: ${processedCount}/${toProcess.length} artikel berhasil diterjemahkan.`,
      processed: processedCount,
      remaining: untranslated.length - toProcess.length,
      results,
    });
  } catch (error) {
    console.error('[translate-article] Batch error:', error);
    return NextResponse.json(
      { error: 'Gagal batch translate.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
