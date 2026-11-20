"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdDisplay from '@/components/AdDisplay';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';
import MobileFlipboardReader, { MobileReaderItem } from '@/components/MobileFlipboardReader';
import SafeImage from '@/components/SafeImage';

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
  createdAt?: string;
  date?: string;
  publishedAt?: string;
  translations?: Record<string, { name: string; description: string }>;
}

interface EncyclopediaListClientProps {
  initialMeteorites: Meteorite[];
}

import DateFilterBar, { DateFilterValue } from '@/components/DateFilterBar';
import { matchesDateFilter, parseItemDate } from '@/lib/dateFilterHelper';
import { useMemo } from 'react';

export default function EncyclopediaListClient({ initialMeteorites }: EncyclopediaListClientProps) {
  const language = useSiteLanguage();
  const t = landingText[language];

  const [filteredMeteorites, setFilteredMeteorites] = useState<Meteorite[]>(initialMeteorites);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    startDate: '',
    endDate: '',
    selectedMonth: '',
    selectedYear: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [readerMode, setReaderMode] = useState<'grid' | 'flipboard'>('grid');
  const itemsPerPage = 30;

  // Extract all unique meteorite years dynamically for the year filter dropdown
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    initialMeteorites.forEach(m => {
      const p = parseItemDate(m.year || (m as any).createdAt || m.id);
      if (p?.year) set.add(p.year);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [initialMeteorites]);

  useEffect(() => {
    const saved = localStorage.getItem('meteorit_reader_mode_ensiklopedia');
    if (saved === 'flipboard') setReaderMode('flipboard');
  }, []);

  const toggleReaderMode = (mode: 'grid' | 'flipboard') => {
    setReaderMode(mode);
    localStorage.setItem('meteorit_reader_mode_ensiklopedia', mode);
  };

  useEffect(() => {
    let result = initialMeteorites;
    if (selectedClass) {
      result = result.filter(m => (m.recclass || '').toLowerCase().includes(selectedClass.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter(m => {
        const origName = (m.name || '').toLowerCase();
        const transName = (m.translated_name || '').toLowerCase();
        const localizedName = (m.translations?.[language]?.name || '').toLowerCase();
        const recclass = (m.recclass || '').toLowerCase();
        const year = (m.year || '').toLowerCase();
        const desc = (m.description || '').toLowerCase();
        const transDesc = (m.translated_description || '').toLowerCase();
        const localizedDesc = (m.translations?.[language]?.description || '').toLowerCase();
        const mass = (m.mass || '').toLowerCase();

        const searchableText = `${origName} ${transName} ${localizedName} ${recclass} ${year} ${desc} ${transDesc} ${localizedDesc} ${mass}`;
        return tokens.every(token => searchableText.includes(token));
      });
    }
    if (dateFilter.startDate || dateFilter.endDate || dateFilter.selectedMonth || dateFilter.selectedYear) {
      result = result.filter(m => matchesDateFilter(m, dateFilter));
    }
    setFilteredMeteorites(result);
    setCurrentPage(1);
  }, [searchQuery, selectedClass, dateFilter, initialMeteorites, language]);

  // Extract all unique meteorite classes sorted alphabetically
  const classesList = Array.from(new Set(initialMeteorites.map(m => m.recclass).filter(Boolean))).sort();

  // Pagination calculations
  const totalPages = Math.ceil(filteredMeteorites.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMeteorites.slice(indexOfFirstItem, indexOfLastItem);

  const flipboardItems: MobileReaderItem[] = filteredMeteorites.map((met) => {
    const name = language === 'id' 
      ? (met.translated_name || met.name) 
      : (met.translations?.[language]?.name || met.name);
    const desc = met.translated_description || met.description || '';
    return {
      id: met.id,
      title: name,
      excerpt: `Massa: ${met.mass} • Tahun Jatuh: ${met.year} • Koordinat: (${met.lat}, ${met.long}). ${desc}`,
      image: met.image_url,
      category: met.recclass || 'Meteorit',
      date: met.year || 'Tidak diketahui',
      link: `/ensiklopedia/${met.id}`,
    };
  });

  return (
    <div>
      {/* Mobile Fullscreen Flipboard Reader Mode */}
      {readerMode === 'flipboard' && (
        <MobileFlipboardReader
          items={flipboardItems}
          title={t.catalogTitle || "Katalog Meteorit"}
          onSwitchToGrid={() => toggleReaderMode('grid')}
        />
      )}

      {/* DUAL MODE READER SWITCHER TOGGLE (Mobile Only) */}
      <div className="flex justify-center items-center gap-2 mb-6">
        <div className="bg-slate-900/90 border border-cyan-900/40 p-1 rounded-2xl flex items-center shadow-lg">
          <button
            onClick={() => toggleReaderMode('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              readerMode === 'grid'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📰</span>
            <span>Mode Grid</span>
          </button>
          <button
            onClick={() => toggleReaderMode('flipboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              readerMode === 'flipboard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>📱</span>
            <span>Mode Swipe Feed</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar (Historical Era Mode for Meteorite Specimens) */}
      <DateFilterBar mode="historical" value={dateFilter} onChange={setDateFilter} availableYears={availableYears} />

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

          <div className="w-full md:w-auto flex items-center gap-3 justify-end flex-wrap">
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
            {(searchQuery || selectedClass || dateFilter.selectedYear || dateFilter.selectedMonth || dateFilter.startDate || dateFilter.endDate) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('');
                  setDateFilter({ startDate: '', endDate: '', selectedMonth: '', selectedYear: '' });
                }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-rose-600 rounded-xl text-xs font-semibold transition-colors"
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        <AdDisplay position="hero" />

        {filteredMeteorites.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-cyan-950/60 rounded-2xl p-6">
            <span className="text-4xl mb-3 block">☄️</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              {searchQuery || selectedClass || dateFilter.startDate || dateFilter.endDate || dateFilter.selectedYear
                ? 'Tidak ada meteorit yang cocok dengan filter'
                : (t.meteorNotFound || 'Benda langit tidak ditemukan.')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 max-w-lg mx-auto mb-4">
              {searchQuery || selectedClass || dateFilter.startDate || dateFilter.endDate || dateFilter.selectedYear
                ? 'Spesimen meteorit dalam katalog terdata berdasarkan Tahun Jatuh Sejarah (1491 - 2013). Silakan pilih Era Sejarah lain, bersihkan kata kunci, atau klik tombol Reset.'
                : (t.meteorNotFoundDesc || 'Gunakan sinkronisasi manual di admin dashboard untuk memuat data NASA terbaru.')}
            </p>
            {(searchQuery || selectedClass || dateFilter.startDate || dateFilter.endDate || dateFilter.selectedYear) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClass('');
                  setDateFilter({ startDate: '', endDate: '', selectedMonth: '', selectedYear: '' });
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg"
              >
                🔄 Reset Semua Filter
              </button>
            )}
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
                      <SafeImage 
                        src={met.image_url} 
                        alt={name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallback="https://cdn.meteorit.my.id/data/glossary/images/nasa-meteorite.webp"
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
                        <p className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1 text-xs">
                          <span className="text-slate-400 dark:text-gray-500">Terbit:</span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            {met.date || (met.publishedAt || met.createdAt ? new Date(met.publishedAt || met.createdAt!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '16 Nov 2026')}
                          </span>
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
