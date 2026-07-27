"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

interface SearchResult {
  articles: Array<{ id: string; title: string; excerpt: string; category: string; date: string; image: string; href: string }>;
  meteorites: Array<{ id: string; name: string; recclass: string; mass: string; year: string; excerpt: string; image: string; href: string }>;
  glossary: Array<{ id: string; term: string; excerpt: string; href: string }>;
  astronauts: Array<{ id: string; name: string; role: string; agency: string; craft: string; excerpt: string; image: string; href: string }>;
  pages: Array<{ id: string; title: string; desc: string; href: string }>;
}

const searchTranslations: Record<string, {
  placeholder: string;
  searching: string;
  noResults: string;
  noResultsDesc: string;
  articles: string;
  meteorites: string;
  glossary: string;
  astronauts: string;
  pages: string;
  close: string;
  title: string;
}> = {
  id: {
    title: 'Pencarian Pintar',
    placeholder: 'Cari artikel, meteorit, glosarium, atau astronot...',
    searching: 'Mencari...',
    noResults: 'Tidak ada hasil ditemukan',
    noResultsDesc: 'Coba kata kunci lain atau periksa ejaan Anda.',
    articles: 'Artikel & Berita',
    meteorites: 'Ensiklopedia Meteorit',
    glossary: 'Glosarium Sains',
    astronauts: 'Astronot Aktif & Misi',
    pages: 'Halaman & Menu',
    close: 'Tutup',
  },
  en: {
    title: 'Smart Search',
    placeholder: 'Search articles, meteorites, glossary, or astronauts...',
    searching: 'Searching...',
    noResults: 'No results found',
    noResultsDesc: 'Try another keyword or check your spelling.',
    articles: 'Articles & News',
    meteorites: 'Meteorite Encyclopedia',
    glossary: 'Science Glossary',
    astronauts: 'Active Astronauts & Missions',
    pages: 'Pages & Menus',
    close: 'Close',
  },
  ms: {
    title: 'Pencarian Pintar',
    placeholder: 'Cari artikel, meteorit, glosari, atau astronot...',
    searching: 'Mencari...',
    noResults: 'Tiada hasil ditemui',
    noResultsDesc: 'Cuba kata kunci lain atau semak ejaan anda.',
    articles: 'Artikel & Berita',
    meteorites: 'Ensiklopedia Meteorit',
    glossary: 'Glosari Sains',
    astronauts: 'Astronot Aktif & Misi',
    pages: 'Halaman & Menu',
    close: 'Tutup',
  },
  zh: {
    title: '智能搜索',
    placeholder: '搜索文章、陨石、词汇表或宇航员...',
    searching: '搜索中...',
    noResults: '未找到结果',
    noResultsDesc: '尝试其他关键词或检查拼写。',
    articles: '文章与新闻',
    meteorites: '陨石百科全书',
    glossary: '科学词汇表',
    astronauts: '现役宇航员与任务',
    pages: '页面与菜单',
    close: '关闭',
  },
  ja: {
    title: 'スマート検索',
    placeholder: '記事、隕石、用語集、宇宙飛行士を検索...',
    searching: '検索中...',
    noResults: '結果が見つかりません',
    noResultsDesc: '別のキーワードを試すか、スペルを確認してください。',
    articles: '記事とニュース',
    meteorites: '隕石百科事典',
    glossary: '科学用語集',
    astronauts: '現役宇宙飛行士とミッション',
    pages: 'ページとメニュー',
    close: '閉じる',
  },
  ru: {
    title: 'Умный поиск',
    placeholder: 'Искать статьи, метеориты, глоссарий или космонавтов...',
    searching: 'Поиск...',
    noResults: 'Результаты не найдены',
    noResultsDesc: 'Попробуйте другое ключевое слово или проверьте орфографию.',
    articles: 'Статьи и новости',
    meteorites: 'Энциклопедия метеоритов',
    glossary: 'Научный глоссарий',
    astronauts: 'Активные космонавты и миссии',
    pages: 'Страницы и меню',
    close: 'Закрыть',
  },
  fr: {
    title: 'Recherche Intelligente',
    placeholder: 'Rechercher des articles, des météorites, un glossaire...',
    searching: 'Recherche en cours...',
    noResults: 'Aucun résultat trouvé',
    noResultsDesc: 'Essayez un autre mot-clé ou vérifiez votre orthographe.',
    articles: 'Articles & Nouvelles',
    meteorites: 'Encyclopédie des météorites',
    glossary: 'Glossaire scientifique',
    astronauts: 'Astronautes actifs & missions',
    pages: 'Pages & menus',
    close: 'Fermer',
  }
};

export default function SmartSearch() {
  const language = useSiteLanguage();
  const t = searchTranslations[language] || searchTranslations['id'];
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    articles: [],
    meteorites: [],
    glossary: [],
    astronauts: [],
    pages: []
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut to close/open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Esc' || e.key === 'Escape') {
        setIsOpen(false);
      }
      // Optional: Cmd+K / Ctrl+K shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults({
        articles: [],
        meteorites: [],
        glossary: [],
        astronauts: [],
        pages: []
      });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Debounced API Search call
  useEffect(() => {
    if (!query.trim()) {
      setResults({
        articles: [],
        meteorites: [],
        glossary: [],
        astronauts: [],
        pages: []
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&lang=${language}`);
        const data = await res.json();
        if (data.success && data.results) {
          setResults(data.results);
        }
      } catch (err) {
        console.error('[SmartSearch] Gagal memanggil API pencarian:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, language]);

  const hasNoResults =
    results.articles.length === 0 &&
    results.meteorites.length === 0 &&
    results.glossary.length === 0 &&
    results.astronauts.length === 0 &&
    results.pages.length === 0;

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 rounded-lg border border-slate-200 dark:border-cyan-500/30 flex items-center justify-center text-slate-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all focus:outline-none shrink-0"
        title={t.title}
        aria-label={t.title}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Spotlight Search Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div
            ref={modalRef}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-cyan-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-[fadeIn_0.2s_ease-out] z-[210] transition-colors"
          >
            {/* Input Search Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-cyan-950/40">
              <svg
                className="w-5 h-5 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.placeholder}
                className="w-full bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 shrink-0 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-black text-gray-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-cyan-900/30 px-1.5 py-0.5 rounded select-none shrink-0">
                ESC
              </kbd>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 max-h-[50vh] scrollbar-thin dark:scrollbar-thumb-cyan-950 scrollbar-track-transparent">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <svg
                    className="animate-spin h-8 w-8 text-cyan-500 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sm font-semibold">{t.searching}</span>
                </div>
              )}

              {!loading && query && hasNoResults && (
                <div className="text-center py-16">
                  <span className="text-4xl block mb-3">🔍</span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-gray-200">{t.noResults}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
                    {t.noResultsDesc}
                  </p>
                </div>
              )}

              {!loading && !query && (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                  <span className="text-3xl block mb-3">☄️</span>
                  <p className="text-sm font-semibold max-w-xs mx-auto">
                    {t.placeholder}
                  </p>
                </div>
              )}

              {/* Grouped results sections */}
              {!loading && query && (
                <div className="space-y-4 text-left">
                  {/* 1. Pages/Menu */}
                  {results.pages.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-2 border-b border-slate-100 dark:border-cyan-950/20 pb-1">
                        {t.pages}
                      </h4>
                      <div className="space-y-1">
                        {results.pages.map((p) => (
                          <Link
                            key={p.id}
                            href={p.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 text-sm border border-slate-200 dark:border-cyan-900/20">
                              🔗
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                {p.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                                {p.desc}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Articles */}
                  {results.articles.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400 mb-2 border-b border-slate-100 dark:border-cyan-950/20 pb-1">
                        {t.articles}
                      </h4>
                      <div className="space-y-1">
                        {results.articles.map((art) => (
                          <Link
                            key={art.id}
                            href={art.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                          >
                            {art.image ? (
                              <img
                                src={art.image}
                                alt={art.title}
                                className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-cyan-900/20"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://placehold.co/100x100/020617/22d3ee?text=Blog';
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 text-lg border border-slate-200 dark:border-cyan-900/20">
                                📝
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                                {art.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-500/10 dark:bg-cyan-400/5 px-1.5 py-0.5 rounded uppercase">
                                  {art.category}
                                </span>
                                {art.date && <span className="text-[10px] text-gray-400 dark:text-gray-500">{art.date}</span>}
                              </div>
                              {art.excerpt && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                                  {art.excerpt}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Encyclopedia */}
                  {results.meteorites.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-2 border-b border-slate-100 dark:border-cyan-950/20 pb-1">
                        {t.meteorites}
                      </h4>
                      <div className="space-y-1">
                        {results.meteorites.map((met) => (
                          <Link
                            key={met.id}
                            href={met.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                          >
                            {met.image ? (
                              <img
                                src={met.image}
                                alt={met.name}
                                className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-cyan-900/20"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://placehold.co/100x100/020617/22d3ee?text=Meteor';
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 text-lg border border-slate-200 dark:border-cyan-900/20">
                                ☄️
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                                {met.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-400/5 px-1.5 py-0.5 rounded uppercase">
                                  {met.recclass}
                                </span>
                                {met.mass && <span className="text-[10px] text-gray-400 dark:text-gray-500">{met.mass}</span>}
                                {met.year && <span className="text-[10px] text-gray-400 dark:text-gray-500">• {met.year}</span>}
                              </div>
                              {met.excerpt && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                                  {met.excerpt}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Glossary */}
                  {results.glossary.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-2 border-b border-slate-100 dark:border-cyan-950/20 pb-1">
                        {t.glossary}
                      </h4>
                      <div className="space-y-1">
                        {results.glossary.map((g) => (
                          <Link
                            key={g.id}
                            href={g.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 text-sm border border-slate-200 dark:border-cyan-900/20">
                              📖
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                                {g.term}
                              </p>
                              {g.excerpt && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                                  {g.excerpt}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Astronauts */}
                  {results.astronauts.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-2 border-b border-slate-100 dark:border-cyan-950/20 pb-1">
                        {t.astronauts}
                      </h4>
                      <div className="space-y-1">
                        {results.astronauts.map((a) => (
                          <Link
                            key={a.id}
                            href={a.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                          >
                            {a.image ? (
                              <img
                                src={a.image}
                                alt={a.name}
                                className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-cyan-900/20"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://placehold.co/100x100/020617/22d3ee?text=Astro';
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 text-lg border border-slate-200 dark:border-cyan-900/20">
                                👨‍🚀
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                                {a.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 dark:bg-purple-400/5 px-1.5 py-0.5 rounded uppercase">
                                  {a.craft}
                                </span>
                                {a.role && <span className="text-[10px] text-gray-400 dark:text-gray-500">{a.role}</span>}
                                {a.agency && <span className="text-[10px] text-gray-400 dark:text-gray-500">• {a.agency}</span>}
                              </div>
                              {a.excerpt && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                                  {a.excerpt}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global CSS animations helper */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
