"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import AdDisplay from '@/components/AdDisplay';
import ApodActions from '@/components/ApodActions';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';

interface Apod {
  id: string; // YYYY-MM-DD
  title: {
    en: string;
    id: string;
    ms?: string;
    zh?: string;
    ja?: string;
  };
  explanation: {
    en: string;
    id: string;
    ms?: string;
    zh?: string;
    ja?: string;
  };
  image_url: string;
  copyright: string;
}

interface ApodContentClientProps {
  initialApod: Apod;
  initialTitle: string;
  initialExplanation: string;
}

// Format Date localized
function formatLocalizedDate(dateStr: string, locale: string) {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
}

export default function ApodContentClient({ initialApod, initialTitle, initialExplanation }: ApodContentClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];

  const [apod, setApod] = useState<Apod>(initialApod);
  const [currentTitle, setCurrentTitle] = useState(initialTitle);
  const [currentExplanation, setCurrentExplanation] = useState(initialExplanation);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Tentukan judul dan penjelasan dari data lokal jika sudah ada
    let title = (language !== 'id' && (apod.title as any)[language]) || '';
    let explanation = (language !== 'id' && (apod.explanation as any)[language]) || '';

    if (!title) title = apod.title.id || apod.title.en;
    if (!explanation) explanation = apod.explanation.id || apod.explanation.en;

    // Jika bahasa adalah Indonesia (default cache), gunakan default
    if (language === 'id') {
      setCurrentTitle(apod.title.id || apod.title.en);
      setCurrentExplanation(apod.explanation.id || apod.explanation.en);
      return;
    }

    // 2. Jika bukan Indonesia dan data cache lokal untuk bahasa ini belum lengkap, fetch dari server API secara aman
    const rawTitleInLang = (apod.title as any)[language];
    const rawExplanationInLang = (apod.explanation as any)[language];

    if (!rawTitleInLang || !rawExplanationInLang) {
      setLoading(true);
      fetch(`/api/apod/translate?id=${apod.id}&locale=${language}`)
        .then(res => res.json())
        .then(data => {
          if (data.title && data.explanation) {
            setCurrentTitle(data.title);
            setCurrentExplanation(data.explanation);
            // Update local state apod object cache so it doesn't fetch again if toggled back and forth
            setApod(prev => ({
              ...prev,
              title: { ...prev.title, [language]: data.title },
              explanation: { ...prev.explanation, [language]: data.explanation }
            }));
          }
        })
        .catch(err => {
          console.error("Gagal memuat terjemahan APOD secara dinamis:", err);
          setCurrentTitle(title);
          setCurrentExplanation(explanation);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setCurrentTitle(rawTitleInLang);
      setCurrentExplanation(rawExplanationInLang);
    }
  }, [language, apod.id]);

  const isVideo = apod.image_url.includes('youtube.com') || 
                  apod.image_url.includes('youtu.be') || 
                  apod.image_url.includes('vimeo.com') || 
                  apod.image_url.includes('player.vimeo.com');

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        
        {/* Navigation Breadcrumb */}
        <Link 
          href="/apod" 
          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden"
        >
          {t.backToApod || '← Kembali ke Galeri Foto Antariksa'}
        </Link>

        {/* Detail Box */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-cyan-950/30 rounded-3xl p-6 md:p-10 shadow-2xl transition-all print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          
          {/* Header Metadata */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <span className="bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 text-xs font-bold px-3.5 py-1 rounded-full uppercase">
              NASA APOD
            </span>
            <span className="text-slate-500 dark:text-gray-500 text-sm">{formatLocalizedDate(apod.id, language)}</span>
          </div>

          {/* Titles */}
          <div className="relative">
            {loading && (
              <span className="absolute right-0 top-0 text-xs text-cyan-500 animate-pulse font-bold print:hidden">🔄 Translating...</span>
            )}
            <h1 className="text-3xl md:text-5xl font-black mb-2 text-amber-600 dark:text-amber-400 print:text-black text-left leading-tight">
              {currentTitle}
            </h1>
            {apod.title.id && (
              <h2 className="text-lg md:text-xl font-medium text-slate-500 dark:text-gray-400 italic mb-8 text-left print:hidden">
                {apod.title.en}
              </h2>
            )}
          </div>

          {/* Interactive Client Actions */}
          <ApodActions 
            apod={{ 
              ...apod, 
              title: { id: currentTitle, en: apod.title.en }, 
              explanation: { id: currentExplanation, en: apod.explanation.en } 
            }} 
          />

          {/* Printable APOD Content */}
          <div id="printable-apod-content" className="space-y-8">
            
            {/* Visual Media Wrapper */}
            <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-cyan-950/50 relative bg-slate-950">
              {isVideo ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={apod.image_url}
                    title={currentTitle || 'NASA APOD Video'}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <SafeImage 
                  src={apod.image_url} 
                  alt={currentTitle || 'NASA APOD'} 
                  className="w-full h-auto max-h-[600px] object-contain mx-auto"
                  fallback="https://placehold.co/800x500/020617/22d3ee?text=APOD+Space+Photo"
                />
              )}
            </div>

            {/* Info and Copyright */}
            <div className="bg-slate-100 dark:bg-slate-950/50 rounded-2xl p-5 border border-slate-200 dark:border-cyan-950/50 flex flex-wrap justify-between items-center text-sm print:border print:border-gray-300 print:bg-gray-50 print:p-5">
              <div className="text-left mb-2 md:mb-0">
                <span className="text-slate-500 dark:text-gray-500 block text-xs uppercase tracking-wider font-bold print:text-black">{t.releaseDate || 'Tanggal Rilis'}</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-300 print:text-black">{formatLocalizedDate(apod.id, language)}</span>
              </div>
              <div className="text-left md:text-right">
                <span className="text-slate-500 dark:text-gray-500 block text-xs uppercase tracking-wider font-bold print:text-black">{t.copyrightLabel || 'Hak Cipta / Sumber'}</span>
                <span className="font-bold text-slate-800 dark:text-gray-200 print:text-black">{apod.copyright || 'NASA Public Domain'}</span>
              </div>
            </div>

            {/* Explanation section */}
            <div className="text-left space-y-4">
              <h3 className="text-xl md:text-2xl font-bold text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-cyan-900/30 pb-2 print:text-black print:border-gray-300">
                {t.scientificExplanation || 'Penjelasan Ilmiah'}
              </h3>
              <div className="text-slate-700 dark:text-gray-300 leading-relaxed text-sm md:text-base space-y-4 print:text-black">
                {currentExplanation.split('\n').filter((p: string) => p.trim() !== '').map((para: string, index: number) => (
                  <p key={index} className="leading-relaxed">{para.trim()}</p>
                ))}
              </div>
            </div>

            {/* Original English Section */}
            {apod.explanation.id && apod.explanation.en && (
              <div className="text-left space-y-3 pt-6 border-t border-slate-200 dark:border-slate-900 print:hidden">
                <h4 className="text-sm font-bold text-amber-500/70 uppercase tracking-widest">
                  {t.originalExplanation || 'Original English Explanation'}
                </h4>
                <div className="text-slate-500 dark:text-gray-500 italic leading-relaxed text-xs md:text-sm space-y-3">
                  {apod.explanation.en.split('\n').filter((p: string) => p.trim() !== '').map((para: string, index: number) => (
                    <p key={index}>{para.trim()}</p>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="print:hidden mt-8">
            <AdDisplay position="content" />
          </div>

        </div>
      </div>
    </main>
  );
}
