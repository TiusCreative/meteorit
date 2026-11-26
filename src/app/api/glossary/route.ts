export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import { getGlossarySeed, type GlossaryTerm } from '@/lib/glossaryData';

export const dynamic = 'force-dynamic';

export async function GET() {
  const r2Terms = await fetchJsonFromR2<GlossaryTerm[]>('data/glossary/terms.json');
  const baseTerms = Array.isArray(r2Terms) && r2Terms.length > 0 ? r2Terms : getGlossarySeed();
  const termMap = new Map<string, GlossaryTerm>(baseTerms.map(t => [t.id, t]));

  try {
    const { queryD1 } = await import('@/lib/d1Client');
    const d1Res = await queryD1('SELECT id, translations FROM glossary_terms');
    for (const row of (d1Res?.results || []) as any[]) {
      if (row?.translations) {
        try {
          const parsed = JSON.parse(row.translations) as GlossaryTerm;
          if (parsed?.id && (!termMap.has(parsed.id) || (parsed as any).aiGenerated)) {
            termMap.set(parsed.id, parsed);
          }
        } catch {}
      }
    }
  } catch {}

  const terms = Array.from(termMap.values());

  return NextResponse.json({
    success: true,
    source: r2Terms ? 'r2+d1' : 'seed+d1',
    terms,
  });
}
