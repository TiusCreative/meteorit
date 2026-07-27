import ApodListClient from '@/components/ApodListClient';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Galeri Foto Antariksa Harian NASA - Meteorit Indonesia',
  description: 'Jelajahi keindahan semesta raya melalui koleksi kurasi harian NASA Astronomy Picture of the Day (APOD), lengkap dengan penjelasan sains berbahasa Indonesia.',
  keywords: ['galeri foto antariksa', 'nasa apod indonesia', 'astronomy picture of the day', 'gambar alam semesta', 'keindahan nebula', 'foto bintang', 'kosmos harian'],
};

interface ApodEntry {
  id: string;
  title: {
    en: string;
    id: string;
  };
  explanation: {
    en: string;
    id: string;
  };
  image_url: string;
  copyright: string;
}

const R2_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

export default async function ApodPage() {
  let apods: ApodEntry[] = [];

  // 1. Coba fetch dari R2
  try {
    const res = await fetch(`${R2_URL}/data/encyclopedia/history.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      apods = await res.json();
    }
  } catch (err) {
    console.warn("[APOD List] Gagal mengambil riwayat APOD dari R2, mencoba Firestore...", err);
  }

  // 2. Fallback ke Firestore
  if (apods.length === 0) {
    try {
      const snapshot = await adminDb.collection('apod_history')
        .orderBy('id', 'desc')
        .limit(100)
        .get();

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        apods.push({
          id: doc.id,
          title: data.title || {},
          explanation: data.explanation || {},
          image_url: data.image_url || '',
          copyright: data.copyright || 'NASA Public Domain'
        });
      });
    } catch (err) {
      console.error("Gagal mengambil riwayat APOD dari Firestore:", err);
    }
  }

  // Fallback default item jika database kosong (misal: saat inisialisasi awal)
  if (apods.length === 0) {
    apods.push({
      id: new Date().toISOString().split('T')[0],
      title: {
        en: "Meteor Shower over Indonesia",
        id: "Hujan Meteor di Langit Indonesia"
      },
      explanation: {
        en: "A beautiful display of shooting stars captured in the night skies of Indonesia, highlighting celestial beauty.",
        id: "Tampilan indah bintang jatuh yang ditangkap di langit malam Indonesia, menyoroti keindahan benda angkasa luar biasa."
      },
      image_url: "https://placehold.co/800x500/020617/f59e0b?text=Hujan+Meteor",
      copyright: "Kolektor Astronomi"
    });
  }

  return <ApodListClient initialApods={apods} />;
}
