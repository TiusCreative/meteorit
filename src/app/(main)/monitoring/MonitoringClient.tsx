'use client';

import { useEffect, useState, useMemo } from 'react';
import NeoTracker from '@/components/monitoring/NeoTracker';
import FireballFeed from '@/components/monitoring/FireballFeed';
import SpaceWeather from '@/components/monitoring/SpaceWeather';
import MarsGallery from '@/components/monitoring/MarsGallery';
import EpicEarth from '@/components/monitoring/EpicEarth';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { monitoringDict } from '@/lib/monitoringTranslations';

type TabId = 'neo' | 'fireball' | 'weather' | 'mars' | 'epic';

export default function MonitoringClient() {
  const language = useSiteLanguage();
  const dict = useMemo(() => monitoringDict[language] || monitoringDict.id, [language]);

  const tabs: { id: TabId; label: string; icon: string; color: string }[] = useMemo(() => [
    { id: 'neo', label: dict.tabNeo, icon: '🛸', color: 'cyan' },
    { id: 'fireball', label: dict.tabFireball, icon: '🔥', color: 'orange' },
    { id: 'weather', label: dict.tabWeather, icon: '☀️', color: 'amber' },
    { id: 'mars', label: dict.tabMars, icon: '🪐', color: 'rose' },
    { id: 'epic', label: dict.tabEpic, icon: '🌎', color: 'emerald' },
  ], [dict]);

  const [activeTab, setActiveTab] = useState<TabId>('neo');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString(dict.weekdayLocale || 'id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta',
          timeZoneName: 'short',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [dict.weekdayLocale]);

  const tabColorMap: Record<string, string> = {
    cyan: 'border-cyan-400 text-cyan-400 bg-cyan-400/10',
    orange: 'border-orange-400 text-orange-400 bg-orange-400/10',
    amber: 'border-amber-400 text-amber-400 bg-amber-400/10',
    rose: 'border-rose-400 text-rose-400 bg-rose-400/10',
    emerald: 'border-emerald-400 text-emerald-400 bg-emerald-400/10',
  };

  const activeColor = tabs.find((t) => t.id === activeTab)?.color || 'cyan';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Scanline overlay for sci-fi effect */}
      <div className="scanline-overlay" aria-hidden="true" />

      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 monitoring-font">
        {/* Header */}
        <div className="border-b border-cyan-900/30 bg-slate-950/80 backdrop-blur-xl sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 beacon-cyan" />
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {dict.title}
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 mono-font">
                  {dict.subtitle}
                </p>
              </div>
              <div className="mono-font text-xs text-cyan-400/80 bg-cyan-950/30 border border-cyan-900/40 px-3 py-1.5 rounded-lg w-fit">
                🕐 {currentTime || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-2 mb-8 justify-start">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? `tab-active-${tab.color}`
                      : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div key={activeTab} className="animate-in fade-in duration-300">
            {activeTab === 'neo' && <NeoTracker language={language} />}
            {activeTab === 'fireball' && <FireballFeed language={language} />}
            {activeTab === 'weather' && <SpaceWeather language={language} />}
            {activeTab === 'mars' && <MarsGallery language={language} />}
            {activeTab === 'epic' && <EpicEarth language={language} />}
          </div>
        </div>

        {/* Footer note */}
        <div className="container mx-auto px-4 pb-8 text-center">
          <p className="text-xs text-slate-600 mono-font">
            {dict.datasource}{' '}
            <a href="https://api.nasa.gov" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors">
              NASA Open APIs
            </a>{' '}
            &{' '}
            <a href="https://ssd-api.jpl.nasa.gov" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors">
              JPL Solar System Dynamics API
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
