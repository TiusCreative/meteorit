"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { localizeArticle } from '@/lib/clientArticleLocalization';
import type { ArticleTranslations } from '@/lib/articleLocalization';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  translations?: ArticleTranslations;
}

interface EonetListClientProps {
  initialPosts: BlogPost[];
}

const CATEGORY_ICONS: Record<string, string> = {
  'Wildfires': '🔥',
  'Volcanoes': '🌋',
  'Severe Storms': '🌪️',
  'Dust and Haze': '🌫️',
  'Sea and Lake Ice': '🧊',
  'Snow': '❄️',
  'Peristiwa Alam': '🌍',
};

export default function EonetListClient({ initialPosts }: EonetListClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [posts] = useState<BlogPost[]>(initialPosts);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    let result = posts;
    if (searchQuery) {
      result = result.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPosts(result);
    setCurrentPage(1);
  }, [searchQuery, posts]);

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const currentItems = filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryIcon = (cat: string) => {
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
      if (cat.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return '🌍';
  };

  return (
    <div className="pt-6 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 pt-8">
          <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold text-emerald-400">
            {t.eonetListBadge}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            {t.eonetListTitle}
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            {t.eonetListDesc}
          </p>
        </div>

        {/* Search */}
        <div className="bg-slate-900/60 backdrop-blur border border-emerald-900/30 p-4 md:p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
          <input
            type="text"
            placeholder={t.searchEonet}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 px-4 py-2.5 bg-slate-950 border border-emerald-900/40 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors text-sm text-left"
          />
          <div className="text-xs text-gray-500 font-semibold bg-slate-950 px-4 py-2 rounded-xl border border-emerald-900/20">
            {t.total}: {filteredPosts.length} {t.article}
          </div>
        </div>

        <AdDisplay position="hero" />

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border border-dashed border-emerald-950/50 rounded-2xl">
            <span className="text-5xl block mb-4">🌍</span>
            <p className="text-gray-300 font-bold text-lg mb-2">{t.noEonetArticlesList}</p>
            <p className="text-gray-500 text-sm">
              {posts.length === 0 ? t.noEonetCron : t.noEonetMatch}
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
                    className="bg-slate-900/40 border border-emerald-950/30 rounded-2xl overflow-hidden shadow-xl hover:shadow-emerald-900/10 hover:border-emerald-500/30 transition-all duration-300 group flex flex-col"
                  >
                    <div className="h-44 bg-slate-950 overflow-hidden relative shrink-0">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={localized.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/600x400/020617/34d399?text=Peristiwa+Alam';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-emerald-950">
                          <span className="text-4xl">{getCategoryIcon(post.category)}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-emerald-700 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                        {post.category}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow text-left">
                      <span className="text-gray-500 text-xs font-semibold block mb-2">📅 {post.date}</span>
                      <h2 className="text-lg font-bold mb-2 text-emerald-400 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                        {localized.title}
                      </h2>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
                        {localized.excerpt}
                      </p>
                      <Link
                        href={`/eonet/${post.id}`}
                        className="mt-auto bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/20 py-2 px-4 rounded-xl text-center font-bold text-sm block transition-all"
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
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${currentPage === 1 ? 'border-slate-800 text-gray-600 cursor-not-allowed' : 'border-emerald-900/40 text-emerald-400 bg-slate-900/40 hover:bg-slate-800'}`}
                >
                  ← {t.previous}
                </button>
                <span className="text-sm text-gray-400">{t.page} {currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${currentPage === totalPages ? 'border-slate-800 text-gray-600 cursor-not-allowed' : 'border-emerald-900/40 text-emerald-400 bg-slate-900/40 hover:bg-slate-800'}`}
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
