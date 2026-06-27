import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getGlobalSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Verifikasi bahwa requester adalah admin (email ada di whitelist)
async function verifyAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('x-admin-email');
  if (!authHeader) return false;
  try {
    const settings = await getGlobalSettings();
    return settings.adminEmails.map(e => e.toLowerCase()).includes(authHeader.toLowerCase());
  } catch {
    return false;
  }
}

// GET: Ambil daftar admin emails
export async function GET() {
  try {
    const settings = await getGlobalSettings();
    return NextResponse.json({
      success: true,
      adminEmails: settings.adminEmails || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST: Tambah email baru sebagai admin
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, requestorEmail } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 });
    }

    // Cek requestor adalah admin
    const settings = await getGlobalSettings();
    const currentAdmins = settings.adminEmails || [];

    if (requestorEmail && !currentAdmins.map((e: string) => e.toLowerCase()).includes(requestorEmail.toLowerCase())) {
      return NextResponse.json({ error: 'Tidak diizinkan. Hanya admin yang bisa menambah admin.' }, { status: 403 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (currentAdmins.map((e: string) => e.toLowerCase()).includes(cleanEmail)) {
      return NextResponse.json({ success: true, message: 'Email sudah terdaftar sebagai admin.' });
    }

    const updatedEmails = [...currentAdmins, cleanEmail];

    // Update di Firestore settings
    const docRef = adminDb.collection('settings').doc('global');
    await docRef.set({ adminEmails: updatedEmails }, { merge: true });

    // Juga catat di collection admins untuk tracking
    await adminDb.collection('admins').doc(cleanEmail.replace('@', '_at_')).set({
      email: cleanEmail,
      addedAt: new Date().toISOString(),
      addedBy: requestorEmail || 'system'
    });

    console.log(`[make-admin] Admin ditambahkan: ${cleanEmail} oleh ${requestorEmail}`);
    return NextResponse.json({ success: true, message: `${cleanEmail} berhasil ditambahkan sebagai admin.` });

  } catch (error) {
    console.error('[make-admin] POST error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE: Hapus email dari daftar admin
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { email, requestorEmail } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email diperlukan.' }, { status: 400 });
    }

    const settings = await getGlobalSettings();
    const currentAdmins = settings.adminEmails || [];

    // Cek requestor adalah admin
    if (requestorEmail && !currentAdmins.map((e: string) => e.toLowerCase()).includes(requestorEmail.toLowerCase())) {
      return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Jangan hapus admin terakhir
    if (currentAdmins.length <= 1) {
      return NextResponse.json({ error: 'Tidak bisa menghapus admin terakhir!' }, { status: 400 });
    }

    const updatedEmails = currentAdmins.filter((e: string) => e.toLowerCase() !== cleanEmail);

    const docRef = adminDb.collection('settings').doc('global');
    await docRef.set({ adminEmails: updatedEmails }, { merge: true });

    // Hapus dari collection admins
    try {
      await adminDb.collection('admins').doc(cleanEmail.replace('@', '_at_')).delete();
    } catch { /* ignore */ }

    return NextResponse.json({ success: true, message: `${cleanEmail} dihapus dari daftar admin.` });

  } catch (error) {
    console.error('[make-admin] DELETE error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
