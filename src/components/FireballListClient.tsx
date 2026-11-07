"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { localizeArticle } from '@/lib/clientArticleLocalization';
import type { ArticleTranslations } from '@/lib/articleLocalization';

import SafeImage from '@/components/SafeImage';
import MobileFlipboardReader, { MobileReaderItem } from '@/components/MobileFlipboardReader';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  translations?: ArticleTranslations;
}

interface FireballListClientProps {
  initialPosts: BlogPost[];
}

import DateFilterBar, { DateFilterValue } from '@/components/DateFilterBar';
import { matchesDateFilter } from '@/lib/dateFilterHelper';

export default function FireballListClient({ initialPosts }: FireballListClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [posts] = useState<BlogPost[]>(initialPosts);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    startDate: '',
    endDate: '',
    selectedMonth: '',
    selectedYear: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [readerMode, setReaderMode] = useState<'grid' | 'flipboard'>('grid');
  const itemsPerPage = 30;

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
    if (searchQuery) {
      result = result.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (dateFilter.startDate || dateFilter.endDate || dateFilter.selectedMonth || dateFilter.selectedYear) {
      result = result.filter(p => matchesDateFilter(p, dateFilter));
    }
    setFilteredPosts(result);
    setCurrentPage(1);
  }, [searchQuery, dateFilter, posts]);

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const currentItems = filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const flipboardItems: MobileReaderItem[] = filteredPosts.map((post) => {
    const localized = localizeArticle(post, language);
    return {
      id: post.id,
      title: localized.title,
      excerpt: localized.excerpt,
      image: post.image,
      category: 'Bola Api & Fireball',
      date: post.date,
      link: `/fireball/${post.id}`,
    };
  });

  return (
    <div className="pt-6 pb-16">
      {/* Mobile Fullscreen Flipboard Reader Mode */}
      {readerMode === 'flipboard' && (
        <MobileFlipboardReader
          items={flipboardItems}
          title={t.fireballListTitle}
          onSwitchToGrid={() => toggleReaderMode('grid')}
        />
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8 pt-8">
          <span className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold text-orange-400">
            {t.fireballListBadge}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-amber-400 bg-clip-text text-transparent">
            {t.fireballListTitle}
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            {t.fireballListDesc}
          </p>

          {/* DUAL MODE READER SWITCHER TOGGLE */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <div className="bg-slate-900/90 border border-orange-900/40 p-1 rounded-2xl flex items-center shadow-lg">
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

        {/* Search */}
        <div className="bg-slate-900/60 backdrop-blur border border-orange-900/30 p-4 md:p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
          <input
            type="text"
            placeholder={t.searchFireball}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 px-4 py-2.5 bg-slate-950 border border-orange-900/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors text-sm text-left"
          />
          <div className="text-xs text-gray-500 font-semibold bg-slate-950 px-4 py-2 rounded-xl border border-orange-900/20">
            {t.total}: {filteredPosts.length} {t.article}
          </div>
        </div>

        <AdDisplay position="hero" />

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-dashed border-orange-950/50 rounded-2xl">
            <span className="text-5xl block mb-4">🔥</span>
            <p className="text-gray-300 font-bold text-lg mb-2">{t.noFireballArticlesList}</p>
            <p className="text-gray-500 text-sm">
              {posts.length === 0 ? t.noFireballCron : t.noFireballMatch}
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentItems.map((post) => {
                const localized = localizeArticle(post, language);
                return (
                  <article
                    key={post.id}
                    className="bg-slate-900/40 border border-orange-950/30 rounded-2xl overflow-hidden shadow-xl hover:shadow-orange-900/10 hover:border-orange-500/30 transition-all duration-300 group flex flex-col"
                  >
                    <div className="h-44 bg-slate-950 overflow-hidden relative shrink-0">
                      {post.image ? (
                        <SafeImage
                          src={post.image}
                          alt={localized.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          fallback="https://placehold.co/600x400/020617/f97316?text=Fireball"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-orange-950">
                          <span className="text-4xl">🔥</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-orange-700 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                        {post.category}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow text-left">
                      <span className="text-gray-500 text-xs font-semibold block mb-2">📅 {post.date}</span>
                      <h2 className="text-lg font-bold mb-2 text-orange-400 group-hover:text-orange-300 transition-colors line-clamp-2 leading-snug">
                        {localized.title}
                      </h2>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
                        {localized.excerpt}
                      </p>
                      <Link
                        href={`/fireball/${post.id}`}
                        className="mt-auto bg-orange-900/30 hover:bg-orange-900/50 text-orange-300 border border-orange-500/20 py-2 px-4 rounded-xl text-center font-bold text-sm block transition-all"
                      >
                        {t.readMore2}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${currentPage === 1 ? 'border-slate-800 text-gray-600 cursor-not-allowed' : 'border-orange-900/40 text-orange-400 bg-slate-900/40 hover:bg-slate-800'}`}
                >
                  ← {t.previous}
                </button>
                <span className="text-sm text-gray-400">{t.page} {currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${currentPage === totalPages ? 'border-slate-800 text-gray-600 cursor-not-allowed' : 'border-orange-900/40 text-orange-400 bg-slate-900/40 hover:bg-slate-800'}`}
                >
                  {t.next} →
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-10">
          <AdDisplay position="footer" />
        </div>
      </div>
    </div>
  );
}
