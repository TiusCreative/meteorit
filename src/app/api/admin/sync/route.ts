import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { buildAstronautDataset, type AstronautProfile } from '@/lib/astronautData';
import { queryD1 } from '@/lib/d1Client';

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

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Tidak diizinkan. Khusus Administrator.' }, { status: 403 });
    }

    console.log('[Admin Sync] Memulai sinkronisasi manual database Firestore ke Cloudflare R2 & D1...');

    // 1. Sync Articles
    const articlesSnapshot = await adminDb.collection('articles').get();
    const articlesList: any[] = [];
    articlesSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === 'Published') {
        articlesList.push({ id: doc.id, ...data });
      }
    });
    // Sort by createdAt descending
    articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');

    // Sync to D1
    for (const art of articlesList) {
      try {
        const r2Path = `data/blog/articles/${art.id}.json`;
        const tags = Array.isArray(art.tags) ? art.tags.join(',') : (art.tags || '');
        await queryD1(
          `INSERT OR REPLACE INTO articles (
            id, title, category, r2_path, createdAt, tags, image, excerpt, date, views, status, review_status, ai_provider
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            art.id,
            art.title || '',
            art.category || 'Trivia',
            r2Path,
            art.createdAt || new Date().toISOString(),
            tags,
            art.image || art.imageUrl || '',
            art.excerpt || art.content?.substring(0, 150) + '...' || '',
            art.date || '',
            art.views || 0,
            art.status || 'Published',
            art.review_status || 'Otomatis',
            art.ai_provider || ''
          ]
        );
      } catch (d1Err) {
        console.error(`[Admin Sync] Gagal sync artikel ${art.id} ke D1:`, d1Err);
      }
    }


    // 2. Sync Meteorites
    const meteoritesSnapshot = await adminDb.collection('meteorites').get();
    const meteoritesList: any[] = [];
    meteoritesSnapshot.forEach((doc: any) => {
      meteoritesList.push({ id: doc.id, ...doc.data() });
    });
    // Sort by name
    meteoritesList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    await uploadToR2('data/meteorites/catalog.json', JSON.stringify(meteoritesList, null, 2), 'application/json');

    // 3. Sync Glossary Terms
    const glossarySnapshot = await adminDb.collection('glossary_terms').get();
    const glossaryList: any[] = [];
    glossarySnapshot.forEach((doc: any) => {
      glossaryList.push({ id: doc.id, ...doc.data() });
    });
    // Sort by id or name
    glossaryList.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    await uploadToR2('data/glossary/terms.json', JSON.stringify(glossaryList, null, 2), 'application/json');

    // 4. Sync Astronauts
    const astronautsSnapshot = await adminDb.collection('astronauts').get();
    const astronautsList: AstronautProfile[] = [];
    astronautsSnapshot.forEach((doc: any) => {
      astronautsList.push({ id: doc.id, ...doc.data() } as AstronautProfile);
    });
    const astronautDataset = buildAstronautDataset(astronautsList, 'Firestore Database Sync');
    await uploadToR2('data/astronauts/astronauts.json', JSON.stringify(astronautDataset, null, 2), 'application/json');

    console.log('[Admin Sync] Sinkronisasi manual selesai.');

    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi manual Firestore ke Cloudflare R2 berhasil!',
      stats: {
        articles: articlesList.length,
        meteorites: meteoritesList.length,
        glossary: glossaryList.length,
        astronauts: astronautsList.length
      }
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Admin Sync Error]:', errMsg);
    return NextResponse.json({
      error: 'Gagal melakukan sinkronisasi database.',
      details: errMsg
    }, { status: 500 });
  }
}
