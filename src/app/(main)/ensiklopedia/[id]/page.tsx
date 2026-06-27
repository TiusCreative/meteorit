import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import MeteoriteActions from '@/components/MeteoriteActions';
import SafeImage from '@/components/SafeImage';
import { adminDb } from '@/lib/firebaseAdmin';

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

export default async function MeteoriteDetailPage({ params }: { params: { id: string } }) {
  const meteorite = await getMeteorite(params.id);

  if (!meteorite) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold">Data meteorit tidak ditemukan.</p>
          <Link href="/ensiklopedia" className="text-cyan-400 hover:underline mt-4 inline-block">Kembali ke Katalog</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        
        <Link 
          href="/ensiklopedia" 
          className="text-cyan-400 hover:text-cyan-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden"
        >
          ← Kembali ke Katalog Ensiklopedia
        </Link>

        <div className="bg-slate-900/40 border border-cyan-950/30 rounded-3xl p-6 md:p-10 shadow-2xl print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          
          <div className="flex justify-between items-center mb-6 print:hidden">
            <span className="bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase">
              {meteorite.recclass}
            </span>
            <span className="text-gray-500 text-sm">ID NASA: {meteorite.id}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 text-amber-400 print:text-black text-left">
            Meteorit {meteorite.name}
          </h1>

          {/* Dynamic Client Actions */}
          <MeteoriteActions meteorite={meteorite} />

          {/* Printable container */}
          <div id="printable-meteorite-content" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="h-64 md:h-[350px] w-full rounded-2xl overflow-hidden print:h-auto">
              <SafeImage 
                src={meteorite.image_url} 
                alt={meteorite.name} 
                className="w-full h-full object-cover"
                fallback="https://placehold.co/600x400/020617/22d3ee?text=Meteorit"
              />
              </div>

              {/* Meteorological Parameters */}
              <div className="bg-slate-950/50 rounded-2xl p-6 border border-cyan-950/50 flex flex-col justify-center text-left print:border print:border-gray-300 print:bg-gray-50 print:p-6">
                <h3 className="text-lg font-bold mb-4 text-cyan-400 border-b border-cyan-900/30 pb-2 print:text-black print:border-gray-300">Spesifikasi Fisik</h3>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-500 print:text-black font-medium">Nama Batuan:</span>
                    <span className="font-bold text-gray-200 print:text-black">{meteorite.name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 print:text-black font-medium">Tipe / Kelas:</span>
                    <span className="font-semibold text-amber-400 print:text-black">{meteorite.recclass}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 print:text-black font-medium">Estimasi Massa:</span>
                    <span className="font-semibold text-cyan-400 print:text-black">{meteorite.mass}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 print:text-black font-medium">Tahun Ditemukan:</span>
                    <span className="font-semibold text-gray-200 print:text-black">{meteorite.year}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 print:text-black font-medium">Koordinat Lintang:</span>
                    <span className="font-mono text-gray-300 print:text-black">{meteorite.lat}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 print:text-black font-medium">Koordinat Bujur:</span>
                    <span className="font-mono text-gray-300 print:text-black">{meteorite.long}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Description Content */}
            <div className="text-left mb-8">
              <h3 className="text-2xl font-bold mb-4 text-cyan-400 border-b border-cyan-900/30 pb-2 print:text-black print:border-gray-300">Deskripsi & Analisis Sejarah</h3>
              <div className="text-gray-300 leading-relaxed print:text-black space-y-4">
                {meteorite.translated_description.split('\n\n').map((paragraph, index) => {
                  if (paragraph.startsWith('###')) {
                    return <h3 key={index} className="text-xl font-bold mt-4 mb-2 text-amber-400 print:text-black">{paragraph.replace('###', '').trim()}</h3>;
                  }
                  if (paragraph.startsWith('##')) {
                    return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-cyan-400 print:text-black">{paragraph.replace('##', '').trim()}</h2>;
                  }
                  return <p key={index} className="leading-relaxed print:text-black">{paragraph}</p>;
                })}
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="text-left mt-8">
            <h3 className="text-2xl font-bold mb-4 text-cyan-400 border-b border-cyan-900/30 pb-2 print:text-black">Lokasi Geografis Pendaratan</h3>
            <div className="w-full h-64 bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center border border-cyan-900/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950 opacity-80" />
              <div className="relative z-10 text-center p-4">
                <span className="text-4xl block mb-2 animate-bounce">📍</span>
                <p className="text-sm font-bold text-gray-200">Koordinat Jatuh: {meteorite.lat}, {meteorite.long}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${meteorite.lat},${meteorite.long}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 inline-block bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 font-bold py-1.5 px-4 rounded-xl text-xs transition-all"
                >
                  Buka di Google Maps →
                </a>
              </div>
            </div>
          </div>

          <div className="print:hidden">
            <AdDisplay position="content" />
          </div>

        </div>
      </div>
    </main>
  );
}
