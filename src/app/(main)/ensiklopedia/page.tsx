import EncyclopediaWithTabs from '@/components/EncyclopediaWithTabs';
import { adminDb } from '@/lib/firebaseAdmin';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema, generateDatasetSchema } from '@/lib/seoSchemas';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Katalog Ensiklopedia Meteorit & Komet - Meteorit Indonesia',
  description: 'Jelajahi database fisik, masa berat, tipe klasifikasi, tahun pendaratan, dan koordinat geografis meteorit luar angkasa. Serta data komet & asteroid yang melintas dekat Bumi dari NASA NeoWs.',
  keywords: ['katalog meteorit', 'klasifikasi meteorit', 'jenis meteorit', 'komet asteroid', 'NASA NeoWs', 'pendaratan meteorit', 'database meteorit'],
};

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

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
  createdAt?: string;
  translations?: Record<string, any>;
}

export default async function EncyclopediaPage() {
  let meteorites: Meteorite[] = [];

  // 1. Coba dari R2
  try {
    const res = await fetch(`${R2_URL}/data/meteorites/catalog.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      meteorites = await res.json();
    }
  } catch (err) {
    console.warn("Failed to fetch meteorites catalog from R2, falling back to Firestore:", err);
  }

  // 2. Jika Firestore memiliki data lebih baru / lebih banyak dari R2 cache
  try {
    const snapshot = await adminDb.collection('meteorites').get();
    if (snapshot.size > meteorites.length) {
      console.log(`[Encyclopedia Page] Firestore has ${snapshot.size} meteorites vs R2 ${meteorites.length}. Syncing full list...`);
      const fullList: Meteorite[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        fullList.push({
          id: String(doc.id),
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
          translations: data.translations || {},
          createdAt: data.createdAt || data.created_at || '',
        });
      });
      meteorites = fullList;

      // Auto update R2 cache background
      try {
        const { uploadToR2 } = await import('@/lib/r2Client');
        await uploadToR2('data/meteorites/catalog.json', JSON.stringify(fullList, null, 2), 'application/json');
      } catch {}
    }
  } catch (err) {
    console.warn("Failed to check Firestore meteorites size:", err);
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Ensiklopedia', url: '/ensiklopedia' },
  ]);

  const datasetSchema = generateDatasetSchema({
    name: 'Katalog Meteorit & Batu Luar Angkasa Meteorit Indonesia',
    description: 'Database spasial, massa fisik, dan jenis klasifikasi meteorit yang telah tercatat jatuh dan ditemukan di Bumi.',
    url: '/ensiklopedia',
    keywords: ['meteorit', 'batu meteor', 'klasifikasi meteorit', 'astronomi indonesia'],
  });

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Daftar Sampel Meteorit Antariksa',
    itemListElement: meteorites.slice(0, 15).map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${item.translated_name || item.name} (${item.recclass})`,
      url: `https://www.meteorit.my.id/ensiklopedia/${item.id}`,
    })),
  };

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, datasetSchema, itemListSchema]} />
      <EncyclopediaWithTabs initialMeteorites={meteorites} />
    </>
  );
}