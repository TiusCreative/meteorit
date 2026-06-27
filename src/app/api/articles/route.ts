import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Tandai sebagai dynamic route karena menggunakan request.url (query params)
export const dynamic = 'force-dynamic';

// GET: Ambil daftar artikel dari Firestore (fallback jika R2 belum ada)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const snapshot = await adminDb
      .collection('articles')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const articles: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === 'Published') {
        articles.push({ id: doc.id, ...data });
      }
    });

    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error('[api/articles] Error:', error);
    return NextResponse.json(
      { success: false, articles: [], error: String(error) },
      { status: 500 }
    );
  }
}
