import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/verifyAdminToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: true, isAdmin: true, user: adminUser });
  } catch (error) {
    console.error('[verify-admin GET] error:', error);
    return NextResponse.json({ success: false, isAdmin: false, error: String(error) }, { status: 500 });
  }
}
