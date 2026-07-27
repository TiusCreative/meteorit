"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import AdDisplay from '@/components/AdDisplay';
import MarsArticleActions from '@/components/MarsArticleActions';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { pickLocalizedArticle, type ArticleTranslations } from '@/lib/articleLocalization';
import { landingText } from '@/lib/landingText';

interface MarsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
  translations?: ArticleTranslations;
  mars_data?: {
    topic?: string;
    rover?: string;
    camera?: string;
    sol?: number;
    earth_date?: string;
  };
}

interface MarsArticleClientProps {
  article: MarsArticle;
}

const DEFAULT_IMAGE = 'https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg';

function sanitizeArticleHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

function stripHtml(str: string) {
  return str.replace(/<[^>]*>/g, '').trim();
}

export default function MarsArticleClient({ article }: MarsArticleClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [localizedPost, setLocalizedPost] = useState(article);

  useEffect(() => {
    const initLocalized = pickLocalizedArticle(article as any, language);
    setLocalizedPost(initLocalized as any);

    if (language === 'id') return;

    const targetTrans = article.translations?.[language];
    const isFallback = targetTrans?.content && (
      targetTrans.content.includes('terjemahan otomatis') || 
      targetTrans.content.includes('belum tersedia') || 
      targetTrans.content.startsWith('Catatan:')
    );
    const needsTranslate = !targetTrans?.title || !targetTrans?.content || isFallback;

    if (needsTranslate) {
      let isMounted = true;
      fetch(`/api/articles/translate?id=${encodeURIComponent(article.id)}&locale=${language}&collection=mars_articles`)
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
        .catch(err => console.warn('[Mars Translation Client] Gagal menerjemahkan artikel:', err));

      return () => {
        isMounted = false;
      };
    }
  }, [article, language]);

  const cleanHtml = sanitizeArticleHtml(localizedPost.content);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        <Link href="/mars" className="text-orange-600 dark:text-orange-300 hover:text-orange-500 dark:hover:text-orange-200 font-bold mb-8 inline-flex items-center gap-2 print:hidden">
          {t.backToMars || '← Kembali ke Artikel Mars'}
        </Link>

        <article className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-red-950/40 rounded-3xl p-6 md:p-10 shadow-2xl transition-all print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          <div id="printable-mars-content">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
              <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-orange-100 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Planet Mars
              </span>
              <span className="text-slate-500 dark:text-gray-500 text-sm">{localizedPost.date}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight text-orange-600 dark:text-orange-300 print:text-black text-left">
              {localizedPost.title}
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed mb-8 print:text-black">
              {stripHtml(localizedPost.excerpt)}
            </p>

            <div className="h-64 md:h-[440px] w-full rounded-2xl overflow-hidden mb-4 print:h-auto">
              <SafeImage
                src={localizedPost.image}
                alt={localizedPost.title}
                className="w-full h-full object-cover"
                fallback={DEFAULT_IMAGE}
              />
            </div>

            <div className="text-xs text-slate-500 mb-8 print:text-black">
              NASA Mars Rover API • {localizedPost.mars_data?.rover || 'Mars Rover'} • {localizedPost.mars_data?.camera || 'Camera'} • Sol {localizedPost.mars_data?.sol || '-'}
            </div>

            <MarsArticleActions article={localizedPost} />

            <div
              className="mars-prose max-w-none text-left border-b border-slate-200 dark:border-red-950/30 pb-8 print:border-gray-300"
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
          </div>

          <div className="print:hidden">
            <AdDisplay position="content" />
          </div>
        </article>
      </div>
    </main>
  );
}
