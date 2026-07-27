import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

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

    // Ambil semua users dari Firestore (tanpa server-side pagination karena Firestore tidak punya full-text search)
    const snapshot = await adminDb.collection('users').get();
    let allUsers: any[] = [];

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

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    const updateData: any = {
      role,
      updatedAt: new Date().toISOString(),
    };

    // Hitung premiumExpiry jika role premium dengan durasi
    if (role === 'premium' && premiumDays !== undefined) {
      if (premiumDays === 0) {
        // Unlimited: set expiry 100 tahun ke depan
        updateData.premiumExpiry = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
        updateData.premiumNote = 'Unlimited (Manual Admin)';
      } else if (premiumDays > 0) {
        updateData.premiumExpiry = new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000).toISOString();
      }
      updateData.premiumGrantedAt = new Date().toISOString();
      updateData.premiumGrantedByAdmin = true;
    } else if (role !== 'premium') {
      // Jika di-downgrade dari premium, hapus expiry
      updateData.premiumExpiry = null;
    }

    await userRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: `Role user berhasil diubah ke "${role}"${role === 'premium' && premiumDays !== undefined ? ` (${premiumDays === 0 ? 'Unlimited' : premiumDays + ' hari'})` : ''}.`,
    });
  } catch (error) {
    console.error('[admin/users POST] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

