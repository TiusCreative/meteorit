import { NextResponse } from 'next/server';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import { getGlossarySeed, type GlossaryTerm } from '@/lib/glossaryData';

export const dynamic = 'force-dynamic';

export async function GET() {
  const r2Terms = await fetchJsonFromR2<GlossaryTerm[]>('data/glossary/terms.json');
  const terms = Array.isArray(r2Terms) && r2Terms.length > 0 ? r2Terms : getGlossarySeed();

  return NextResponse.json({
    success: true,
    source: r2Terms ? 'r2' : 'seed',
    terms,
  });
}
