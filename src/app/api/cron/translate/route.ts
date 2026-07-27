import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const DEFAULT_CRON_SECRET = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';

async function rebuildR2BlogCache() {
  const allArticlesSnapshot = await adminDb.collection('articles').get();
  const articlesList: any[] = [];
  allArticlesSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.status === 'Published') {
      articlesList.push({ id: doc.id, ...data });
    }
  });

  articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
}

async function rebuildR2AstronautCache() {
  const allAstronautsSnapshot = await adminDb.collection('astronauts').get();
  const astronautsList: any[] = [];
  allAstronautsSnapshot.forEach((doc: any) => {
    astronautsList.push(doc.data());
  });

  const dataset = {
    astronauts: astronautsList,
    summary: {
      active: astronautsList.filter(a => a.status === 'active').length,
      upcoming: astronautsList.filter(a => a.status === 'upcoming').length,
      returned: astronautsList.filter(a => a.status === 'returned').length,
      total: astronautsList.length
    },
    source: 'Open Notify API + Meteorit Indonesia archive',
    updatedAt: new Date().toISOString()
  };

  await uploadToR2('data/astronauts/astronauts.json', JSON.stringify(dataset, null, 2), 'application/json');
}

async function rebuildR2GlossaryCache() {
  const allTermsSnapshot = await adminDb.collection('glossary_terms').get();
  const termsList: any[] = [];
  allTermsSnapshot.forEach((doc: any) => {
    termsList.push(doc.data());
  });

  await uploadToR2('data/glossary/terms.json', JSON.stringify(termsList, null, 2), 'application/json');
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');

  const correctSecret = process.env.CRON_SECRET || DEFAULT_CRON_SECRET;

  if (secret !== correctSecret && authHeader !== `Bearer ${correctSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, type, translations } = await request.json();

    if (!id || !translations) {
      return NextResponse.json({ error: 'Missing id or translations in request body.' }, { status: 400 });
    }

    const collectionName = type || 'articles';
    const docRef = adminDb.collection(collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: `Document with ID ${id} not found in collection ${collectionName}.` }, { status: 404 });
    }

    // Update translations field in Firestore
    await docRef.update({
      translations,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Translation Sync] Successfully synced translations for ${id} in ${collectionName}`);

    // Rebuild respective R2 caches
    if (collectionName === 'articles') {
      await rebuildR2BlogCache();
      console.log(`[Translation Sync] Rebuilt R2 blog cache`);
    } else if (collectionName === 'astronauts') {
      await rebuildR2AstronautCache();
      console.log(`[Translation Sync] Rebuilt R2 astronaut cache`);
    } else if (collectionName === 'glossary_terms') {
      await rebuildR2GlossaryCache();
      console.log(`[Translation Sync] Rebuilt R2 glossary cache`);
    }

    return NextResponse.json({
      success: true,
      message: `Translations for ${id} successfully synchronized to Firestore & R2.`
    });

  } catch (error) {
    console.error('[Translation Sync] Error:', error);
    return NextResponse.json({
      error: 'Failed to synchronize translations.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
