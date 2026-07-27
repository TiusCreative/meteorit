"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';

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

interface EncyclopediaListClientProps {
  initialMeteorites: Meteorite[];
}

export default function EncyclopediaListClient({ initialMeteorites }: EncyclopediaListClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];

  const [filteredMeteorites, setFilteredMeteorites] = useState<Meteorite[]>(initialMeteorites);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    let result = initialMeteorites;
    if (selectedClass) {
      result = result.filter(m => m.recclass.toLowerCase().includes(selectedClass.toLowerCase()));
    }
    if (searchQuery) {
      result = result.filter(m => {
        const name = language === 'id' 
          ? (m.translated_name || m.name) 
          : (m.translations?.[language]?.name || m.name);
        return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               m.recclass.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    setFilteredMeteorites(result);
    setCurrentPage(1);
  }, [searchQuery, selectedClass, initialMeteorites, language]);

  // Extract unique classes
  const classesList = Array.from(new Set(initialMeteorites.map(m => m.recclass))).slice(0, 10);

  // Pagination calculations
  const totalPages = Math.ceil(filteredMeteorites.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMeteorites.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div>
        {/* Filter Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-900/60 backdrop-blur border border-slate-200 dark:border-cyan-900/30 p-6 rounded-2xl mb-12 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg transition-colors">
          <div className="w-full md:w-1/3">
            <input 
              type="text"
              placeholder={t.searchMeteoritePlaceholder || "Cari nama atau tipe meteorit..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-cyan-900/40 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
            />
          </div>

          <div className="w-full md:w-auto flex items-center gap-3 justify-end">
            <label className="text-slate-500 dark:text-gray-400 text-sm font-semibold shrink-0">{t.classificationLabel || "Klasifikasi:"}</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-cyan-900/40 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-cyan-400 max-w-[200px] text-sm"
            >
              <option value="">{t.allTypes || "Semua Tipe"}</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        <AdDisplay position="hero" />

        {filteredMeteorites.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-cyan-950/50 rounded-2xl">
            <span className="text-4xl mb-4 block">☄️</span>
            <p className="text-slate-700 dark:text-gray-400 font-medium">{t.meteorNotFound || "Benda langit tidak ditemukan."}</p>
            <p className="text-slate-400 dark:text-gray-650 text-sm mt-1">{t.meteorNotFoundDesc || "Gunakan sinkronisasi manual di admin dashboard untuk memuat data NASA terbaru."}</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentItems.map((met) => {
                const name = language === 'id' 
                  ? (met.translated_name || met.name) 
                  : (met.translations?.[language]?.name || met.name);

                return (
                  <div key={met.id} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-cyan-950/30 rounded-2xl overflow-hidden shadow-xl hover:shadow-cyan-900/10 hover:border-cyan-500/30 transition-all duration-300 group flex flex-col h-full">
                    <div className="h-44 bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
                      <img 
                        src={met.image_url} 
                        alt={name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placehold.co/600x400/020617/22d3ee?text=Meteorit';
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-cyan-100 dark:bg-cyan-900/80 backdrop-blur text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-xs font-bold px-2 py-0.5 rounded uppercase">
                        {met.recclass}
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-grow text-left">
                      <h2 className="text-2xl font-bold mb-3 text-amber-600 dark:text-amber-400 group-hover:text-amber-500 dark:group-hover:text-amber-300 transition-colors">
                        {name}
                      </h2>
                      <div className="space-y-2 text-sm text-slate-700 dark:text-gray-300 mb-6 flex-grow">
                        <p className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                          <span className="text-slate-400 dark:text-gray-500">{t.estimatedMass || 'Massa Berat:'}</span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">{met.mass}</span>
                        </p>
                        <p className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                          <span className="text-slate-400 dark:text-gray-500">{t.foundYear || 'Tahun Jatuh:'}</span>
                          <span className="font-semibold">{met.year}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400 dark:text-gray-500">{t.latitudeLabel || 'Lintang:'}, {t.longitudeLabel || 'Bujur:'}</span>
                          <span className="font-mono text-xs">{met.lat}, {met.long}</span>
                        </p>
                      </div>

                      <Link 
                        href={`/ensiklopedia/${met.id}`}
                        className="mt-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl text-center transition-colors text-sm"
                      >
                        {t.viewDetails || 'Lihat Detail & Analisis'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    currentPage === 1 
                      ? 'border-slate-800 text-gray-600 cursor-not-allowed' 
                      : 'border-cyan-900/40 text-cyan-400 bg-slate-900/40 hover:bg-slate-800'
                  }`}
                >
                  Sebelumnya
                </button>
                <span className="text-sm font-bold text-gray-400">Halaman {currentPage} dari {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    currentPage === totalPages 
                      ? 'border-slate-800 text-gray-600 cursor-not-allowed' 
                      : 'border-cyan-900/40 text-cyan-400 bg-slate-900/40 hover:bg-slate-800'
                  }`}
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        )}

        <AdDisplay position="footer" />
    </div>
  );
}
