"use client";

import { useState } from 'react';
import Link from 'next/link';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import SafeImage from '@/components/SafeImage';

interface ApodEntry {
  id: string;
  title: {
    en: string;
    id: string;
    ms?: string;
    zh?: string;
    ja?: string;
  };
  explanation: {
    en: string;
    id: string;
    ms?: string;
    zh?: string;
    ja?: string;
  };
  image_url: string;
  copyright: string;
}

interface ApodListClientProps {
  initialApods: ApodEntry[];
}

function formatLocalizedDate(dateStr: string, locale: string) {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
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
  const language = useSiteLanguage();
  const t = landingText[language];
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
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <span className="text-xs text-cyan-600 dark:text-cyan-400 font-extrabold uppercase tracking-widest block mb-3">
            {t.apodGalleryBadge}
          </span>
          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-cyan-500 via-amber-500 to-orange-500 bg-clip-text text-transparent mb-4">
            {t.apodGalleryTitle}
          </h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {t.apodGalleryDesc}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder={t.searchApod}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-cyan-900/40 text-slate-800 dark:text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none rounded-2xl px-5 py-3.5 w-full text-sm transition-all"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              🔍
            </span>
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {t.apodShowingOf.replace('{filtered}', String(filteredApods.length)).replace('{total}', String(initialApods.length))}
            </p>
          )}
        </div>

        {/* APOD Grid */}
        {filteredApods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredApods.map((apod) => {
              const isVideo = isVideoUrl(apod.image_url);
              // Handle translated title
              const title = (language !== 'id' && (apod.title as any)[language]) || apod.title?.id || apod.title?.en || 'Foto Antariksa';
              const explanation = (language !== 'id' && (apod.explanation as any)[language]) || apod.explanation?.id || apod.explanation?.en || '';
              const shortExcerpt = explanation.split('. ').slice(0, 2).join('. ') + '.';

              return (
                <article
                  key={apod.id}
                  className="group bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-cyan-950/30 hover:border-cyan-500/30 rounded-3xl overflow-hidden flex flex-col shadow-xl hover:shadow-cyan-950/10 hover:scale-[1.02] transition-all duration-300"
                >
                  {/* Thumbnail Wrapper */}
                  <div className="h-52 w-full relative overflow-hidden bg-slate-950 shrink-0">
                    <SafeImage
                      src={getThumbnailUrl(apod.image_url)}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallback="https://placehold.co/600x400/020617/22d3ee?text=APOD+Space"
                    />

                    {/* Media Type Badges */}
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-950/80 text-cyan-400 border border-cyan-500/20 backdrop-blur-sm">
                        {formatLocalizedDate(apod.id, language)}
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
                      <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 mb-3">
                        {title}
                      </h3>
                      <p className="text-slate-650 dark:text-gray-400 text-xs md:text-sm leading-relaxed line-clamp-3 mb-4">
                        {shortExcerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-cyan-950/20">
                      <span className="text-[10px] text-slate-500 dark:text-gray-500 truncate max-w-[150px]">
                        © {apod.copyright || 'NASA Domain'}
                      </span>
                      <Link
                        href={`/apod/${apod.id}`}
                        className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-755 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
                      >
                        {t.readDetail} →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-cyan-950/30 rounded-3xl">
            <span className="text-5xl block mb-4">🌌</span>
            <p className="text-slate-700 dark:text-gray-400 font-medium">{t.apodNoResults}</p>
          </div>
        )}
      </div>
    </main>
  );
}
