"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import AdDisplay from '@/components/AdDisplay';
import ArticleActions from '@/components/ArticleActions';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { pickLocalizedArticle, type ArticleTranslations } from '@/lib/articleLocalization';
import { landingText } from '@/lib/landingText';
import { renderMarkdownContent } from '@/lib/markdownRenderer';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content: string;
  image: string;
  translations?: ArticleTranslations;
  fireball_data?: {
    event_date?: string;
    lat?: string | null;
    lon?: string | null;
    lat_dir?: string | null;
    lon_dir?: string | null;
    energy_gj?: number;
    energy_kt?: number;
    impact_e?: number;
    alt?: string | null;
    vel?: string | null;
    source?: string;
  };
}

interface FireballArticleClientProps {
  post: BlogPost;
  weatherData: any;
}

export default function FireballArticleClient({ post, weatherData }: FireballArticleClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [localizedPost, setLocalizedPost] = useState(post);

  useEffect(() => {
    const initLocalized = pickLocalizedArticle(post as any, language);
    setLocalizedPost(initLocalized as any);

    if (language === 'id') return;

    const targetTrans = post.translations?.[language];
    const isFallback = targetTrans?.content && (
      targetTrans.content.includes('terjemahan otomatis') || 
      targetTrans.content.includes('belum tersedia') || 
      targetTrans.content.startsWith('Catatan:')
    );
    const needsTranslate = !targetTrans?.title || !targetTrans?.content || isFallback;

    if (needsTranslate) {
      let isMounted = true;
      fetch(`/api/articles/translate?id=${encodeURIComponent(post.id)}&locale=${language}&collection=fireball_articles`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.title && data.content && isMounted) {
            setLocalizedPost(prev => ({
              ...prev,
              title: data.title,
              excerpt: data.excerpt || prev.excerpt,
              content: data.content,
              translations: {
                ...prev.translations,
                [language]: {
                  title: data.title,
                  excerpt: data.excerpt || '',
                  content: data.content,
                  provider: 'on-the-fly-client'
                }
              } as any
            }));
          }
        })
        .catch(err => console.warn('[Fireball Translation Client] Gagal menerjemahkan artikel:', err));

      return () => {
        isMounted = false;
      };
    }
  }, [post, language]);

  const fb = post.fireball_data;

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">

        <Link href="/fireball" className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden">
          {t.backToFireball || '← Kembali ke Laporan Fireball'}
        </Link>

        <article className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-orange-950/30 rounded-3xl p-6 md:p-10 shadow-2xl transition-all print:border-0 print:bg-transparent print:p-0 print:shadow-none">

          <div className="flex justify-between items-center mb-6 print:hidden">
            <span className="bg-orange-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              🔥 {localizedPost.category}
            </span>
            <span className="text-slate-500 dark:text-gray-500 text-sm">{localizedPost.date}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight text-orange-600 dark:text-orange-400 print:text-black text-left">
            {localizedPost.title}
          </h1>

          {/* Data teknis fireball jika tersedia */}
          {fb && (
            <div className="mb-6 p-4 bg-orange-100 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-2xl print:border-gray-300 print:bg-gray-50">
              <p className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-3">📊 Data Teknis NASA/JPL</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fb.event_date && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Tanggal</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{fb.event_date.substring(0, 10)}</p>
                  </div>
                )}
                {(fb.energy_gj !== undefined && fb.energy_gj > 0) && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Energi</p>
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-300">{fb.energy_gj} GJ</p>
                  </div>
                )}
                {(fb.energy_kt !== undefined && fb.energy_kt > 0) && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Setara</p>
                    <p className="text-xs font-bold text-red-600 dark:text-red-300">{fb.energy_kt} kt TNT</p>
                  </div>
                )}
                {fb.vel && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">Kecepatan</p>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-300">{fb.vel} km/s</p>
                  </div>
                )}
              </div>

              {/* Weather Widget */}
              {weatherData && (
                <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-900/30 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-300 tracking-wider">☁️ Kondisi Cuaca Lokasi Kejadian (Saat Ini)</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950/45 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-gray-500 mb-0.5">Kondisi</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white capitalize">{weatherData.description}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950/45 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-gray-500 mb-0.5">Suhu</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{weatherData.temp}°C</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950/45 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-gray-500 mb-0.5">Kelembapan</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{weatherData.humidity}%</p>
                  </div>
                  <div className="bg-white dark:bg-slate-950/45 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-gray-500 mb-0.5">Angin</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{weatherData.wind_speed} m/s</p>
                  </div>
                </div>
              )}

              {fb.source && (
                <p className="text-xs text-slate-500 dark:text-gray-600 mt-3 text-center">Sumber: {fb.source}</p>
              )}
            </div>
          )}

          <ArticleActions post={localizedPost} />

          <div id="printable-article-content" className="space-y-6 text-left">
            <div className="h-64 md:h-[450px] w-full rounded-2xl overflow-hidden mb-8 print:h-auto print:mb-4">
              <SafeImage
                src={localizedPost.image}
                alt={localizedPost.title}
                className="w-full h-full object-cover"
                fallback="https://placehold.co/800x500/020617/f97316?text=Fireball+Meteor"
              />
            </div>

            <div className="max-w-none text-left border-b border-orange-200 dark:border-orange-900/30 pb-8 print:border-gray-300">
              {renderMarkdownContent(localizedPost.content, {
                headingColor: 'text-orange-600 dark:text-orange-400',
                h2Color: 'text-amber-600 dark:text-amber-400',
                h3Color: 'text-orange-600 dark:text-orange-400',
                paragraphColor: 'text-slate-700 dark:text-gray-300',
                printColor: 'print:text-black',
              })}
            </div>

            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-xl text-xs text-slate-500 dark:text-gray-500 text-center print:text-gray-600">
              <p>Data bersumber dari <strong>NASA/JPL Fireball Data API</strong> — Domain Publik, bebas lisensi.</p>
              <p className="mt-1">Artikel ini dibuat secara otomatis oleh sistem AI Meteorit Indonesia untuk tujuan edukasi.</p>
            </div>
          </div>

          <div className="print:hidden">
            <AdDisplay position="content" />
          </div>

        </article>
      </div>
    </main>
  );
}
