"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import AdDisplay from '@/components/AdDisplay';
import MeteoriteActions from '@/components/MeteoriteActions';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';
import { renderMarkdownContent } from '@/lib/markdownRenderer';

interface Meteorite {
  id: string;
  name: string;
  translated_name: string;
  mass: string;
  year: string;
  recclass: string;
  lat: string;
  long: string;
  description: string;
  translated_description: string;
  image_url: string;
  translations?: Record<string, { name: string; description: string }>;
}

interface MeteoriteDetailClientProps {
  initialMeteorite: Meteorite;
}

export default function MeteoriteDetailClient({ initialMeteorite }: MeteoriteDetailClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];

  const [meteorite, setMeteorite] = useState<Meteorite>(initialMeteorite);
  const [currentName, setCurrentName] = useState(initialMeteorite.translated_name || initialMeteorite.name);
  const [currentDescription, setCurrentDescription] = useState(initialMeteorite.translated_description || initialMeteorite.description);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Tentukan konten lokal jika sudah ada di cache
    const translations = meteorite.translations || {};
    let name = translations[language]?.name || '';
    let description = translations[language]?.description || '';

    // Jika bahasa Indonesia (default) atau sudah ada terjemahan
    const hasTranslation = language === 'id' || (name && description);

    if (hasTranslation) {
      setCurrentName(language === 'id' ? (meteorite.translated_name || meteorite.name) : name);
      setCurrentDescription(language === 'id' ? (meteorite.translated_description || meteorite.description) : description);
      return;
    }

    // 2. Jika belum ada, fetch on-demand secara aman dari server-side API
    setLoading(true);
    fetch(`/api/meteorite/translate?id=${meteorite.id}&locale=${language}`)
      .then(res => res.json())
      .then(data => {
        if (data.name && data.description) {
          setCurrentName(data.name);
          setCurrentDescription(data.description);

          // Update local state cache
          setMeteorite(prev => {
            const updated = { ...prev };
            updated.translations = updated.translations || {};
            updated.translations[language] = { name: data.name, description: data.description };
            return updated;
          });
        }
      })
      .catch(err => {
        console.error("Gagal menterjemahkan meteorit secara dinamis:", err);
        setCurrentName(meteorite.name);
        setCurrentDescription(meteorite.translated_description || meteorite.description);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [language, meteorite.id]);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white py-16 transition-colors duration-300 print:bg-white print:text-black">
      <div className="container mx-auto px-4 max-w-4xl print:max-w-full">
        
        <Link 
          href="/ensiklopedia" 
          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-bold mb-8 inline-flex items-center gap-2 print:hidden"
        >
          {t.backToEncyclopedia || '← Kembali ke Katalog Ensiklopedia'}
        </Link>

        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-cyan-950/30 rounded-3xl p-6 md:p-10 shadow-2xl transition-all print:border-0 print:bg-transparent print:p-0 print:shadow-none">
          
          <div className="flex justify-between items-center mb-6 print:hidden">
            <span className="bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase">
              {meteorite.recclass}
            </span>
            <span className="text-slate-500 dark:text-gray-500 text-sm">ID NASA: {meteorite.id}</span>
          </div>

          <div className="relative">
            {loading && (
              <span className="absolute right-0 top-0 text-xs text-cyan-500 animate-pulse font-bold print:hidden">🔄 Translating...</span>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6 text-amber-600 dark:text-amber-400 print:text-black text-left leading-tight">
              Meteorit {currentName}
            </h1>
          </div>

          {/* Dynamic Client Actions */}
          <MeteoriteActions 
            meteorite={{ 
              ...meteorite, 
              name: currentName, 
              description: currentDescription, 
              translated_name: currentName, 
              translated_description: currentDescription 
            }} 
          />

          {/* Printable container */}
          <div id="printable-meteorite-content" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="h-64 md:h-[350px] w-full rounded-2xl overflow-hidden print:h-auto">
                <SafeImage 
                  src={meteorite.image_url} 
                  alt={currentName} 
                  className="w-full h-full object-cover"
                  fallback="https://placehold.co/600x400/020617/22d3ee?text=Meteorit"
                />
              </div>

              {/* Meteorological Parameters */}
              <div className="bg-white dark:bg-slate-950/50 rounded-2xl p-6 border border-slate-200 dark:border-cyan-950/50 flex flex-col justify-center text-left print:border print:border-gray-300 print:bg-gray-50 print:p-6">
                <h3 className="text-lg font-bold mb-4 text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-cyan-900/30 pb-2 print:text-black print:border-gray-300">{t.physicalSpec || 'Spesifikasi Fisik'}</h3>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-500 print:text-black font-medium">{t.rockName || 'Nama Batuan:'}</span>
                    <span className="font-bold text-slate-800 dark:text-gray-200 print:text-black">{currentName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-500 print:text-black font-medium">{t.rockType || 'Tipe / Kelas:'}</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 print:text-black">{meteorite.recclass}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-500 print:text-black font-medium">{t.estimatedMass || 'Estimasi Massa:'}</span>
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400 print:text-black">{meteorite.mass}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-500 print:text-black font-medium">{t.foundYear || 'Tahun Ditemukan:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-gray-200 print:text-black">{meteorite.year}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-500 print:text-black font-medium">{t.latitudeLabel || 'Koordinat Lintang:'}</span>
                    <span className="font-mono text-slate-600 dark:text-gray-300 print:text-black">{meteorite.lat}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-500 print:text-black font-medium">{t.longitudeLabel || 'Koordinat Bujur:'}</span>
                    <span className="font-mono text-slate-600 dark:text-gray-300 print:text-black">{meteorite.long}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Description Content */}
            <div className="text-left mb-8">
              <h3 className="text-2xl font-bold mb-4 text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-cyan-900/30 pb-2 print:text-black print:border-gray-300">{t.descriptionHistory || 'Deskripsi & Analisis Sejarah'}</h3>
              <div className="text-slate-700 dark:text-gray-300 leading-relaxed print:text-black space-y-4">
              <div className="max-w-none">
                {renderMarkdownContent(currentDescription, {
                  headingColor: 'text-cyan-600 dark:text-cyan-400',
                  h2Color: 'text-cyan-600 dark:text-cyan-400',
                  h3Color: 'text-amber-600 dark:text-amber-400',
                  paragraphColor: 'text-slate-700 dark:text-gray-300',
                  printColor: 'print:text-black',
                })}
              </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="text-left mt-8">
            <h3 className="text-2xl font-bold mb-4 text-cyan-600 dark:text-cyan-400 border-b border-slate-200 dark:border-cyan-900/30 pb-2 print:text-black">{t.landingLocation || 'Lokasi Geografis Pendaratan'}</h3>
            <div className="w-full h-64 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-200 dark:border-cyan-900/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/5 dark:from-cyan-950/20 via-white dark:via-slate-950 to-white dark:to-slate-950 opacity-80" />
              <div className="relative z-10 text-center p-4">
                <span className="text-4xl block mb-2 animate-bounce">📍</span>
                <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{t.impactCoordinates || 'Koordinat Jatuh:'} {meteorite.lat}, {meteorite.long}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${meteorite.lat},${meteorite.long}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 inline-block bg-cyan-600/10 dark:bg-cyan-600/30 hover:bg-cyan-600/20 dark:hover:bg-cyan-600/50 text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 border border-cyan-300 dark:border-cyan-500/30 font-bold py-1.5 px-4 rounded-xl text-xs transition-all"
                >
                  {t.openInGoogleMaps || 'Buka di Google Maps →'}
                </a>
              </div>
            </div>
          </div>

          <div className="print:hidden">
            <AdDisplay position="content" />
          </div>

        </div>
      </div>
    </main>
  );
}
