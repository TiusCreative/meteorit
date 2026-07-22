"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dictionary, defaultLanguage, isSiteLanguage, LANGUAGE_COOKIE_KEY, LANGUAGE_STORAGE_KEY, SiteLanguage } from '@/lib/i18n';

interface TickerItem {
  text: string;
  href: string;
}

const DEFAULT_TICKER_ITEMS: TickerItem[] = [
  { text: '📊 STATUS HARI INI: Ada 7 manusia di luar angkasa', href: '/monitoring' },
  { text: '🛰️ Satelit ISS sedang mengorbit Bumi setiap 90 menit', href: '/monitoring' },
  { text: '🪨 NASA memantau ribuan objek dekat Bumi (NEO) setiap harinya', href: '/ensiklopedia' },
  { text: '🌌 APOD NASA diperbarui setiap hari dengan foto antariksa terbaik', href: '/apod' },
  { text: '🚀 SpaceX, NASA, dan ISRO aktif meluncurkan misi antariksa', href: '/monitoring' },
];

interface Star {
  width: string;
  height: string;
  top: string;
  left: string;
  opacity: number;
  duration: string;
  delay: string;
}

export default function HeroSection() {
  const [tickerData, setTickerData] = useState<TickerItem[]>(DEFAULT_TICKER_ITEMS);
  const [currentTicker, setCurrentTicker] = useState(0);
  const [fade, setFade] = useState(true);
  const [stars, setStars] = useState<Star[]>([]);
  const [language, setLanguage] = useState<SiteLanguage>(defaultLanguage);
  const t = dictionary[language];

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSiteLanguage(storedLanguage)) {
      setLanguage(storedLanguage);
    } else {
      const cookieLocale = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${LANGUAGE_COOKIE_KEY}=`))
        ?.split('=')[1];
      if (isSiteLanguage(cookieLocale || null)) {
        setLanguage(cookieLocale as SiteLanguage);
      }
    }
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<SiteLanguage>).detail;
      if (isSiteLanguage(nextLanguage)) {
        setLanguage(nextLanguage);
      }
    };
    window.addEventListener('meteorit-language-change', handleLanguageChange);

    // Generate stars on client only to prevent SSR hydration mismatch
    const generatedStars = [...Array(30)].map(() => ({
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.6 + 0.2,
      duration: `${Math.random() * 3 + 2}s`,
      delay: `${Math.random() * 3}s`,
    }));
    setStars(generatedStars);

    // Fetch live data via API internal supaya browser tidak langsung memanggil Open Notify.
    const fetchLiveData = async () => {
      try {
        const res = await fetch('/api/space/live', { cache: 'no-store' });
        if (!res.ok) throw new Error('Live data belum tersedia.');
        const data = await res.json();
        const astronotCount = data.astronautCount || 7;
        let issLat = '';
        let issLon = '';

        if (data.iss) {
          issLat = Number(data.iss.latitude || 0).toFixed(2);
          issLon = Number(data.iss.longitude || 0).toFixed(2);
        }

        const liveItems = [
          { text: `📊 STATUS HARI INI: Ada ${astronotCount} manusia di luar angkasa saat ini`, href: '/monitoring' },
          {
            text: issLat && issLon
              ? `🛰️ ISS sedang berada di koordinat ${issLat}°, ${issLon}°`
              : '🛰️ Stasiun Luar Angkasa ISS mengorbit Bumi pada ketinggian ±408 km',
            href: '/monitoring',
          },
          { text: '🪨 NASA memantau ribuan objek dekat Bumi (NEO) setiap harinya', href: '/ensiklopedia' },
          { text: '🌌 APOD NASA diperbarui setiap hari dengan foto antariksa terpilih', href: '/apod' },
          { text: '🚀 SpaceX, NASA & ISRO aktif meluncurkan misi antariksa baru', href: '/monitoring' },
        ];
        setTickerData(liveItems);
      } catch {
        // Gunakan data default jika fetch gagal
      }
    };

    fetchLiveData();

    return () => {
      window.removeEventListener('meteorit-language-change', handleLanguageChange);
    };
  }, []);

  // Rotasi ticker setiap 4 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTicker((prev) => (prev + 1) % tickerData.length);
        setFade(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, [tickerData.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-slate-900/80 to-slate-950 z-0 hero-bg-gradient" />

      {/* Background Nebula Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 z-0 hero-nebula"
        style={{ backgroundImage: "url('/nebula.webp')" }}
      />

      {/* Animated stars overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: star.width,
              height: star.height,
              top: star.top,
              left: star.left,
              opacity: star.opacity,
              animationDuration: star.duration,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-cyan-400 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
          {t.heroBadge}
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white via-cyan-200 to-amber-300 bg-clip-text text-transparent hero-title-1">
            {t.heroTitle1}
          </span>
          <br />
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent hero-title-2">
            {t.heroTitle2}
          </span>
          <br />
          <span className="text-white hero-title-3">{t.heroTitle3}</span>
        </h1>

        <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-2xl mx-auto leading-relaxed hero-desc">
          {t.heroDescription}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Link
            href="/ensiklopedia"
            className="group relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3.5 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
          >
            <span className="relative z-10">{t.heroCtaExplore}</span>
          </Link>
          <Link
            href="/monitoring"
            className="group border-2 border-cyan-500/60 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 font-bold py-3.5 px-8 rounded-xl transition-all duration-300 text-lg backdrop-blur-sm hover:scale-105"
          >
            {t.heroCtaMission}
          </Link>
        </div>

        {/* Quick Access Buttons — Cuaca, Mini App & Podcast */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Link
            href="/cuaca"
            className="group flex items-center gap-2 bg-slate-800/60 hover:bg-sky-500/15 border border-sky-500/30 hover:border-sky-400/60 text-sky-300 hover:text-sky-200 font-semibold py-2.5 px-5 rounded-xl transition-all duration-300 text-sm backdrop-blur-sm hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <span>Cuaca</span>
            <svg className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/miniapp"
            className="group flex items-center gap-2 bg-slate-800/60 hover:bg-violet-500/15 border border-violet-500/30 hover:border-violet-400/60 text-violet-300 hover:text-violet-200 font-semibold py-2.5 px-5 rounded-xl transition-all duration-300 text-sm backdrop-blur-sm hover:scale-105 hover:shadow-lg hover:shadow-violet-500/20"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Mini App</span>
            <svg className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href="https://open.spotify.com/show/033TS5YqepN9kNXRguuLZf"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 bg-slate-800/60 hover:bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300 hover:text-emerald-200 font-semibold py-2.5 px-5 rounded-xl transition-all duration-300 text-sm backdrop-blur-sm hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.436-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.812-.87 7.076-.505 9.712 1.107.294.18.386.563.207.864zm1.218-2.72c-.227.367-.707.487-1.074.26-2.684-1.65-6.785-2.13-9.97-1.163-.414.125-.85-.11-.975-.524-.124-.413.11-.85.524-.975 3.637-1.103 8.156-.566 11.236 1.33.367.226.487.707.26 1.072zm.078-2.82c-3.218-1.91-8.524-2.09-11.608-1.154-.493.15-1.013-.13-1.163-.623-.15-.494.13-1.014.623-1.164 3.56-1.103 9.426-.87 13.14 2.227.444.265.59.833.325 1.277-.265.444-.833.59-1.277.325z"/>
            </svg>
            <span>Podcast</span>
            <svg className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Mikro-Data Ticker */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-cyan-500/40"></div>
          <Link
            href={tickerData[currentTicker]?.href || '#'}
            className="bg-slate-900/70 hover:bg-slate-800/85 hover:border-cyan-400/40 border border-cyan-500/20 rounded-full px-5 py-2 text-xs md:text-sm text-cyan-300 font-medium min-w-0 max-w-xl block transition-all duration-300 hover:scale-105 cursor-pointer backdrop-blur-md"
            style={{ transition: 'opacity 0.4s ease', opacity: fade ? 1 : 0 }}
          >
            {tickerData[currentTicker]?.text}
          </Link>
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-cyan-500/40"></div>
        </div>

        {/* Ticker dots */}
        <div className="flex justify-center gap-1.5 mb-8">
          {tickerData.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentTicker(i); setFade(true); }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === currentTicker ? 'bg-cyan-400 w-4' : 'bg-slate-600 hover:bg-slate-500'
              }`}
              aria-label={`Ticker item ${i + 1}`}
            />
          ))}
        </div>

        {/* Telegram Link */}
        <div className="flex justify-center">
          <a
            href="https://t.me/meteoritindonesia"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900/80 backdrop-blur border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-slate-800/80 py-2 px-6 rounded-full transition-all duration-300 text-xs md:text-sm font-bold text-cyan-300 flex items-center gap-2 hover:scale-105"
          >
            {t.heroTelegram}
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-gray-500 animate-bounce">
        <span className="text-xs">{t.scroll}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
