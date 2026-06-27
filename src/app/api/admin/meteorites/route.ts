import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';

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

// GET: Ambil daftar meteorit lengkap langsung dari Firestore
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    // Try deleting the bad APOD entry 2026-06-23 if it exists (one-time cleanup)
    try {
      await adminDb.collection('apod_history').doc('2026-06-23').delete();
    } catch (cleanupErr) {
      console.warn("Failed to delete 2026-06-23 APOD entry:", cleanupErr);
    }

    const snapshot = await adminDb.collection('meteorites').get();
    const list: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      list.push({ id: doc.id, ...data });
    });

    // Urutkan berdasarkan nama
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return NextResponse.json(list);
  } catch (error) {
    console.error('[API Meteorites GET] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function rebuildR2MeteoritesCache() {
  const snapshot = await adminDb.collection('meteorites').get();
  const list: any[] = [];
  snapshot.forEach((doc: any) => {
    const data = doc.data();
    list.push({ id: doc.id, ...data });
  });

  // Save JSON array index list to Cloudflare R2
  await uploadToR2('data/meteorites/catalog.json', JSON.stringify(list, null, 2), 'application/json');
}

// PUT: Edit Meteorit
export async function PUT(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, recclass, year, mass, lat, long, translated_description, image_url } = body;

    if (!id || !name || !recclass) {
      return NextResponse.json({ error: 'ID, Nama, dan Tipe Klasifikasi wajib diisi.' }, { status: 400 });
    }

    const docRef = adminDb.collection('meteorites').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Meteorit tidak ditemukan.' }, { status: 404 });
    }

    const updatedData: any = {
      name,
      translated_name: name,
      recclass,
      year: year || 'Tidak diketahui',
      mass: mass || 'Tidak diketahui',
      lat: lat || '0',
      long: long || '0',
      description: `Meteorite landing named ${name} categorized as class ${recclass}.`,
      translated_description: translated_description || '',
      updatedAt: new Date().toISOString()
    };

    if (image_url) {
      updatedData.image_url = image_url;
    }

    await docRef.set(updatedData, { merge: true });
    await rebuildR2MeteoritesCache();

    return NextResponse.json({ success: true, message: 'Data meteorit berhasil diperbarui.' });
  } catch (error) {
    console.error('[API Meteorites PUT] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE: Hapus Meteorit
export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID meteorit diperlukan.' }, { status: 400 });
    }

    await adminDb.collection('meteorites').doc(id).delete();
    await rebuildR2MeteoritesCache();

    return NextResponse.json({ success: true, message: 'Meteorit berhasil dihapus dari database.' });
  } catch (error) {
    console.error('[API Meteorites DELETE] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
