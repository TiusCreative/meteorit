import type { Metadata } from 'next';
import EpicEarth from '@/components/monitoring/EpicEarth';

export const revalidate = 7200; // Cache for 2 hours

export const metadata: Metadata = {
  title: 'Monitor Satelit EPIC NASA | Bumi Real-Time | Meteorit Indonesia',
  description: 'Lihat visualisasi dan rotasi foto Bumi utuh (full-disk) secara real-time dari kamera EPIC di satelit DSCOVR NASA. Pantau koordinat centroid, jarak satelit, dan telemetri ruang angkasa.',
  keywords: ['epic nasa', 'dscovr', 'foto bumi live', 'earth real-time', 'satelit nasa', 'pemantauan bumi', 'luar angkasa', 'meteorit indonesia'],
  openGraph: {
    title: 'Monitor Satelit EPIC NASA — Bumi Real-Time',
    description: 'Visualisasi dan rotasi Bumi utuh secara real-time dari kamera EPIC satelit DSCOVR NASA.',
    type: 'website',
  },
};

export default function MonitoringEpicPage() {
  return (
    <>
      {/* Inject styles yang dibutuhkan EpicEarth (dashboard-card, float-anim, mono-font) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');

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

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .float-anim {
          animation: float 3s ease-in-out infinite;
        }
      ` }} />

      <div className="min-h-screen bg-slate-950 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">
              <a href="/" className="hover:text-cyan-400 transition-colors">Beranda</a>
              <span>›</span>
              <span className="text-cyan-400">Monitor EPIC NASA</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-flex" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">LIVE STREAM</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              🌍 Monitor Satelit EPIC NASA
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Visualisasi Bumi full-disk secara real-time dari satelit DSCOVR di titik Lagrange L1, 
              sejauh 1,5 juta kilometer dari Bumi.
            </p>
          </div>

          {/* Main Component */}
          <EpicEarth />

          {/* Footer Credit */}
          <div className="mt-12 pt-6 border-t border-slate-800/60 text-center">
            <p className="text-xs text-slate-500 tracking-wide inline-block bg-slate-900/40 px-5 py-2.5 rounded-full border border-slate-800">
              🌌 Sumber data dan gambar:{' '}
              <a
                href="https://epic.gsfc.nasa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-500 hover:text-cyan-400 hover:underline"
              >
                NASA Earth Polychromatic Imaging Camera (EPIC)
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
