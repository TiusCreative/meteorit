export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { fetchJsonFromR2, uploadToR2 } from '@/lib/r2Client';
import { queryD1 } from '@/lib/d1Client';
import { getGlossarySeed, type GlossaryTerm } from '@/lib/glossaryData';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';

import { isValidCronRequest } from '@/lib/cronAuth';

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const nowIso = new Date().toISOString();
    const mergedMap = new Map<string, GlossaryTerm>();

    // 1. Seed terms sebagai baseline
    for (const seedTerm of getGlossarySeed()) {
      mergedMap.set(seedTerm.id, {
        ...seedTerm,
        updatedAt: nowIso,
      });
    }

    // 2. Pertahankan terms yang sudah ada di R2 (termasuk istilah AI baru & tanggal terbit asli)
    try {
      const existingR2 = await fetchJsonFromR2<GlossaryTerm[]>('data/glossary/terms.json');
      if (Array.isArray(existingR2)) {
        for (const r2Term of existingR2) {
          if (!r2Term?.id) continue;
          const base = mergedMap.get(r2Term.id);
          if (base) {
            mergedMap.set(r2Term.id, {
              ...base,
              publishedAt: r2Term.publishedAt || base.publishedAt,
              date: r2Term.date || base.date,
              image: r2Term.image || base.image,
            });
          } else {
            mergedMap.set(r2Term.id, r2Term);
          }
        }
      }
    } catch (r2Err) {
      console.warn('[Cron Glossary] Failed to read existing R2 terms.json for merge:', r2Err);
    }

    // 3. Pertahankan seluruh istilah (termasuk AI generated) dari D1 glossary_terms
    try {
      const d1Rows = await queryD1('SELECT id, translations FROM glossary_terms');
      if (Array.isArray(d1Rows?.results)) {
        for (const row of d1Rows.results as any[]) {
          if (!row?.id || !row?.translations) continue;
          try {
            const parsed = JSON.parse(row.translations) as GlossaryTerm;
            if (!parsed?.id) continue;
            const base = mergedMap.get(parsed.id);
            if (!base || parsed.aiGenerated) {
              mergedMap.set(parsed.id, {
                ...base,
                ...parsed,
                publishedAt: parsed.publishedAt || base?.publishedAt || parsed.updatedAt,
                date: parsed.date || base?.date,
              });
            }
          } catch {
            // Skip invalid JSON row
          }
        }
      }
    } catch (d1ReadErr) {
      console.warn('[Cron Glossary] Failed to read D1 glossary_terms for merge:', d1ReadErr);
    }

    const terms = Array.from(mergedMap.values());

    const batch = adminDb.batch();
    terms.forEach((term) => {
      batch.set(adminDb.collection('glossary_terms').doc(term.id), term, { merge: true });
    });
    await batch.commit();

    await uploadToR2('data/glossary/terms.json', JSON.stringify(terms, null, 2), 'application/json');

    // Sync to Cloudflare D1
    try {
      for (const t of terms) {
        await queryD1(
          'INSERT OR REPLACE INTO glossary_terms (id, term, definition, translations) VALUES (?, ?, ?, ?)',
          [t.id, t.term.id || t.term.en, t.definition.id || t.definition.en, JSON.stringify(t)]
        );
      }
    } catch (d1Err) {
      console.warn('[Cron Glossary] D1 sync error:', d1Err);
    }

    return NextResponse.json({
      success: true,
      message: 'Glossarium BMKG dan NASA berhasil diperbarui (merged) ke Firestore, D1, dan R2.',
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
