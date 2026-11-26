export const runtime = 'edge';
import GlossaryClient from '@/components/GlossaryClient';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import { getGlossarySeed, type GlossaryTerm } from '@/lib/glossaryData';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema } from '@/lib/seoSchemas';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Glossarium Sains BMKG & NASA - Meteorit Indonesia',
  description: 'Kamus istilah meteorologi BMKG dan astronomi NASA multi-bahasa untuk edukasi sains publik.',
  keywords: ['glossarium sains', 'kamus BMKG', 'kamus NASA', 'meteorologi', 'astronomi', 'istilah sains'],
};

export default async function GlossariumPage() {
  const r2Terms = await fetchJsonFromR2<GlossaryTerm[]>('data/glossary/terms.json');
  const baseTerms = Array.isArray(r2Terms) && r2Terms.length > 0 ? r2Terms : getGlossarySeed();
  const termMap = new Map<string, GlossaryTerm>(baseTerms.map(t => [t.id, t]));

  // Merge istilah AI/tambahan dari D1 agar selalu muncul di halaman Glosarium
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

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Glossarium', url: '/glossarium' },
  ]);

  const definedTermSetSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Kamus Istilah Sains & Astronomi BMKG / NASA',
    description: 'Daftar istilah penting dalam bidang meteorologi, astronomi, dan sains kebumian.',
    hasDefinedTerm: terms.slice(0, 20).map(t => ({
      '@type': 'DefinedTerm',
      name: t.term.id || t.term.en,
      description: t.definition.id || t.definition.en,
      url: `https://www.meteorit.my.id/glossarium/${t.id}`,
    })),
  };

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, definedTermSetSchema]} />
      <GlossaryClient initialTerms={terms} />
    </>
  );
}
