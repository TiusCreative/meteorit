"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

type EncyclopediaEntry = {
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
  media_type?: string;
};

interface EpicImage {
  identifier: string;
  caption: string;
  centroid_coordinates: { lat: number; lon: number };
  date: string;
  imageUrl?: string;
}

interface EncyclopediaHighlightProps {
  initialData: EncyclopediaEntry;
}

export default function EncyclopediaHighlight({ initialData }: EncyclopediaHighlightProps) {
  const data = initialData;
  const [epicData, setEpicData] = useState<EpicImage | null>(null);
  const [epicLoading, setEpicLoading] = useState(true);

  useEffect(() => {
    const fetchEpic = async () => {
      try {
        const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';
        const res = await fetch(`${r2PublicUrl}/data/space-dashboard-data.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const dashData = await res.json();
          if (dashData.epic) {
            setEpicData(dashData.epic);
            setEpicLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback: Fetch langsung dari NASA EPIC API
      try {
        const nasaKey = process.env.NEXT_PUBLIC_NASA_API_KEY || 'DEMO_KEY';
        const res = await fetch(`https://api.nasa.gov/EPIC/api/natural/images?api_key=${nasaKey}`);
        if (res.ok) {
          const images = await res.json();
          if (images && images.length > 0) {
            const latest = images[0];
            const dateStr = latest.date.split(' ')[0].replace(/-/g, '/');
            setEpicData({
              identifier: latest.identifier,
              caption: latest.caption,
              centroid_coordinates: latest.centroid_coordinates,
              date: latest.date,
              imageUrl: `https://epic.gsfc.nasa.gov/archive/natural/${dateStr}/png/${latest.image}.png`,
            });
          }
        }
      } catch {}
      setEpicLoading(false);
    };
    fetchEpic();
  }, []);

  if (!data) return null;

  const descStr = data.explanation?.id || data.explanation?.en || "";
  const shortDescription = descStr.split('. ').slice(0, 2).join('. ') + '.';

  const isVideo = data.image_url.includes('youtube.com') ||
                  data.image_url.includes('youtu.be') ||
                  data.image_url.includes('vimeo.com') ||
                  data.image_url.includes('player.vimeo.com');

  return (
    <section className="py-16 bg-slate-900/20 border-t border-cyan-900/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/20">
            Pembaruan Harian
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-cyan-400">Benda Langit Hari Ini</h2>
          <p className="text-gray-400 mt-2 text-sm">Data langsung dari NASA — diperbarui setiap hari</p>
        </div>

        {/* Grid 2 Kolom: APOD + EPIC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">

          {/* Kolom Kiri: APOD */}
          <div className="bg-slate-900/60 backdrop-blur border border-cyan-950/40 rounded-2xl overflow-hidden shadow-2xl hover:shadow-cyan-950/30 transition-all duration-300 hover:-translate-y-1 flex flex-col">
            <div className="relative">
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-amber-500/90 backdrop-blur text-black text-xs font-bold px-2.5 py-1 rounded-full">📡 NASA APOD</span>
              </div>
              <div className="h-56 overflow-hidden bg-slate-950 flex items-center justify-center">
                {isVideo ? (
                  <div className="w-full h-full aspect-video">
                    <iframe
                      src={data.image_url}
                      title={data.title?.id || 'NASA APOD Video'}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <img
                    src={data.image_url}
                    alt={data.title?.id || 'APOD'}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/800x500/020617/22d3ee?text=APOD+Space';
                    }}
                  />
                )}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Astronomy Picture of the Day</span>
              <h3 className="text-xl font-bold text-amber-400 mb-2 line-clamp-2">{data.title?.id || data.title?.en}</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed flex-1 line-clamp-3">{shortDescription}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                <p className="text-xs text-gray-500">© {data.copyright}</p>
                <Link
                  href={`/apod/${data.id}`}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 px-4 rounded-lg transition-colors text-sm"
                >
                  Lihat Detail →
                </Link>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: EPIC (Foto Bumi Terbaru) */}
          <div className="bg-slate-900/60 backdrop-blur border border-cyan-950/40 rounded-2xl overflow-hidden shadow-2xl hover:shadow-cyan-950/30 transition-all duration-300 hover:-translate-y-1 flex flex-col">
            <div className="relative">
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-cyan-600/90 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full">🌍 NASA EPIC</span>
              </div>
              <div className="h-56 overflow-hidden bg-slate-950 flex items-center justify-center">
                {epicLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
                    <span className="text-xs text-gray-500">Memuat foto Bumi terbaru...</span>
                  </div>
                ) : epicData?.imageUrl ? (
                  <img
                    src={epicData.imageUrl}
                    alt="Foto Bumi terbaru dari NASA EPIC"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/800x500/020617/22d3ee?text=Foto+Bumi+EPIC';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center p-8">
                    <span className="text-5xl">🌍</span>
                    <span className="text-sm text-gray-400">Foto Bumi EPIC tidak tersedia saat ini</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Earth Polychromatic Imaging Camera</span>
              <h3 className="text-xl font-bold text-cyan-400 mb-2">Monitor Satelit EPIC</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed flex-1">
                {epicData?.caption
                  ? epicData.caption.substring(0, 120) + '...'
                  : 'Foto Bumi terbaru yang diambil oleh kamera EPIC milik NASA dari jarak 1,5 juta km, memperlihatkan sisi Bumi yang terkena cahaya matahari.'}
              </p>

              {/* Metadata Koordinat */}
              {epicData?.centroid_coordinates && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/40">
                    <p className="text-xs text-gray-500 mb-1">Lintang (Lat)</p>
                    <p className="text-sm font-bold text-cyan-300">
                      {epicData.centroid_coordinates.lat.toFixed(2)}°
                    </p>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/40">
                    <p className="text-xs text-gray-500 mb-1">Bujur (Lon)</p>
                    <p className="text-sm font-bold text-cyan-300">
                      {epicData.centroid_coordinates.lon.toFixed(2)}°
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                <p className="text-xs text-gray-500">
                  {epicData?.date ? new Date(epicData.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Terbaru'}
                </p>
                <Link
                  href="/monitoring-epic"
                  className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-1.5 px-4 rounded-lg transition-colors text-sm"
                >
                  Pantau EPIC →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/ensiklopedia"
            className="bg-slate-900/40 hover:bg-slate-900/70 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 font-bold py-3 px-8 rounded-xl transition-all duration-300 inline-block text-sm"
          >
            Lihat Semua Katalog Meteorit →
          </Link>
        </div>
      </div>
    </section>
  );
}