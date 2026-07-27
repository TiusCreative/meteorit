"use client";

import Link from 'next/link';
import SafeImage from './SafeImage';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { localizeArticle } from '@/lib/clientArticleLocalization';
import { useLocalizedArticles } from '@/lib/useLocalizedArticles';

interface MarsPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  mars_data?: {
    rover?: string;
    camera?: string;
    sol?: number;
  };
  translations?: Record<string, { title?: string; excerpt?: string; content?: string }>;
}

export default function MarsLandingSection({ posts: initialPosts }: { posts: MarsPost[] }) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const posts = useLocalizedArticles(initialPosts, language, 'articles');

  if (posts.length === 0) return null;

  return (
    <section className="py-16 bg-slate-950 border-t border-red-900/10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-orange-300 uppercase tracking-widest mb-3 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
              {t.redPlanet}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">{t.marsLatest}</h2>
            <p className="text-gray-400 mt-2 text-sm max-w-2xl">
              {t.marsDescription}
            </p>
          </div>
          <Link href="/mars" className="text-orange-300 hover:text-orange-200 font-bold text-sm">
            {t.viewAllMars} &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => {
            const localizedPost = localizeArticle(post as any, language);
            return (
              <article key={localizedPost.id} className="bg-slate-900/50 border border-red-950/40 rounded-2xl overflow-hidden shadow-xl hover:border-orange-500/40 transition-all flex flex-col">
                <div className="h-44 bg-slate-900 overflow-hidden">
                  <SafeImage
                    src={localizedPost.image}
                    alt={localizedPost.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    fallback="https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1 text-left">
                  <div className="text-xs text-orange-300 font-bold mb-2">
                    {localizedPost.mars_data?.rover || 'NASA Mars Rover'} &bull; {localizedPost.date}
                  </div>
                  <h3 className="text-lg font-bold text-orange-100 line-clamp-2 mb-3">{localizedPost.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed flex-1">{localizedPost.excerpt}</p>
                  <Link
                    href={`/mars/${localizedPost.id}`}
                    className="mt-5 block text-center bg-red-900/40 hover:bg-red-800/60 border border-red-700/30 text-orange-200 py-2.5 rounded-xl text-sm font-bold transition-all"
                  >
                    {t.readMars}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
