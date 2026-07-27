import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';
import { queryD1 } from '@/lib/d1Client';

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

/**
 * Rebuild R2 posts.json index from D1 database
 */
async function rebuildR2BlogCache() {
  try {
    const res = await queryD1(`SELECT * FROM articles WHERE status = 'Published' ORDER BY createdAt DESC`);
    const articlesList = res.results || [];
    
    // Save JSON array index list to Cloudflare R2
    await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
    console.log(`[Admin Articles] R2 posts.json cache rebuilt with ${articlesList.length} articles.`);
  } catch (err) {
    console.error('[Admin Articles] Failed to rebuild R2 cache from D1:', err);
  }
}

// PUT: Edit Artikel
export async function PUT(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, category, excerpt, content, image, review_status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID artikel wajib diisi.' }, { status: 400 });
    }

    const docRef = adminDb.collection('articles').doc(id);
    const docSnap = await docRef.get();
    const dbData = docSnap.exists ? docSnap.data() : {};

    // 1. Handle partial review status verification
    if (review_status && !title && !content) {
      // Update Firestore
      await docRef.set({
        review_status,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update D1
      await queryD1(`UPDATE articles SET review_status = ? WHERE id = ?;`, [review_status, id]);

      // Update R2 individual article JSON
      try {
        const articleR2 = await fetchJsonFromR2<any>(`data/blog/articles/${id}.json`);
        if (articleR2) {
          articleR2.review_status = review_status;
          await uploadToR2(`data/blog/articles/${id}.json`, JSON.stringify(articleR2, null, 2), 'application/json');
        }
      } catch (r2Err) {
        console.warn(`[Admin Articles PUT] Failed to update R2 file for ${id}:`, r2Err);
      }

      await rebuildR2BlogCache();
      return NextResponse.json({ success: true, message: 'Status review artikel berhasil diperbarui.' });
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan Isi konten wajib diisi untuk edit artikel lengkap.' }, { status: 400 });
    }

    const updatedData: any = {
      title,
      category: category || 'Trivia',
      excerpt: excerpt || content.substring(0, 150) + '...',
      content,
      updatedAt: new Date().toISOString()
    };

    if (image) {
      updatedData.image = image;
    }

    // Update Firestore
    await docRef.set(updatedData, { merge: true });

    // Update D1 (Upsert metadata)
    const tagsStr = Array.isArray(dbData?.tags) ? dbData.tags.join(',') : (dbData?.tags || '');
    await queryD1(
      `INSERT OR REPLACE INTO articles (
        id, title, category, r2_path, createdAt, tags, image, excerpt, date, views, status, review_status, ai_provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        title,
        updatedData.category,
        `data/blog/articles/${id}.json`,
        dbData?.createdAt || new Date().toISOString(),
        tagsStr,
        image || dbData?.image || dbData?.imageUrl || '',
        updatedData.excerpt,
        dbData?.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        dbData?.views || 0,
        dbData?.status || 'Published',
        review_status || dbData?.review_status || 'Otomatis',
        dbData?.ai_provider || ''
      ]
    );

    // Update R2 individual article JSON
    let currentR2 = await fetchJsonFromR2<any>(`data/blog/articles/${id}.json`);
    if (!currentR2) {
      // Build a fallback individual JSON if it doesn't exist
      currentR2 = {
        id,
        title,
        excerpt: updatedData.excerpt,
        content,
        category: updatedData.category,
        date: dbData?.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        image: image || dbData?.image || dbData?.imageUrl || '',
        views: dbData?.views || 0,
        status: dbData?.status || 'Published',
        review_status: review_status || dbData?.review_status || 'Otomatis',
        createdAt: dbData?.createdAt || new Date().toISOString()
      };
    } else {
      currentR2 = {
        ...currentR2,
        title,
        excerpt: updatedData.excerpt,
        content,
        category: updatedData.category,
        image: image || currentR2.image || '',
        review_status: review_status || currentR2.review_status || 'Otomatis'
      };
    }
    await uploadToR2(`data/blog/articles/${id}.json`, JSON.stringify(currentR2, null, 2), 'application/json');

    await rebuildR2BlogCache();

    return NextResponse.json({ success: true, message: 'Artikel berhasil diperbarui.' });
  } catch (error) {
    console.error('[API Articles PUT] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE: Hapus Artikel
export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID artikel diperlukan.' }, { status: 400 });
    }

    // Delete from Firestore
    try {
      await adminDb.collection('articles').doc(id).delete();
    } catch (fsErr) {
      console.warn(`[Admin Articles DELETE] Firestore delete failed for ${id}:`, fsErr);
    }

    // Delete from D1
    await queryD1(`DELETE FROM articles WHERE id = ?;`, [id]);

    // Note: We keep the individual R2 JSON file as a fallback backup in case of recovery/restore needs,
    // but we remove it from the posts.json cache.

    await rebuildR2BlogCache();

    return NextResponse.json({ success: true, message: 'Artikel berhasil dihapus.' });
  } catch (error) {
    console.error('[API Articles DELETE] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
