"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import AdDisplay from '@/components/AdDisplay';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { localizeArticle } from '@/lib/clientArticleLocalization';
import type { ArticleTranslations } from '@/lib/articleLocalization';

import MobileFlipboardReader, { MobileReaderItem } from '@/components/MobileFlipboardReader';

interface MarsPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  createdAt?: string;
  translations?: ArticleTranslations;
  mars_data?: {
    topic?: string;
    rover?: string;
    camera?: string;
    sol?: number;
  };
}

interface MarsListClientProps {
  initialPosts: MarsPost[];
}

import DateFilterBar, { DateFilterValue } from '@/components/DateFilterBar';
import { matchesDateFilter } from '@/lib/dateFilterHelper';

export default function MarsListClient({ initialPosts }: MarsListClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [posts] = useState<MarsPost[]>(initialPosts);
  const [filteredPosts, setFilteredPosts] = useState<MarsPost[]>(initialPosts);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    startDate: '',
    endDate: '',
    selectedMonth: '',
    selectedYear: '',
  });
  const [readerMode, setReaderMode] = useState<'grid' | 'flipboard'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem('meteorit_reader_mode');
    if (saved === 'flipboard') setReaderMode('flipboard');
  }, []);

  const toggleReaderMode = (mode: 'grid' | 'flipboard') => {
    setReaderMode(mode);
    localStorage.setItem('meteorit_reader_mode', mode);
  };

  useEffect(() => {
    let result = posts;
    if (dateFilter.startDate || dateFilter.endDate || dateFilter.selectedMonth || dateFilter.selectedYear) {
      result = result.filter(p => matchesDateFilter(p.date || p.createdAt || p.id, dateFilter));
    }
    setFilteredPosts(result);
  }, [dateFilter, posts]);

  const flipboardItems: MobileReaderItem[] = posts.map((post) => {
    const localized = localizeArticle(post, language);
    return {
      id: post.id,
      title: localized.title,
      excerpt: localized.excerpt,
      image: post.image,
      category: 'Planet Mars',
      date: post.date,
      link: `/mars/${post.id}`,
    };
  });

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300">
      {/* Mobile Fullscreen Flipboard Reader Mode */}
      {readerMode === 'flipboard' && (
        <MobileFlipboardReader
          items={flipboardItems}
          title={t.marsTitle || 'Artikel Planet Mars'}
          onSwitchToGrid={() => toggleReaderMode('grid')}
        />
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/40 text-xs font-semibold text-red-600 dark:text-orange-300 uppercase tracking-wider">
            {t.marsBadge || 'Planet Merah'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 via-red-600 to-amber-500 bg-clip-text text-transparent">
            {t.marsTitle || 'Artikel Planet Mars'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {t.marsDesc || 'Fakta unik, kabar rover NASA, cuaca ekstrem, geologi, dan masa depan manusia di Mars dalam bahasa yang ringan tapi tetap ilmiah.'}
          </p>

          {/* DUAL MODE READER SWITCHER TOGGLE */}
          <div className="flex justify-center items-center gap-2 pt-2">
            <div className="bg-slate-900/90 border border-red-900/40 p-1 rounded-2xl flex items-center shadow-lg">
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

        <AdDisplay position="hero" />

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/30 border border-dashed border-red-200 dark:border-red-950/60 rounded-2xl">
            <span className="text-5xl block mb-4">🔴</span>
            <p className="text-slate-800 dark:text-gray-300 font-bold text-lg mb-2">{t.noMarsArticles || 'Belum ada artikel Planet Mars'}</p>
            <p className="text-slate-500 dark:text-gray-500 text-sm">{posts.length === 0 ? (t.noMarsArticlesDesc || 'Gunakan admin console untuk memicu cron Planet Mars pertama.') : 'Tidak ada artikel yang cocok dengan filter tanggal.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const localized = localizeArticle(post, language);
              return (
                <article key={post.id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-red-950/40 rounded-2xl overflow-hidden shadow-xl hover:border-orange-500/40 transition-all flex flex-col">
                  <div className="h-48 bg-slate-900 overflow-hidden">
                    <SafeImage
                      src={post.image}
                      alt={localized.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      fallback="https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1 text-left">
                    <div className="text-xs text-orange-600 dark:text-orange-300 font-bold mb-2">
                      {post.mars_data?.rover || 'NASA Mars Rover'} • {post.date}
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-orange-100 line-clamp-2 mb-3">{localized.title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">{localized.excerpt}</p>
                    <Link
                      href={`/mars/${post.id}`}
                      className="mt-5 block text-center bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/60 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-orange-200 py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                      {t.readMore2}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <AdDisplay position="footer" />
        </div>
      </div>
    </main>
  );
}
