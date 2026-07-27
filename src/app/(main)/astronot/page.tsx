import type { Metadata } from 'next';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { loadAstronautDataset, type AstronautProfile, type AstronautStatus } from '@/lib/astronautData';
import { cookies } from 'next/headers';
import { isSiteLanguage, LANGUAGE_COOKIE_KEY, defaultLanguage } from '@/lib/i18n';
import { landingText } from '@/lib/landingText';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profil Astronot, Kosmonot, dan Taikonaut | Meteorit Indonesia',
  description: 'Database profil astronot aktif, misi mendatang, dan alumni misi antariksa yang pernah bertugas di ISS, Tiangong, dan orbit Bumi.',
  keywords: ['astronot', 'kosmonot', 'taikonaut', 'manusia di antariksa', 'ISS', 'Tiangong', 'misi antariksa'],
};

function calculateDays(launchDateStr: string, returnDateStr?: string): number {
  const launchDate = new Date(launchDateStr);
  const endDate = returnDateStr ? new Date(returnDateStr) : new Date();
  const diffTime = Math.abs(endDate.getTime() - launchDate.getTime());
  const diffDays = Math.ceil(diffTime / 86400000);
  return isNaN(diffDays) ? 0 : diffDays;
}

function AstronautCard({ astro, t }: { astro: AstronautProfile; t: Record<string, string> }) {
  const days = calculateDays(astro.launchDate, astro.status === 'returned' ? astro.returnDate : undefined);
  const statusLbl =
    astro.status === 'active'
      ? (t.astroStatusActive || 'Sedang Bertugas')
      : astro.status === 'upcoming'
        ? (t.astroStatusUpcoming || 'Misi Mendatang')
        : (t.astroStatusReturned || 'Sudah Kembali');

  return (
    <div className="astro-card rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[4/5] bg-slate-900 border-b border-purple-950/20 overflow-hidden">
        <SafeImage
          src={astro.imageUrl}
          alt={astro.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          fallback="https://placehold.co/400x500/020617/a855f7?text=Astronot"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-slate-950/90 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
            {statusLbl}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="bg-slate-950/90 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase line-clamp-1">
            {astro.role}
          </span>
          <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
            {astro.status === 'upcoming'
              ? (t.astroUpcomingText || 'Terjadwal')
              : `${days} ${t.daysUnit || 'Hari'}`}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-white font-bold text-base hover:text-purple-400 transition-colors line-clamp-1">
            {astro.name}
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            {astro.agency} &bull; {astro.country}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {astro.mission || `${t.missionLabel || 'Misi'} ${astro.craft}`}
          </p>
          <p className="text-slate-400 text-xs leading-relaxed mt-3 line-clamp-3">
            {astro.biography}
          </p>
        </div>

        <Link
          href={`/astronot/${astro.id}`}
          className="w-full text-center block bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/30 hover:border-purple-600/50 py-2.5 rounded-xl text-xs font-bold transition-all duration-300"
        >
          {t.readFullBio || 'Lihat Biografi Lengkap'} &rarr;
        </Link>
      </div>
    </div>
  );
}

import AstronautListClient from '@/components/AstronautListClient';

export default async function AstronautsPage({
  searchParams
}: {
  searchParams?: { status?: string };
}) {
  const dataset = await loadAstronautDataset();
  const activeTab = (searchParams?.status as AstronautStatus) || 'active';

  // Ambil seluruh data terjemahan astronot dari D1/Firestore sekaligus untuk meminimalkan beban client-side fetch
  const translationsMap: Record<string, Record<string, { biography?: string; role?: string; country?: string }>> = {};
  
  // 1. Coba fetch dari Cloudflare D1
  let d1Success = false;
  try {
    const { queryD1 } = await import('@/lib/d1Client');
    const d1Res = await queryD1('SELECT * FROM astronaut_translations');
    if (d1Res && d1Res.results && d1Res.results.length > 0) {
      d1Res.results.forEach((row: any) => {
        const parts = row.id.split('_');
        if (parts.length >= 2) {
          const localeRaw = parts.pop() || '';
          const slug = parts.join('_');
          let locale = String(localeRaw).split(/[-_]/)[0].toLowerCase();
          if (!isSiteLanguage(locale)) {
            if (locale.startsWith('en')) locale = 'en';
            else if (locale.startsWith('zh')) locale = 'zh';
            else if (locale.startsWith('ja')) locale = 'ja';
            else if (locale.startsWith('ms')) locale = 'ms';
            else if (locale.startsWith('ru')) locale = 'ru';
            else if (locale.startsWith('fr')) locale = 'fr';
            else locale = 'en';
          }

          translationsMap[slug] = translationsMap[slug] || {};
          translationsMap[slug][locale] = {
            biography: row.biography || '',
            role: row.role || '',
            country: row.country || '',
          };
        }
      });
      d1Success = Object.keys(translationsMap).length > 0;
    }
  } catch (err) {
    console.warn("Gagal mengambil terjemahan astronot dari D1, mencoba Firestore...", err);
  }

  // 2. Fallback ke Firestore
  if (!d1Success) {
    try {
      const snapshot = await adminDb.collection('astronaut_translations').get();
      snapshot.forEach((doc: any) => {
        // doc.id formatnya: {slug}_{locale}
        const parts = doc.id.split('_');
        if (parts.length >= 2) {
          const localeRaw = parts.pop() || '';
          const slug = parts.join('_');
          const data = doc.data();

          // Normalize locale keys so variants like "en-US" or "en_us" map to `en`.
          let locale = String(localeRaw).split(/[-_]/)[0].toLowerCase();
          if (!isSiteLanguage(locale)) {
            if (locale.startsWith('en')) locale = 'en';
            else if (locale.startsWith('zh')) locale = 'zh';
            else if (locale.startsWith('ja')) locale = 'ja';
            else if (locale.startsWith('ms')) locale = 'ms';
            else if (locale.startsWith('ru')) locale = 'ru';
            else if (locale.startsWith('fr')) locale = 'fr';
            else locale = 'en';
          }

          translationsMap[slug] = translationsMap[slug] || {};
          translationsMap[slug][locale] = {
            biography: data.biography || '',
            role: data.role || '',
            country: data.country || '',
          };
        }
      });
    } catch (err) {
      console.error("Gagal mengambil daftar terjemahan astronot di server:", err);
    }
  }

  return (
    <AstronautListClient 
      initialDataset={dataset} 
      translationsMap={translationsMap} 
      defaultTab={activeTab} 
    />
  );
}
