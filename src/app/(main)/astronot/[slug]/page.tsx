import Link from 'next/link';
import AstronautActions from '@/components/AstronautActions';
import SafeImage from '@/components/SafeImage';
import { getAstronautBySlug, type AstronautProfile } from '@/lib/astronautData';
import { cookies } from 'next/headers';
import { isSiteLanguage, LANGUAGE_COOKIE_KEY, defaultLanguage } from '@/lib/i18n';
import { landingText } from '@/lib/landingText';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// AI Translation helper using Groq
async function translateText(text: string, systemPrompt = 'Terjemahkan teks berikut ke bahasa Indonesia.'): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3
      })
    });

    const result = await response.json();
    if (result.choices && result.choices[0]?.message?.content) {
      return result.choices[0].message.content.trim();
    }
    return text;
  } catch (error) {
    console.error('Groq Translation error in Astronaut page:', error);
    return text;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const astro = await getAstronautBySlug(params.slug);
  if (!astro) {
    return {
      title: 'Astronot Tidak Ditemukan - Meteorit Indonesia',
      description: 'Detail profil astronot tidak ditemukan di sistem kami.'
    };
  }
  return {
    title: `Profil ${astro.name} (${astro.role}) - Meteorit Indonesia`,
    description: `Biografi, negara asal, agensi, dan misi antariksa ${astro.name} di ${astro.craft}.`,
    keywords: [astro.name, astro.role, astro.country, astro.agency, 'astronot', 'misi antariksa'],
  };
}

function calculateDays(launchDateStr: string, returnDateStr?: string): number {
  const launchDate = new Date(launchDateStr);
  const endDate = returnDateStr ? new Date(returnDateStr) : new Date();
  const diffTime = Math.abs(endDate.getTime() - launchDate.getTime());
  const diffDays = Math.ceil(diffTime / 86400000);
  return isNaN(diffDays) ? 0 : diffDays;
}

function statusCopy(astro: AstronautProfile, t: any) {
  if (astro.status === 'active') return { label: t.astroStatusActive || 'Sedang Bertugas', accent: 'text-green-300', badge: 'bg-green-900/60 text-green-300 border-green-500/20' };
  if (astro.status === 'upcoming') return { label: t.astroStatusUpcoming || 'Misi Mendatang', accent: 'text-amber-300', badge: 'bg-amber-900/60 text-amber-300 border-amber-500/20' };
  return { label: t.astroStatusReturned || 'Sudah Kembali', accent: 'text-cyan-300', badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-500/20' };
}

import AstronautDetailClient from '@/components/AstronautDetailClient';

export default async function AstronautDetailPage({ params }: { params: { slug: string } }) {
  const astro = await getAstronautBySlug(params.slug);
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const locale = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = landingText[locale];

  if (!astro) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">{t.astroError || 'Profil astronot tidak ditemukan.'}</p>
          <Link href="/astronot" className="text-cyan-400 hover:underline mt-4 inline-block">{t.backToAstronaut || 'Kembali ke Database Astronot'}</Link>
        </div>
      </div>
    );
  }

  return (
    <AstronautDetailClient initialAstro={astro} />
  );
}
