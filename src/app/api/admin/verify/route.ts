export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/verifyAdminToken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json({ isAdmin: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Auto-sync verified admin to D1 users table
    try {
      const { queryD1 } = await import('@/lib/d1Client');
      await queryD1(
        `INSERT OR REPLACE INTO users (uid, displayName, email, photoURL, role, lastLogin)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          adminUser.uid,
          adminUser.email ? adminUser.email.split('@')[0] : 'Admin',
          adminUser.email || '',
          '',
          'admin',
          new Date().toISOString()
        ]
      );
    } catch (d1Err) {
      console.warn('[verify-admin] Could not auto-sync admin to D1:', d1Err);
    }

    return NextResponse.json({ success: true, isAdmin: true, user: adminUser });
  } catch (error) {
    console.error('[verify-admin GET] error:', error);
    return NextResponse.json({ success: false, isAdmin: false, error: String(error) }, { status: 500 });
  }
}
