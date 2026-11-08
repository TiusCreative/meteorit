"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import SafeImage from '@/components/SafeImage';
import MobileFlipboardReader, { MobileReaderItem } from '@/components/MobileFlipboardReader';

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

const isDirectVideoUrl = (url: string) => {
  if (!url) return false;
  return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogv');
};

const isVideoUrl = (url: string, mediaType?: string) => {
  if (mediaType === 'video') return true;
  if (!url) return false;
  return isDirectVideoUrl(url) || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('player.vimeo.com');
};

const R2_SPACE_FALLBACK = 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev/data/glossary/images/nasa-apod.webp';

const getThumbnailUrl = (url: string) => {
  if (!url) return R2_SPACE_FALLBACK;
  if (isVideoUrl(url)) {
    const ytId = getYoutubeId(url);
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    }
    if (isDirectVideoUrl(url)) {
      return url;
    }
    return R2_SPACE_FALLBACK;
  }
  return url;
};

import DateFilterBar, { DateFilterValue } from '@/components/DateFilterBar';
import { matchesDateFilter } from '@/lib/dateFilterHelper';

export default function ApodListClient({ initialApods }: ApodListClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    startDate: '',
    endDate: '',
    selectedMonth: '',
    selectedYear: '',
  });
  const [readerMode, setReaderMode] = useState<'grid' | 'flipboard'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem('meteorit_reader_mode_apod');
    if (saved === 'flipboard') setReaderMode('flipboard');
  }, []);

  const toggleReaderMode = (mode: 'grid' | 'flipboard') => {
    setReaderMode(mode);
    localStorage.setItem('meteorit_reader_mode_apod', mode);
  };

  const filteredApods = initialApods.filter((apod) => {
    const query = searchQuery.toLowerCase();
    const titleId = (apod.title?.id || '').toLowerCase();
    const titleEn = (apod.title?.en || '').toLowerCase();
    const explanationId = (apod.explanation?.id || '').toLowerCase();
    const explanationEn = (apod.explanation?.en || '').toLowerCase();
    const dateStr = apod.id.toLowerCase();

    const matchesSearch = !query || (
      titleId.includes(query) ||
      titleEn.includes(query) ||
      explanationId.includes(query) ||
      explanationEn.includes(query) ||
      dateStr.includes(query)
    );

    const isDateFiltered = Boolean(dateFilter.startDate || dateFilter.endDate || dateFilter.selectedMonth || dateFilter.selectedYear);
    const matchesDate = !isDateFiltered || matchesDateFilter(apod, dateFilter);

    return matchesSearch && matchesDate;
  });

  const flipboardItems: MobileReaderItem[] = filteredApods.map((apod) => {
    const isVideo = isVideoUrl(apod.image_url);
    const title = (language !== 'id' && (apod.title as any)[language]) || apod.title?.id || apod.title?.en || 'Foto Antariksa';
    const explanation = (language !== 'id' && (apod.explanation as any)[language]) || apod.explanation?.id || apod.explanation?.en || '';
    return {
      id: apod.id,
      title: title,
      excerpt: explanation,
      image: getThumbnailUrl(apod.image_url),
      category: isVideo ? '📼 Video APOD' : '🌌 Foto NASA',
      date: formatLocalizedDate(apod.id, language),
      link: `/apod/${apod.id}`,
    };
  });

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300">
      {/* Mobile Fullscreen Flipboard Reader Mode */}
      {readerMode === 'flipboard' && (
        <MobileFlipboardReader
          items={flipboardItems}
          title={t.apodGalleryTitle || "Galeri Foto Antariksa"}
          onSwitchToGrid={() => toggleReaderMode('grid')}
        />
      )}

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

          {/* DUAL MODE READER SWITCHER TOGGLE (Mobile Only) */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <div className="bg-slate-900/90 border border-cyan-900/40 p-1 rounded-2xl flex items-center shadow-lg">
              <button
                onClick={() => toggleReaderMode('grid')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  readerMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>📰</span>
                <span>Mode Grid</span>
              </button>
              <button
                onClick={() => toggleReaderMode('flipboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  readerMode === 'flipboard'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>📱</span>
                <span>Mode Swipe Feed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <DateFilterBar value={dateFilter} onChange={setDateFilter} />

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
              const isDirectVideo = isDirectVideoUrl(apod.image_url);
              const isVideo = isVideoUrl(apod.image_url, (apod as any).media_type);
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
                    {isDirectVideo ? (
                      <video
                        src={apod.image_url}
                        muted
                        playsInline
                        autoPlay
                        loop
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <SafeImage
                        src={getThumbnailUrl(apod.image_url)}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallback="https://placehold.co/600x400/020617/22d3ee?text=APOD+Space"
                      />
                    )}

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
