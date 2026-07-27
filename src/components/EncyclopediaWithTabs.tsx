"use client";

import { useState } from 'react';
import EncyclopediaListClient from '@/components/EncyclopediaListClient';
import NeoWsSection from '@/components/NeoWsSection';

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
  translations?: Record<string, any>;
}

interface EncyclopediaWithTabsProps {
  initialMeteorites: Meteorite[];
}

export default function EncyclopediaWithTabs({ initialMeteorites }: EncyclopediaWithTabsProps) {
  const [activeTab, setActiveTab] = useState<'meteorit' | 'komet'>('meteorit');

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Katalog Meteorit &amp; Komet
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Jelajahi data fisik meteorit dan pantau objek luar angkasa yang melintas dekat Bumi minggu ini.
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="bg-slate-900/70 backdrop-blur border border-slate-700/50 p-1.5 rounded-2xl flex gap-1">
              <button
                id="tab-meteorit"
                onClick={() => setActiveTab('meteorit')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'meteorit'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                🪨 Jenis Meteorit
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'meteorit' ? 'bg-black/20 text-black' : 'bg-slate-700 text-gray-400'
                }`}>
                  {initialMeteorites.length}
                </span>
              </button>
              <button
                id="tab-komet"
                onClick={() => setActiveTab('komet')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'komet'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                ☄️ Komet &amp; Asteroid Melintas
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === 'komet' ? 'bg-white/20 text-white' : 'bg-slate-700 text-gray-400'
                }`}>
                  Live
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'meteorit' ? (
            <EncyclopediaListClient initialMeteorites={initialMeteorites} />
          ) : (
            <NeoWsSection />
          )}
        </div>
      </div>
    </main>
  );
}

