export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { queryD1 } from '@/lib/d1Client';
import { verifyAdmin } from '@/lib/verifyAdminToken';

export const dynamic = 'force-dynamic';

/**
 * Rebuild R2 history.json and latest.json cache from Firestore
 */
async function rebuildR2ApodHistoryCache() {
  try {
    const d1Res = await queryD1('SELECT id, date, title, explanation, image_url, copyright FROM apod_history ORDER BY id DESC LIMIT 200');
    if (d1Res?.results?.length) {
      const historyList = d1Res.results.map((r: any) => ({
        id: r.id,
        title: typeof r.title === 'string' && r.title.startsWith('{') ? JSON.parse(r.title) : { en: r.title, id: r.title },
        explanation: typeof r.explanation === 'string' && r.explanation.startsWith('{') ? JSON.parse(r.explanation) : { en: r.explanation, id: r.explanation },
        image_url: r.image_url,
        copyright: r.copyright || 'NASA Public Domain',
        media_type: 'image'
      }));
      await uploadToR2('data/encyclopedia/history.json', JSON.stringify(historyList, null, 2), 'application/json');
      await uploadToR2('data/encyclopedia/latest.json', JSON.stringify(historyList[0], null, 2), 'application/json');
      console.log(`[Admin APOD API] Rebuilt R2 cache with ${historyList.length} APOD items.`);
    }
  } catch (err) {
    console.error('[Admin APOD API] Failed to rebuild R2 cache:', err);
  }
}

import { translateText } from '@/lib/translator';

// AI Translation using central translateText helper
async function translateWithGroq(text: string, systemPrompt: string): Promise<string> {
  return await translateText(text, systemPrompt);
}

// GET: Fetch list of APOD articles
export async function GET(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const snapshot = await adminDb.collection('apod_history')
      .orderBy('id', 'desc')
      .limit(limit * 2)
      .get();

    let apods: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const item = { id: doc.id, ...data };
      if (search) {
        const titleId = (data.title?.id || '').toLowerCase();
        const titleEn = (data.title?.en || '').toLowerCase();
        const docId = doc.id.toLowerCase();
        if (docId.includes(search) || titleId.includes(search) || titleEn.includes(search)) {
          apods.push(item);
        }
      } else {
        apods.push(item);
      }
    });

    apods = apods.slice(0, limit);

    return NextResponse.json({
      success: true,
      total: apods.length,
      apods
    });
  } catch (error) {
    console.error('[Admin APOD GET] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT: Edit existing APOD article
export async function PUT(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, explanation, copyright, image_url, media_type } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID APOD (tanggal YYYY-MM-DD) wajib diisi.' }, { status: 400 });
    }

    if (!title || (!title.id && !title.en)) {
      return NextResponse.json({ error: 'Judul APOD wajib diisi.' }, { status: 400 });
    }

    const docRef = adminDb.collection('apod_history').doc(id);
    const docSnap = await docRef.get();
    const existing = docSnap.exists ? docSnap.data() : {};

    const updatedApod = {
      id,
      title: {
        en: title.en || existing?.title?.en || '',
        id: title.id || existing?.title?.id || '',
        ...title
      },
      explanation: {
        en: explanation.en || existing?.explanation?.en || '',
        id: explanation.id || existing?.explanation?.id || '',
        ...explanation
      },
      copyright: copyright !== undefined ? copyright : (existing?.copyright || 'NASA Public Domain'),
      image_url: image_url || existing?.image_url || '',
      media_type: media_type || existing?.media_type || 'image',
      updatedAt: new Date().toISOString(),
      processedAt: existing?.processedAt || new Date().toISOString()
    };

    // 1. Update Firestore
    await docRef.set(updatedApod, { merge: true });

    // 2. Update Cloudflare D1
    try {
      await queryD1(
        `INSERT OR REPLACE INTO apod_history (
          id, date, title, explanation, image_url, translations, processedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          id,
          updatedApod.title.id || updatedApod.title.en,
          updatedApod.explanation.id || updatedApod.explanation.en,
          updatedApod.image_url,
          JSON.stringify({ title: updatedApod.title, explanation: updatedApod.explanation }),
          updatedApod.updatedAt
        ]
      );
    } catch (d1Err) {
      console.warn('[Admin APOD PUT] D1 sync warning:', d1Err);
    }

    // 3. Rebuild Cloudflare R2 cache
    await rebuildR2ApodHistoryCache();

    return NextResponse.json({
      success: true,
      message: `APOD tanggal ${id} berhasil diperbarui.`,
      apod: updatedApod
    });
  } catch (error) {
    console.error('[Admin APOD PUT] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE: Hapus APOD article
export async function DELETE(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID APOD (tanggal YYYY-MM-DD) diperlukan.' }, { status: 400 });
    }

    // 1. Delete from Firestore
    try {
      await adminDb.collection('apod_history').doc(id).delete();
    } catch (fsErr) {
      console.warn(`[Admin APOD DELETE] Firestore delete failed for ${id}:`, fsErr);
    }

    // 2. Delete from D1
    try {
      await queryD1(`DELETE FROM apod_history WHERE id = ?;`, [id]);
    } catch (d1Err) {
      console.warn(`[Admin APOD DELETE] D1 delete failed for ${id}:`, d1Err);
    }

    // 3. Rebuild R2 cache
    await rebuildR2ApodHistoryCache();

    return NextResponse.json({
      success: true,
      message: `Artikel APOD ${id} berhasil dihapus.`
    });
  } catch (error) {
    console.error('[Admin APOD DELETE] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST: Action handlers (Re-translate AI or Fetch NASA APOD date)
export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, text, date } = body;

    if (action === 'retranslate') {
      if (!text) {
        return NextResponse.json({ error: 'Teks untuk diterjemahkan wajib diisi.' }, { status: 400 });
      }
      const translatedTitle = await translateWithGroq(
        text.title || '',
        'Terjemahkan judul astronomi berikut ke Bahasa Indonesia secara singkat dan menarik. Hasil terjemahan harus berupa teks terjemahan langsung saja, TANPA pengantar atau tanda kutip.'
      );
      const translatedExplanation = await translateWithGroq(
        text.explanation || '',
        'Terjemahkan deskripsi ilmiah astronomi berikut ke Bahasa Indonesia yang mudah dipahami. Hasil terjemahan harus berupa teks terjemahan langsung saja, TANPA pengantar.'
      );

      return NextResponse.json({
        success: true,
        translated: {
          title: translatedTitle,
          explanation: translatedExplanation
        }
      });
    }

    if (action === 'fetch_nasa') {
      if (!date) {
        return NextResponse.json({ error: 'Tanggal YYYY-MM-DD wajib diisi.' }, { status: 400 });
      }
      // Panggil endpoint cron internal untuk fetch tanggal tersebut dengan parameter force=true
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || 'localhost:3000';
      const cronSecret = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      
      const fetchUrl = `${protocol}://${host}/api/cron/apod?secret=${encodeURIComponent(cronSecret)}&force=true&date=${date}`;
      const cronRes = await fetch(fetchUrl);
      const cronData = await cronRes.json();

      if (!cronRes.ok || cronData.error) {
        return NextResponse.json({ error: cronData.error || 'Gagal mengambil APOD dari NASA API.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `APOD tanggal ${date} berhasil diambil dan diproses dari NASA API.`,
        data: cronData
      });
    }

    return NextResponse.json({ error: 'Action tidak dikenal.' }, { status: 400 });
  } catch (error) {
    console.error('[Admin APOD POST] error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
