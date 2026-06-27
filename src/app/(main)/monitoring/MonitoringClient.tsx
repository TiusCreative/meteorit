'use client';

import { useEffect, useState } from 'react';
import NeoTracker from '@/components/monitoring/NeoTracker';
import FireballFeed from '@/components/monitoring/FireballFeed';
import SpaceWeather from '@/components/monitoring/SpaceWeather';
import MarsGallery from '@/components/monitoring/MarsGallery';
import EpicEarth from '@/components/monitoring/EpicEarth';

type TabId = 'neo' | 'fireball' | 'weather' | 'mars' | 'epic';

const tabs: { id: TabId; label: string; icon: string; color: string }[] = [
  { id: 'neo', label: 'Asteroid Tracker', icon: '🛸', color: 'cyan' },
  { id: 'fireball', label: 'Laporan Bola Api', icon: '🔥', color: 'orange' },
  { id: 'weather', label: 'Cuaca Antariksa', icon: '☀️', color: 'amber' },
  { id: 'mars', label: 'Galeri Mars', icon: '🪐', color: 'rose' },
  { id: 'epic', label: 'EPIC Bumi', icon: '🌎', color: 'emerald' },
];

export default function MonitoringClient() {
  const [activeTab, setActiveTab] = useState<TabId>('neo');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString('id-ID', {
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
  }, []);

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap');

        .monitoring-font { font-family: 'Outfit', sans-serif; }
        .mono-font { font-family: 'JetBrains Mono', monospace; }

        .dashboard-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(34, 211, 238, 0.12);
          border-radius: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dashboard-card:hover {
          border-color: rgba(34, 211, 238, 0.28);
          box-shadow: 0 8px 32px -8px rgba(34, 211, 238, 0.12);
          transform: translateY(-2px);
        }
        .hazard-card {
          background: rgba(30, 10, 10, 0.6);
          border-color: rgba(239, 68, 68, 0.25) !important;
        }
        .hazard-card:hover {
          border-color: rgba(239, 68, 68, 0.5) !important;
          box-shadow: 0 8px 32px -8px rgba(239, 68, 68, 0.2) !important;
        }
        .safe-card {
          border-color: rgba(34, 211, 238, 0.15) !important;
        }

        @keyframes orbit {
          from { transform: rotate(0deg) translateX(38px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(38px) rotate(-360deg); }
        }
        @keyframes orbitSlow {
          from { transform: rotate(0deg) translateX(55px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(55px) rotate(-360deg); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
        }
        @keyframes pulse-cyan {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(34,211,238,0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .orbit-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          margin: -4px 0 0 -4px;
        }
        .orbit-dot-1 { animation: orbit 4s linear infinite; background: #ef4444; }
        .orbit-dot-2 { animation: orbitSlow 7s linear infinite; background: #22d3ee; }
        .orbit-dot-2-safe { animation: orbitSlow 7s linear infinite; background: #22d3ee; }

        .beacon-red {
          animation: pulse-red 1.5s ease-in-out infinite;
        }
        .beacon-cyan {
          animation: pulse-cyan 2s ease-in-out infinite;
        }
        .float-anim {
          animation: float 3s ease-in-out infinite;
        }
        
        .tab-active-cyan { border-color: #22d3ee; color: #22d3ee; background: rgba(34,211,238,0.08); }
        .tab-active-orange { border-color: #fb923c; color: #fb923c; background: rgba(251,146,60,0.08); }
        .tab-active-amber { border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.08); }
        .tab-active-rose { border-color: #fb7185; color: #fb7185; background: rgba(251,113,133,0.08); }
        .tab-active-emerald { border-color: #34d399; color: #34d399; background: rgba(52,211,153,0.08); }
        
        .scanline-overlay {
          pointer-events: none;
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
          z-index: 0;
        }
      `}</style>

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 beacon-cyan" />
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Pusat Pemantauan Benda Langit
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 mono-font">
                  Data real-time dari NASA API & JPL • Terupdate setiap jam
                </p>
              </div>
              <div className="mono-font text-xs text-cyan-400/80 bg-cyan-950/30 border border-cyan-900/40 px-3 py-1.5 rounded-lg">
                🕐 {currentTime || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-2 mb-8">
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
            {activeTab === 'neo' && <NeoTracker />}
            {activeTab === 'fireball' && <FireballFeed />}
            {activeTab === 'weather' && <SpaceWeather />}
            {activeTab === 'mars' && <MarsGallery />}
            {activeTab === 'epic' && <EpicEarth />}
          </div>
        </div>

        {/* Footer note */}
        <div className="container mx-auto px-4 pb-8 text-center">
          <p className="text-xs text-slate-600 mono-font">
            Data bersumber dari{' '}
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
