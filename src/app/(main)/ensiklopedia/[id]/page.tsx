export const runtime = 'edge';
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
  const targetId = String(id);
  // 1. Coba dari R2
  try {
    const res = await fetch(`${R2_URL}/data/meteorites/catalog.json?t=${Date.now()}`);
    if (res.ok) {
      const catalog: Meteorite[] = await res.json();
      const matched = catalog.find(m => String(m.id) === targetId || (m.name && m.name.toLowerCase() === targetId.toLowerCase()));
      if (matched) return matched;
    }
  } catch (err) {
    console.warn("Failed to fetch meteorite from R2 catalog, trying D1/Firestore...", err);
  }

  // 2. Fallback ke Cloudflare D1
  try {
    const { queryD1 } = await import('@/lib/d1Client');
    const d1Res = await queryD1('SELECT * FROM meteorites WHERE id = ? OR LOWER(name) = ? LIMIT 1', [targetId, targetId.toLowerCase()]);
    if (d1Res.success && d1Res.results && d1Res.results.length > 0) {
      const data = d1Res.results[0];
      return {
        id: String(data.id),
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
  } catch (d1Err) {
    console.warn("Failed to read meteorite from D1 fallback, trying Firestore...", d1Err);
  }

  // 3. Fallback ke Firestore (Kueri Dokumen ID)
  try {
    const docRef = adminDb.collection('meteorites').doc(targetId);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data();
      return {
        id: String(snap.id),
        name: data?.name || '',
        translated_name: data?.translated_name || data?.name || '',
        mass: data?.mass || 'Tidak diketahui',
        year: data?.year || 'Tidak diketahui',
        recclass: data?.recclass || 'Meteorit',
        lat: data?.lat || '0',
        long: data?.long || '0',
        description: data?.description || '',
        translated_description: data?.translated_description || data?.description || '',
        image_url: data?.image_url || '',
      };
    }
  } catch (err) {
    console.error("Error reading meteorite from Firestore:", err);
  }

  // 4. Fallback ke Firestore (Kueri Field 'id' Angka/Teks atau Nama jika Doc ID berbeda)
  try {
    let snapField = await adminDb.collection('meteorites').where('id', '==', targetId).get();
    if (snapField.empty && !isNaN(Number(targetId))) {
      snapField = await adminDb.collection('meteorites').where('id', '==', Number(targetId)).get();
    }
    if (snapField.empty) {
      snapField = await adminDb.collection('meteorites').where('name', '==', targetId).get();
    }

    if (!snapField.empty) {
      const doc = snapField.docs[0];
      const data = doc.data();
      const result: Meteorite = {
        id: String(data.id || doc.id),
        name: data?.name || '',
        translated_name: data?.translated_name || data?.name || '',
        mass: data?.mass || 'Tidak diketahui',
        year: data?.year || 'Tidak diketahui',
        recclass: data?.recclass || 'Meteorit',
        lat: data?.lat || '0',
        long: data?.long || '0',
        description: data?.description || '',
        translated_description: data?.translated_description || data?.description || '',
        image_url: data?.image_url || '',
      };

      // Trigger background sync to rebuild R2 catalog so R2 has this entry for next visits
      try {
        const snapshot = await adminDb.collection('meteorites').get();
        const fullList: any[] = [];
        snapshot.forEach((d: any) => {
          fullList.push({ ...d.data(), id: String(d.id) });
        });
        const { uploadToR2 } = await import('@/lib/r2Client');
        await uploadToR2('data/meteorites/catalog.json', JSON.stringify(fullList, null, 2), 'application/json');
      } catch {}

      return result;
    }
  } catch (err) {
    console.error("Error querying meteorite by field/name in Firestore:", err);
  }

  return null;
}

import MeteoriteDetailClient from '@/components/MeteoriteDetailClient';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seoSchemas';

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

  const name = meteorite.translated_name || meteorite.name;
  const description = meteorite.translated_description || meteorite.description || `Spesimen meteorit ${name} klasifikasi ${meteorite.recclass} dengan massa fisik ${meteorite.mass}.`;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Ensiklopedia', url: '/ensiklopedia' },
    { name: name, url: `/ensiklopedia/${meteorite.id}` },
  ]);

  const articleSchema = generateArticleSchema({
    title: `Meteorit ${name} (${meteorite.recclass})`,
    description: description,
    url: `/ensiklopedia/${meteorite.id}`,
    image: meteorite.image_url || '/logo.png',
    category: 'Katalog Meteorit',
  });

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, articleSchema]} />
      <MeteoriteDetailClient initialMeteorite={meteorite} />
    </>
  );
}
