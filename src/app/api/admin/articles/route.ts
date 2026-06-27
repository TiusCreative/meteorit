import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
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

  // Sort in-memory by createdAt descending
  articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Save JSON array index list to Cloudflare R2
  await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
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
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 });
    }

    // Handle partial review status verification
    if (review_status && !title && !content) {
      await docRef.set({
        review_status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
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

    await docRef.set(updatedData, { merge: true });
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

    await adminDb.collection('articles').doc(id).delete();
    await rebuildR2BlogCache();

    return NextResponse.json({ success: true, message: 'Artikel berhasil dihapus.' });
  } catch (error) {
    console.error('[API Articles DELETE] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
