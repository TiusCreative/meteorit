import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import MeteoriteActions from '@/components/MeteoriteActions';
import SafeImage from '@/components/SafeImage';
import { adminDb } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';
import { isSiteLanguage, LANGUAGE_COOKIE_KEY, defaultLanguage } from '@/lib/i18n';
import { landingText } from '@/lib/landingText';

export const dynamic = 'force-dynamic';

interface Meteorite {
  id: string;
  name: string;
  translated_name: string;
  mass: string;
  year: string;
  recclass: string;
  lat: string;
  long: string;
  description: string;
  translated_description: string;
  image_url: string;
}

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

// Dynamic SEO Metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const meteorite = await getMeteorite(params.id);
  if (!meteorite) {
    return {
      title: 'Benda Langit Tidak Ditemukan - Meteorit Indonesia',
      description: 'Data meteorit tidak ditemukan di sistem kami.'
    };
  }
  return {
    title: `Meteorit ${meteorite.name} - Klasifikasi & Analisis Fisik`,
    description: meteorite.translated_description?.substring(0, 150) || `Karakteristik meteorit ${meteorite.name} bertipe ${meteorite.recclass}.`,
    keywords: ['meteorit', meteorite.name, meteorite.recclass, 'massa meteorit', 'sejarah meteorit', 'analisis laboratorium meteorit', 'benda langit jatuhan'],
  };
}

async function getMeteorite(id: string): Promise<Meteorite | null> {
  // 1. Coba dari R2
  try {
    const res = await fetch(`${R2_URL}/data/meteorites/catalog.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const catalog: Meteorite[] = await res.json();
      const matched = catalog.find(m => m.id === id);
      if (matched) return matched;
    }
  } catch (err) {
    console.warn("Failed to fetch meteorite from R2 catalog, trying Firestore...", err);
  }

  // 2. Fallback ke Firestore
  try {
    const docRef = adminDb.collection('meteorites').doc(id);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name || '',
        translated_name: data.translated_name || data.name || '',
        mass: data.mass || 'Tidak diketahui',
        year: data.year || 'Tidak diketahui',
        recclass: data.recclass || 'Meteorit',
        lat: data.lat || '0',
        long: data.long || '0',
        description: data.description || '',
        translated_description: data.translated_description || data.description || '',
        image_url: data.image_url || '',
      };
    }
  } catch (err) {
    console.error("Error reading meteorite from Firestore:", err);
  }

  return null;
}

import MeteoriteDetailClient from '@/components/MeteoriteDetailClient';

export default async function MeteoriteDetailPage({ params }: { params: { id: string } }) {
  const meteorite = await getMeteorite(params.id);
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const locale = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = landingText[locale];

  if (!meteorite) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">{t.meteorError || 'Data meteorit tidak ditemukan.'}</p>
          <Link href="/ensiklopedia" className="text-cyan-400 hover:underline mt-4 inline-block">{t.backToCatalog || 'Kembali ke Katalog'}</Link>
        </div>
      </div>
    );
  }

  return (
    <MeteoriteDetailClient initialMeteorite={meteorite} />
  );
}
