export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { verifyAdmin } from '@/lib/verifyAdminToken';
import { queryD1 } from '@/lib/d1Client';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar meteorit lengkap langsung dari Firestore
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    // 1. Ambil dari D1 jika tersedia
    try {
      const d1Res = await queryD1('SELECT * FROM meteorites ORDER BY name ASC');
      if (d1Res?.results?.length) {
        return NextResponse.json(d1Res.results);
      }
    } catch (d1Err) {
      console.warn('[API Meteorites GET] D1 query failed, trying Firestore:', d1Err);
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
    list.push({ ...data, id: String(doc.id) });
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
