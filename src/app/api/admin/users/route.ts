export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { verifyAdmin } from '@/lib/verifyAdminToken';
import { queryD1 } from '@/lib/d1Client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Ambil daftar user dengan pagination dan search.
 * Query params: page, limit, search
 */
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const tab = searchParams.get('tab') || 'all'; // all | premium | admin

    let allUsers: any[] = [];

    // 1. Ambil dari Cloudflare D1
    try {
      const d1Res = await queryD1('SELECT uid, email, displayName, photoURL, role, lastLogin FROM users');
      if (d1Res?.results?.length) {
        allUsers = d1Res.results.map((u: any) => ({
          uid: u.uid,
          email: u.email || '',
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          role: u.role || 'user',
          premiumExpiry: null,
          premiumGrantedAt: null,
          premiumGrantedByDonation: null,
          lastLogin: u.lastLogin || '',
          createdAt: u.lastLogin || '',
        }));
      }
    } catch (d1Err) {
      console.warn('[Admin Users] D1 fetch failed:', d1Err);
    }

    // 2. Fallback ke Firestore jika D1 kosong
    if (allUsers.length === 0) {
      const snapshot = await adminDb.collection('users').get();
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        allUsers.push({
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          photoURL: data.photoURL || '',
          role: data.role || 'user',
          premiumExpiry: data.premiumExpiry || null,
          premiumGrantedAt: data.premiumGrantedAt || null,
          premiumGrantedByDonation: data.premiumGrantedByDonation || null,
          lastLogin: data.lastLogin || '',
          createdAt: data.createdAt || data.lastLogin || '',
        });
      });
    }

    // Filter by tab
    if (tab === 'premium') {
      allUsers = allUsers.filter(u => u.role === 'premium');
    } else if (tab === 'admin') {
      allUsers = allUsers.filter(u => u.role === 'admin');
    }

    // Filter by search
    if (search) {
      allUsers = allUsers.filter(u =>
        u.email.toLowerCase().includes(search) ||
        u.displayName.toLowerCase().includes(search) ||
        u.uid.toLowerCase().includes(search)
      );
    }

    // Sort: admin first, then premium, then user; then by lastLogin
    allUsers.sort((a, b) => {
      const rolePriority: Record<string, number> = { admin: 0, premium: 1, user: 2 };
      const priorityDiff = (rolePriority[a.role] ?? 3) - (rolePriority[b.role] ?? 3);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.lastLogin || 0).getTime() - new Date(a.lastLogin || 0).getTime();
    });

    // Pagination
    const totalCount = allUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const pagedUsers = allUsers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      users: pagedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('[admin/users GET] error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Update role user dan/atau masa aktif premium.
 * Body: { uid, role, premiumDays? }
 * - role: 'user' | 'premium' | 'admin'
 * - premiumDays: 30 | 60 | 90 | 360 | 0 (0 = unlimited)
 */
export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { uid, role, premiumDays } = body;

    if (!uid || !role) {
      return NextResponse.json({ error: 'UID dan role wajib diisi.' }, { status: 400 });
    }

    const validRoles = ['user', 'premium', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Role tidak valid. Harus salah satu dari: ${validRoles.join(', ')}.` }, { status: 400 });
    }

    // Update D1
    try {
      await queryD1('UPDATE users SET role = ? WHERE uid = ?', [role, uid]);
    } catch (d1Err) {
      console.warn('[Admin Users PUT] D1 update failed:', d1Err);
    }

    const userRef = adminDb.collection('users').doc(uid);
    try {
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const updateData: any = {
          role,
          updatedAt: new Date().toISOString(),
        };

        if (role === 'premium' && premiumDays !== undefined) {
          if (premiumDays === 0) {
            updateData.premiumExpiry = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
            updateData.premiumNote = 'Unlimited (Manual Admin)';
          } else if (premiumDays > 0) {
            updateData.premiumExpiry = new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000).toISOString();
          }
          updateData.premiumGrantedAt = new Date().toISOString();
          updateData.premiumGrantedByAdmin = true;
        } else if (role !== 'premium') {
          updateData.premiumExpiry = null;
        }

        await userRef.update(updateData);
      }
    } catch (fsErr) {
      console.warn('[Admin Users PUT] Firestore update failed (Edge):', fsErr);
    }

    return NextResponse.json({
      success: true,
      message: `Role user berhasil diubah ke "${role}"${role === 'premium' && premiumDays !== undefined ? ` (${premiumDays === 0 ? 'Unlimited' : premiumDays + ' hari'})` : ''}.`,
    });
  } catch (error) {
    console.error('[admin/users POST] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

