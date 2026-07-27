import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { getGlossarySeed } from '@/lib/glossaryData';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';

import { isValidCronRequest } from '@/lib/cronAuth';

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const terms = getGlossarySeed().map((term) => ({
      ...term,
      updatedAt: new Date().toISOString(),
    }));

    const batch = adminDb.batch();
    terms.forEach((term) => {
      batch.set(adminDb.collection('glossary_terms').doc(term.id), term, { merge: true });
    });
    await batch.commit();

    await uploadToR2('data/glossary/terms.json', JSON.stringify(terms, null, 2), 'application/json');

    return NextResponse.json({
      success: true,
      message: 'Glossarium BMKG dan NASA berhasil diperbarui ke Firestore dan R2.',
      total: terms.length,
      r2Key: 'data/glossary/terms.json',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal memperbarui glossarium.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
