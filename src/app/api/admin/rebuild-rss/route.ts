export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { rebuildRSSFeedHelper } from '@/lib/rss';
import { verifyAdmin } from '@/lib/verifyAdminToken';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const success = await rebuildRSSFeedHelper();
    if (!success) {
      return NextResponse.json({ error: 'Failed to rebuild RSS feed.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'RSS feed rebuilt successfully on R2.' });
  } catch (error) {
    console.error('[API Rebuild RSS] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
