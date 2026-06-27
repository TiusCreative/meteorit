import { NextResponse } from 'next/server';
import { isFirebaseMocked, firebaseInitError } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    isMocked: isFirebaseMocked,
    error: firebaseInitError,
    hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
    hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  });
}
