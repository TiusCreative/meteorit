import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('subscribers').orderBy('subscribedAt', 'desc').get();
    const list: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        email: data.email || '',
        active: data.active !== false,
        subscribedAt: data.subscribedAt || ''
      });
    });
    return NextResponse.json({ success: true, users: list });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
