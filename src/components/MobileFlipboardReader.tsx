"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';

export interface MobileReaderItem {
  id: string;
  title: string;
  excerpt: string;
  image?: string;
  category: string;
  date: string;
  link: string;
  readTime?: string;
}

interface MobileFlipboardReaderProps {
  items: MobileReaderItem[];
  title: string;
  onSwitchToGrid: () => void;
}

// 10 Preset Warna Banner Dinamis yang Berotasi Setiap Hari (Sesuai swap-mode.md)
const DYNAMIC_BANNER_PRESETS = [
  { bg: 'bg-white', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-[#1877F2]', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-[#1DB954]', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-700', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-amber-400', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-cyan-400', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-rose-400', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-orange-400', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-lime-400', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
  { bg: 'bg-emerald-400', text: 'text-slate-950 font-black', badgeBg: 'bg-slate-950 text-white' },
];

export default function MobileFlipboardReader({
  items,
  title,
  onSwitchToGrid,
}: MobileFlipboardReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Touch swipe tracking
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const minSwipeDistance = 50;

  const currentItem = items[currentIndex];

  // Hitung rotasi warna banner harian
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const activePreset = DYNAMIC_BANNER_PRESETS[(dayOfYear + currentIndex) % DYNAMIC_BANNER_PRESETS.length];

  const handleNext = () => {
    if (isAnimating || currentIndex >= items.length - 1) return;
    setDirection('next');
    setIsAnimating(true);
    setCurrentIndex((prev) => prev + 1);
    setTimeout(() => setIsAnimating(false), 450);
  };

  const handlePrev = () => {
    if (isAnimating || currentIndex <= 0) return;
    setDirection('prev');
    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);
    setTimeout(() => setIsAnimating(false), 450);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnimating, items.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    const distance = touchStartY.current - touchEndY.current;
    if (distance > minSwipeDistance) {
      // Swiped UP -> Next item
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped DOWN -> Prev item
      handlePrev();
    }
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  const handleShare = async (item: MobileReaderItem) => {
    const fullUrl = `${window.location.origin}${item.link}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.excerpt,
          url: fullUrl,
        });
      } catch {
        /* share cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch {
        /* fallback error */
      }
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="h-[100dvh] bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <span className="text-5xl mb-4">📡</span>
        <p className="text-gray-300 font-bold mb-4">Tidak ada artikel untuk ditampilkan di Flipboard Reader.</p>
        <button
          onClick={onSwitchToGrid}
          className="bg-amber-500 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm"
        >
           Kembali ke Mode Grid
        </button>
      </div>
    );
  }

  // Calculate reading time fallback (150 words per minute)
  const calcReadTime = (item: MobileReaderItem) => {
    if (item.readTime) return item.readTime;
    const words = (item.excerpt || '').split(/\s+/).length;
    return `${Math.max(1, Math.ceil(words / 40))} min baca`;
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-slate-950 text-white flex flex-col h-[100dvh] w-full overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 1. TOP NAVIGATION MENU BAR (User never trapped) */}
      <div className="shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-cyan-950/60 px-4 py-3 flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-cyan-900/40"
          >
            <span>🏠</span>
            <span>Beranda</span>
          </Link>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">• {title}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-1 rounded-full">
            {currentIndex + 1} / {items.length}
          </span>
          <button
            onClick={onSwitchToGrid}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-lg transition-all"
            aria-label="Kembali ke Mode Grid"
          >
            <span>📰</span>
            <span>Mode Grid</span>
          </button>
        </div>
      </div>

      {/* 2. FLIPBOARD 3D SWIPE VIEWPORT */}
      <div className="flex-grow relative overflow-hidden flex items-center justify-center p-3 sm:p-4 pb-16 sm:pb-8" style={{ perspective: '1200px' }}>
        {currentItem && (
          <div
            key={currentItem.id}
            className={`w-full max-w-lg h-full max-h-[76dvh] sm:max-h-[82dvh] bg-slate-900 border border-cyan-900/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-500 ease-out transform ${
              isAnimating && direction === 'next'
                ? 'animate-slideUp3D'
                : isAnimating && direction === 'prev'
                ? 'animate-slideDown3D'
                : 'translate-y-0 rotate-0 opacity-100'
            }`}
            style={{
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(34, 211, 238, 0.1)',
            }}
          >
            {/* Dynamic Banner Header Section with 10 Daily Rotating Colors & High Contrast Black Text */}
            <div className={`relative w-full h-44 sm:h-56 ${activePreset.bg} shrink-0 overflow-hidden transition-colors duration-500`}>
              {currentItem.image ? (
                <SafeImage
                  src={currentItem.image}
                  alt={currentItem.title}
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                  fallback="https://placehold.co/600x400/020617/22d3ee?text=Meteorit"
                />
              ) : null}

              {/* Dynamic Header Overlay Text (Hitam Bold untuk kontras tinggi) */}
              <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <div className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-black shadow ${activePreset.badgeBg}`}>
                    {currentItem.category}
                  </div>
                  <div className="bg-slate-950/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                    👆 Swipe ke atas
                  </div>
                </div>

                <div className={`text-sm sm:text-base ${activePreset.text} line-clamp-2 leading-tight drop-shadow-sm`}>
                  {currentItem.title}
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between overflow-y-auto text-left">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span>⏱️ {calcReadTime(currentItem)}</span>
                  <span>•</span>
                  <span>📅 {currentItem.date}</span>
                </div>

                <h2 className="text-lg sm:text-2xl font-extrabold text-white mb-2 leading-snug line-clamp-2 sm:line-clamp-3 bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  {currentItem.title}
                </h2>

                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-4 font-normal mb-3">
                  {currentItem.excerpt}
                </p>
              </div>

              {/* Bottom Actions - Elevated for clear visibility on mobile */}
              <div className="pt-3 pb-1 border-t border-slate-800/80 flex items-center gap-3 shrink-0">
                {currentItem.link.startsWith('http') ? (
                  <a
                    href={currentItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold py-3 px-4 rounded-2xl text-center text-sm shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>📖</span>
                    <span>Baca Selengkapnya</span>
                  </a>
                ) : (
                  <Link
                    href={currentItem.link}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold py-3 px-4 rounded-2xl text-center text-sm shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>📖</span>
                    <span>Baca Selengkapnya</span>
                  </Link>
                )}

                <button
                  onClick={() => handleShare(currentItem)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold p-3 rounded-2xl border border-cyan-900/40 text-sm transition-all shrink-0 flex items-center justify-center gap-1"
                  aria-label="Bagikan Artikel"
                >
                  <span>🔗</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. FLOATING NAVIGATION CONTROLS (Right Edge Middle Vertical) */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
        <button
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg border shadow-xl transition-all ${
            currentIndex <= 0
              ? 'bg-slate-900/40 border-slate-800 text-gray-600 cursor-not-allowed opacity-50'
              : 'bg-slate-900/90 backdrop-blur border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950'
          }`}
          aria-label="Artikel Sebelumnya"
        >
          ⬆️
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex >= items.length - 1}
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg border shadow-xl transition-all ${
            currentIndex >= items.length - 1
              ? 'bg-slate-900/40 border-slate-800 text-gray-600 cursor-not-allowed opacity-50'
              : 'bg-amber-500 border-amber-400 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
          }`}
          aria-label="Artikel Berikutnya"
        >
          ⬇️
        </button>
      </div>

      {/* Toast Copy Notice */}
      {copiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-cyan-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold shadow-2xl animate-bounce">
          ✅ Link artikel berhasil disalin!
        </div>
      )}
    </div>
  );
}
