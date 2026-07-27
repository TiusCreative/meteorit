import GlossaryClient from '@/components/GlossaryClient';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import { getGlossarySeed, type GlossaryTerm } from '@/lib/glossaryData';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Glossarium Sains BMKG & NASA - Meteorit Indonesia',
  description: 'Kamus istilah meteorologi BMKG dan astronomi NASA multi-bahasa untuk edukasi sains publik.',
  keywords: ['glossarium sains', 'kamus BMKG', 'kamus NASA', 'meteorologi', 'astronomi', 'istilah sains'],
};

export default async function GlossariumPage() {
  const r2Terms = await fetchJsonFromR2<GlossaryTerm[]>('data/glossary/terms.json');
  const terms = Array.isArray(r2Terms) && r2Terms.length > 0 ? r2Terms : getGlossarySeed();

  return <GlossaryClient initialTerms={terms} />;
}
