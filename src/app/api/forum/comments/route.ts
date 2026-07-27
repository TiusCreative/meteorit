import { NextRequest, NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1Client';

export const dynamic = 'force-dynamic';

// GET: Fetch comments for a specific postId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ success: false, error: 'Post ID wajib disediakan.' }, { status: 400 });
    }

    // 1. Try D1 first
    try {
      const dbRes = await queryD1(
        `SELECT * FROM forum_comments WHERE postId = ? ORDER BY createdAt ASC`,
        [postId]
      );
      if (dbRes.success && dbRes.results && dbRes.results.length > 0) {
        return NextResponse.json({ success: true, source: 'd1', comments: dbRes.results });
      }
    } catch (d1Err) {
      console.warn('[API Forum Comments] D1 query failed, trying Firestore fallback:', d1Err);
    }

    // 2. Fallback to Firestore
    const { adminDb } = await import('@/lib/firebaseAdmin');
    const snapshot = await adminDb
      .collection('forum_comments')
      .where('postId', '==', postId)
      .get();
      
    const comments: any[] = [];
    snapshot.forEach((docSnap: any) => {
      const data = docSnap.data();
      comments.push({
        id: docSnap.id,
        postId: data.postId,
        content: data.content,
        authorName: data.authorName,
        authorPhoto: data.authorPhoto || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
      });
    });

    // Sort comments by date ascending
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({ success: true, source: 'firestore_fallback', comments });
  } catch (err: any) {
    console.error('[API Forum Comments GET] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err), comments: [] }, { status: 500 });
  }
}

// POST: Add a new comment
export async function POST(req: NextRequest) {
  try {
    const { postId, content, authorName, authorPhoto } = await req.json();

    if (!postId || !content || !authorName) {
      return NextResponse.json({ success: false, error: 'Post ID, konten komentar, dan nama penulis wajib diisi.' }, { status: 400 });
    }

    const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    // 1. Save to D1 database
    try {
      await queryD1(
        `INSERT INTO forum_comments (id, postId, content, authorName, authorPhoto, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [commentId, postId, content, authorName, authorPhoto || null, createdAt]
      );
    } catch (d1Err) {
      console.error('[API Forum Comments POST] Gagal menyimpan ke D1:', d1Err);
    }

    // 2. Synchronize to Firestore
    try {
      const { adminDb } = await import('@/lib/firebaseAdmin');
      await adminDb.collection('forum_comments').doc(commentId).set({
        postId,
        content,
        authorName,
        authorPhoto: authorPhoto || '',
        createdAt: new Date(),
      });
    } catch (fsErr) {
      console.error('[API Forum Comments POST] Gagal melakukan sinkronisasi komentar ke Firestore:', fsErr);
    }

    return NextResponse.json({ success: true, commentId });
  } catch (err: any) {
    console.error('[API Forum Comments POST] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
