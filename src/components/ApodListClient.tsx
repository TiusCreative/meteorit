"use client";

import { useState } from 'react';
import Link from 'next/link';

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

interface ApodListClientProps {
  initialApods: ApodEntry[];
}

function formatDateIndo(dateStr: string) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
  } catch (e) {}
  return dateStr;
}

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const isVideoUrl = (url: string) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('player.vimeo.com');
};

const getThumbnailUrl = (url: string) => {
  if (!url) return 'https://placehold.co/600x400/020617/22d3ee?text=APOD+Space';
  if (isVideoUrl(url)) {
    const ytId = getYoutubeId(url);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    }
    return 'https://placehold.co/600x400/020617/eab308?text=Video+Astronomi';
  }
  return url;
};

export default function ApodListClient({ initialApods }: ApodListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApods = initialApods.filter((apod) => {
    const query = searchQuery.toLowerCase();
    const titleId = (apod.title?.id || '').toLowerCase();
    const titleEn = (apod.title?.en || '').toLowerCase();
    const explanationId = (apod.explanation?.id || '').toLowerCase();
    const explanationEn = (apod.explanation?.en || '').toLowerCase();
    const dateStr = apod.id.toLowerCase();

    return (
      titleId.includes(query) ||
      titleEn.includes(query) ||
      explanationId.includes(query) ||
      explanationEn.includes(query) ||
      dateStr.includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <span className="text-xs text-cyan-400 font-extrabold uppercase tracking-widest block mb-3">
            NASA Astronomy Picture of the Day (APOD)
          </span>
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 bg-clip-text text-transparent mb-4">
            Galeri Foto Antariksa
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Jelajahi keindahan semesta raya melalui kurasi gambar astronomi harian resmi dari NASA, lengkap dengan penjelasan ilmiah yang diterjemahkan menggunakan AI.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari foto antariksa, tanggal, atau topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/60 border border-cyan-900/40 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none rounded-2xl px-5 py-3.5 w-full text-sm transition-all"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              🔍
            </span>
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Menampilkan {filteredApods.length} dari {initialApods.length} arsip foto.
            </p>
          )}
        </div>

        {/* APOD Grid */}
        {filteredApods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredApods.map((apod) => {
              const isVideo = isVideoUrl(apod.image_url);
              const title = apod.title?.id || apod.title?.en || 'Foto Antariksa';
              const excerpt = apod.explanation?.id || apod.explanation?.en || '';
              const shortExcerpt = excerpt.split('. ').slice(0, 2).join('. ') + '.';

              return (
                <article
                  key={apod.id}
                  className="group bg-slate-900/40 border border-cyan-950/30 hover:border-cyan-500/30 rounded-3xl overflow-hidden flex flex-col shadow-xl hover:shadow-cyan-950/10 hover:scale-[1.02] transition-all duration-300"
                >
                  {/* Thumbnail Wrapper */}
                  <div className="h-52 w-full relative overflow-hidden bg-slate-950 shrink-0">
                    <img
                      src={getThumbnailUrl(apod.image_url)}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/600x400/020617/22d3ee?text=APOD+Space';
                      }}
                    />

                    {/* Media Type Badges */}
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-950/80 text-cyan-400 border border-cyan-500/20 backdrop-blur-sm">
                        {formatDateIndo(apod.id)}
                      </span>
                      {isVideo && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-500 text-slate-950 backdrop-blur-sm">
                          📼 Video
                        </span>
                      )}
                    </div>

                    {/* Video Overlay icon */}
                    {isVideo && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center text-slate-950 font-bold text-lg pl-1 shadow-lg">
                          ▶
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow text-left justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-100 group-hover:text-amber-400 transition-colors line-clamp-2 mb-3">
                        {title}
                      </h3>
                      <p className="text-gray-400 text-xs md:text-sm leading-relaxed line-clamp-3 mb-4">
                        {shortExcerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-cyan-950/20">
                      <span className="text-[10px] text-gray-500 truncate max-w-[150px]">
                        © {apod.copyright || 'NASA Domain'}
                      </span>
                      <Link
                        href={`/apod/${apod.id}`}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                      >
                        Lihat Detail →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/20 border border-cyan-950/30 rounded-3xl">
            <span className="text-5xl block mb-4">🌌</span>
            <p className="text-gray-400 font-medium">Tidak ada foto antariksa yang cocok dengan pencarian Anda.</p>
          </div>
        )}
      </div>
    </main>
  );
}
