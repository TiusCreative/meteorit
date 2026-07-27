"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { localizeArticle } from '@/lib/clientArticleLocalization';
import { useLocalizedArticles } from '@/lib/useLocalizedArticles';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  translations?: Record<string, { title?: string; excerpt?: string; content?: string }>;
}

interface FireballEonetSectionProps {
  fireballPosts?: Article[];
  eonetPosts?: Article[];
}

export default function FireballEonetSection({ fireballPosts: initialFireballPosts = [], eonetPosts: initialEonetPosts = [] }: FireballEonetSectionProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const fireballPosts = useLocalizedArticles(initialFireballPosts, language, 'articles');
  const eonetPosts = useLocalizedArticles(initialEonetPosts, language, 'articles');
  const [liveFireball, setLiveFireball] = useState<{ date: string; energy: string | null; lat: string | null; lon: string | null; lat_dir: string | null; lon_dir: string | null }[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch('/api/nasa/fireball', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setLiveFireball((data.data || []).slice(0, 5));
        }
      } catch {
        // silent fail
      } finally {
        setLoadingLive(false);
      }
    }
    fetchLive();
  }, []);

  return (
    <section className="py-16 bg-slate-950 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold text-orange-400">
            {t.earthMonitorBadge}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            {t.earthMonitorTitle}
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
            {t.earthMonitorDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Live Fireball Feed */}
          <div className="bg-slate-900/60 backdrop-blur border border-orange-900/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">{t.liveFireballFeed}</p>
            </div>

            {!mounted || loadingLive ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : liveFireball.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">{t.noFireballData}</p>
            ) : (
              <div className="space-y-2">
                {liveFireball.map((fb, i) => {
                  const energyNum = parseFloat(fb.energy || '0');
                  const isLarge = energyNum > 100;
                  return (
                    <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${isLarge ? 'border-red-900/40 bg-red-950/20' : 'border-orange-900/20 bg-orange-950/10'}`}>
                      <span className="text-lg shrink-0">{isLarge ? '💥' : '🔥'}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{fb.date?.substring(0, 10) || '—'}</p>
                        <p className="text-xs text-gray-400">
                          {fb.energy ? `${fb.energy} GJ` : 'N/A'} •{' '}
                          {fb.lat && fb.lat_dir ? `${fb.lat}°${fb.lat_dir}` : '?'},{' '}
                          {fb.lon && fb.lon_dir ? `${fb.lon}°${fb.lon_dir}` : '?'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/monitoring"
              className="mt-4 text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 justify-center"
            >
              {t.viewAllMonitoring}
            </Link>
          </div>

          {/* COLUMN 2: Fireball Articles */}
          <div className="bg-slate-900/40 backdrop-blur border border-orange-950/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-orange-950/30 pb-2">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">{t.fireballTab || 'Bola Api'}</p>
                {fireballPosts.length > 0 && (
                  <span className="bg-orange-950 text-orange-400 border border-orange-800/20 text-[10px] px-2 py-0.5 rounded-full font-bold">{fireballPosts.length} posts</span>
                )}
              </div>

              {fireballPosts.length === 0 ? (
                <div className="flex items-center justify-center h-48 bg-slate-950/30 border border-dashed border-slate-800/40 rounded-xl">
                  <p className="text-gray-500 text-xs">{t.noFireballArticles || 'Belum ada artikel.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fireballPosts.slice(0, 3).map((post) => {
                    const localizedPost = localizeArticle(post as any, language);
                    return (
                      <Link
                        key={localizedPost.id}
                        href={`/fireball/${localizedPost.id}`}
                        className="group flex gap-3 p-2 rounded-xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 hover:border-orange-500/20 transition-all"
                      >
                        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-900 relative">
                          <img
                            src={localizedPost.image || 'https://placehold.co/100x100'}
                            alt={localizedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <p className="text-[10px] text-gray-500">{localizedPost.date}</p>
                          <h3 className="text-xs font-bold text-slate-200 group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug mt-0.5">
                            {localizedPost.title}
                          </h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/fireball"
              className="mt-4 w-full text-center py-2 bg-orange-950/40 hover:bg-orange-900/60 text-orange-400 border border-orange-850/30 rounded-xl text-xs font-bold transition-all"
            >
              {t.viewAllFireball || 'Semua Bola Api'} &rarr;
            </Link>
          </div>

          {/* COLUMN 3: EONET Articles */}
          <div className="bg-slate-900/40 backdrop-blur border border-emerald-950/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-emerald-950/30 pb-2">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t.eonetTab || 'Peristiwa Alam'}</p>
                {eonetPosts.length > 0 && (
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/20 text-[10px] px-2 py-0.5 rounded-full font-bold">{eonetPosts.length} posts</span>
                )}
              </div>

              {eonetPosts.length === 0 ? (
                <div className="flex items-center justify-center h-48 bg-slate-950/30 border border-dashed border-slate-800/40 rounded-xl">
                  <p className="text-gray-500 text-xs">{t.noEonetArticles || 'Belum ada artikel.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eonetPosts.slice(0, 3).map((post) => {
                    const localizedPost = localizeArticle(post as any, language);
                    return (
                      <Link
                        key={localizedPost.id}
                        href={`/eonet/${localizedPost.id}`}
                        className="group flex gap-3 p-2 rounded-xl bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 hover:border-emerald-500/20 transition-all"
                      >
                        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-900 relative">
                          <img
                            src={localizedPost.image || 'https://placehold.co/100x100'}
                            alt={localizedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <p className="text-[10px] text-gray-500">{localizedPost.date}</p>
                          <h3 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug mt-0.5">
                            {localizedPost.title}
                          </h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/eonet"
              className="mt-4 w-full text-center py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-850/30 rounded-xl text-xs font-bold transition-all"
            >
              {t.viewAllEonet || 'Semua Peristiwa'} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
