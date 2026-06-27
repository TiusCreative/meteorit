import EncyclopediaWithTabs from '@/components/EncyclopediaWithTabs';
import { adminDb } from '@/lib/firebaseAdmin';

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

  // 2. Fallback ke Firestore
  if (meteorites.length === 0) {
    try {
      const snapshot = await adminDb.collection('meteorites').get();
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        meteorites.push({
          id: doc.id,
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
        });
      });
    } catch (err) {
      console.error("Failed to load meteorites from Firestore fallback:", err);
    }
  }

  return <EncyclopediaWithTabs initialMeteorites={meteorites} />;
}