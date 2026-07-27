"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GlossaryDetailActions from '@/components/GlossaryDetailActions';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';
import type { GlossaryTerm } from '@/lib/glossaryData';
import type { SiteLanguage } from '@/lib/i18n';

interface GlossaryDetailClientProps {
  initialTerm: GlossaryTerm;
  initialLanguage: SiteLanguage;
}

export default function GlossaryDetailClient({ initialTerm, initialLanguage }: GlossaryDetailClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];

  const [term, setTerm] = useState<GlossaryTerm>(initialTerm);
  const [currentTitle, setCurrentTitle] = useState(initialTerm.term[initialLanguage] || initialTerm.term.id);
  const [currentDefinition, setCurrentDefinition] = useState(initialTerm.definition[initialLanguage] || initialTerm.definition.id);
  const [currentExample, setCurrentExample] = useState(initialTerm.example[initialLanguage] || initialTerm.example.id);
  const [currentArticle, setCurrentArticle] = useState(initialTerm.articles?.[initialLanguage] || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Tentukan konten lokal jika sudah ada di cache state `term`
    const title = term.term[language] || term.term.id;
    const definition = term.definition[language] || term.definition.id;
    const example = term.example[language] || term.example.id;
    const article = term.articles?.[language] || '';

    // Jika target bahasa adalah Indonesia (default) atau data cache lokal untuk bahasa ini sudah lengkap
    const hasDetails = language === 'id' || (term.translatedLocales?.[language] && article);

    if (hasDetails) {
      setCurrentTitle(title);
      setCurrentDefinition(definition);
      setCurrentExample(example);
      setCurrentArticle(article);
      return;
    }

    // 2. Jika bukan Indonesia dan data cache lokal untuk bahasa ini belum lengkap, fetch dari server API secara aman
    setLoading(true);
    fetch(`/api/glossary/translate?id=${term.id}&locale=${language}`)
      .then(res => res.json())
      .then(data => {
        if (data.term && data.definition && data.example) {
          setCurrentTitle(data.term);
          setCurrentDefinition(data.definition);
          setCurrentExample(data.example);
          setCurrentArticle(data.articleHtml || '');
          
          // Update local state term object cache
          setTerm(prev => {
            const updatedTerm = { ...prev };
            updatedTerm.term[language] = data.term;
            updatedTerm.definition[language] = data.definition;
            updatedTerm.example[language] = data.example;
            updatedTerm.articles = updatedTerm.articles || ({} as any);
            updatedTerm.articles![language] = data.articleHtml || '';
            updatedTerm.translatedLocales = updatedTerm.translatedLocales || ({} as any);
            updatedTerm.translatedLocales![language] = true;
            return updatedTerm;
          });
        }
      })
      .catch(err => {
        console.error("Gagal memuat terjemahan glossarium secara dinamis:", err);
        setCurrentTitle(title);
        setCurrentDefinition(definition);
        setCurrentExample(example);
        setCurrentArticle(article);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [language, term.id]);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 py-12 text-slate-900 dark:text-white transition-colors duration-300 print:bg-white print:text-black">
      <div className="container mx-auto max-w-5xl px-4">
        <Link href="/glossarium" className="mb-8 inline-flex text-sm font-black text-cyan-600 dark:text-cyan-300 hover:text-cyan-500 dark:hover:text-cyan-200 print:hidden">
          {t.backToGlossary || '← Kembali ke Glossarium'}
        </Link>

        <article id="glossary-detail-pdf" className="overflow-hidden rounded-2xl border border-slate-200 dark:border-cyan-900/30 bg-slate-50 dark:bg-slate-900/50 transition-all print:border-0 print:bg-white">
          <div className="h-72 bg-slate-900 md:h-[430px]">
            <img src={term.image} alt={currentTitle} className="h-full w-full object-cover" />
          </div>

          <div className="p-6 md:p-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="relative">
                {loading && (
                  <span className="absolute right-0 top-0 text-xs text-cyan-500 animate-pulse font-bold print:hidden">🔄 Translating...</span>
                )}
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${term.category === 'BMKG' ? 'bg-cyan-100 dark:bg-cyan-400 text-cyan-800 dark:text-slate-950' : 'bg-amber-100 dark:bg-amber-400 text-amber-800 dark:text-slate-950'}`}>
                  {term.category}
                </span>
                <h1 className="mt-4 text-4xl font-black leading-tight text-cyan-600 dark:text-cyan-200 md:text-6xl print:text-black">
                  {currentTitle}
                </h1>
                <p className="mt-2 text-sm font-bold text-slate-500 dark:text-gray-400 print:text-gray-700">
                  {term.term.en}
                </p>
              </div>
              <GlossaryDetailActions term={{ ...term, term: { ...term.term, [language]: currentTitle }, definition: { ...term.definition, [language]: currentDefinition }, example: { ...term.example, [language]: currentExample } }} language={language} />
            </div>

            <section className="mt-8 grid gap-5 md:grid-cols-[1.35fr_0.65fr]">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300 print:text-black">{t.definitionLabel || 'Definisi'}</h2>
                <p className="mt-3 text-lg leading-relaxed text-slate-700 dark:text-slate-200 print:text-black">
                  {currentDefinition}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/70 p-5 print:border-gray-300 print:bg-gray-50">
                <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300 print:text-black">{t.exampleLabel || 'Contoh'}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 print:text-black">
                  {currentExample}
                </p>
              </div>
            </section>

            {/* Rich Article Section */}
            {currentArticle && (
              <section className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-8 print:border-gray-250">
                <h2 className="text-2xl font-black text-amber-600 dark:text-amber-300 mb-4 print:text-black">{t.richDiscussion || 'Pembahasan Ilmiah'}</h2>
                <div 
                  className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 print:text-black print:prose-neutral"
                  dangerouslySetInnerHTML={{ __html: currentArticle }}
                />
              </section>
            )}

            <section className="mt-10 rounded-xl border border-slate-200 dark:border-cyan-900/40 bg-slate-100 dark:bg-slate-950/60 p-5 print:border-gray-300 print:bg-white">
              <h2 className="text-sm font-black uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300 print:text-black">{t.translationsLabel || 'Terjemahan'}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {(['id', 'en', 'ms', 'zh', 'ja', 'ru', 'fr'] as const).map((locale) => (
                  <div key={locale} className="rounded-lg bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-0 print:bg-gray-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">{locale}</p>
                    <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-100 print:text-black">{term.term[locale] || term.term.en || term.term.id}</p>
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-6 text-xs font-semibold text-slate-400 dark:text-slate-500 print:text-gray-600">
              {t.sourceLabel || 'Sumber:'} {term.source}. {t.updatedAtLabel || 'Diperbarui:'} {new Date(term.updatedAt || new Date()).toLocaleDateString(language)}.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
