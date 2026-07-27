"use client";

import { useEffect, useState } from 'react';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { localizeArticle, localizeCategory } from '@/lib/clientArticleLocalization';
import type { ArticleTranslations } from '@/lib/articleLocalization';
import ArticleActions from '@/components/ArticleActions';
import AdDisplay from '@/components/AdDisplay';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { landingText } from '@/lib/landingText';
import { renderMarkdownContent } from '@/lib/markdownRenderer';

interface ArticleContentClientProps {
  post: {
    id: string;
    title: string;
    category: string;
    date: string;
    excerpt: string;
    content: string;
    image: string;
    translations?: ArticleTranslations;
  };
  backHref: string;
}

/**
 * Client component yang memilih konten artikel berdasarkan bahasa aktif.
 * Ini memungkinkan ganti bahasa tanpa reload halaman penuh.
 */
export default function ArticleContentClient({ post, backHref }: ArticleContentClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];
  const [localizedPost, setLocalizedPost] = useState(post);

  useEffect(() => {
    const initLocalized = localizeArticle(post, language);
    setLocalizedPost(initLocalized);

    if (language === 'id') return;

    const targetTrans = post.translations?.[language];
    const isFallback = targetTrans?.content && (targetTrans.content.includes('terjemahan otomatis') || targetTrans.content.includes('belum tersedia') || targetTrans.content.startsWith('Catatan:'));
    const needsTranslate = !targetTrans?.title || !targetTrans?.content || isFallback;

    if (needsTranslate) {
      let isMounted = true;
      const cat = (post.category || '').toLowerCase();
      let coll = 'articles';
      if (cat.includes('komet') || cat.includes('asteroid')) {
        coll = 'komet_articles';
      } else if (cat.includes('bola api') || cat.includes('fireball')) {
        coll = 'fireball_articles';
      } else if (cat.includes('peristiwa alam') || cat.includes('eonet')) {
        coll = 'eonet_articles';
      } else if (cat.includes('mars') || cat.includes('planet mars')) {
        coll = 'mars_articles';
      }

      fetch(`/api/articles/translate?id=${encodeURIComponent(post.id)}&locale=${language}&collection=${coll}`)
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
        .catch(err => console.warn('[Article Translation Client] Gagal menerjemahkan artikel:', err));

      return () => {
        isMounted = false;
      };
    }
  }, [post, language]);

  const localized = localizedPost;

  return (
    <main className="min-h-screen bg-slate-950 text-white py-16 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">

        {/* Navigation back link */}
        <Link
          href={backHref}
          className="text-cyan-400 hover:text-cyan-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden"
        >
          {t.backToBlog || '← Kembali ke Daftar Artikel'}
        </Link>

        <article className="bg-slate-900/40 border border-cyan-950/30 rounded-3xl p-6 md:p-10 shadow-2xl print:border-0 print:bg-transparent print:p-0 print:shadow-none">

          <div className="flex justify-between items-center mb-6 print:hidden">
            <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {localizeCategory(localized.category, language)}
            </span>
            <span className="text-gray-500 text-sm">{localized.date}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight text-cyan-400 print:text-black text-left">
            {localized.title}
          </h1>

          {/* Dynamic Client Actions — pass localized post so TTS reads in correct language */}
          <ArticleActions post={localized} />

          {/* Printable container */}
          <div id="printable-article-content" className="space-y-6 text-left">
            {/* Banner Image */}
            <div className="h-64 md:h-[450px] w-full rounded-2xl overflow-hidden mb-8 print:h-auto print:mb-4">
              <SafeImage
                src={localized.image}
                alt={localized.title}
                className="w-full h-full object-cover"
                fallback="https://placehold.co/800x500/020617/22d3ee?text=Astronomi"
              />
            </div>

            {/* Content body */}
            <div className="max-w-none text-left border-b border-cyan-900/30 pb-8 print:border-gray-300">
              {renderMarkdownContent(localized.content, {
                headingColor: 'text-cyan-400',
                h2Color: 'text-cyan-400',
                h3Color: 'text-amber-400',
                paragraphColor: 'text-gray-300',
                printColor: 'print:text-black',
              })}
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
