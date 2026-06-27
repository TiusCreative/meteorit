"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
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
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-slate-900/80 to-slate-950 z-0" />

      {/* Background Nebula Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 z-0"
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
          Portal Antariksa Indonesia • Live Data NASA
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white via-cyan-200 to-amber-300 bg-clip-text text-transparent">
            Jelajahi Misteri
          </span>
          <br />
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Batu Langit & Meteorit
          </span>
          <br />
          <span className="text-white">di Indonesia</span>
        </h1>

        <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Pusat data astronomi, edukasi sains, dan forum komunitas. Diseminasi data antariksa interaktif berbasis edukasi digital untuk mendukung literasi sains nasional.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/ensiklopedia"
            className="group relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3.5 px-8 rounded-xl transition-all duration-300 text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
          >
            <span className="relative z-10">🪨 Mulai Jelajah Ensiklopedia</span>
          </Link>
          <Link
            href="/monitoring"
            className="group border-2 border-cyan-500/60 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 font-bold py-3.5 px-8 rounded-xl transition-all duration-300 text-lg backdrop-blur-sm hover:scale-105"
          >
            🚀 Live Space Mission
          </Link>
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
            <span>📢</span> Ikuti Saluran Telegram Resmi kami: t.me/meteoritindonesia →
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-gray-500 animate-bounce">
        <span className="text-xs">Scroll</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
