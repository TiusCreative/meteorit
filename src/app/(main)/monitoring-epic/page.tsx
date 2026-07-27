import type { Metadata } from 'next';
import EpicEarth from '@/components/monitoring/EpicEarth';
import { cookies } from 'next/headers';
import { isSiteLanguage, LANGUAGE_COOKIE_KEY, defaultLanguage, type SiteLanguage } from '@/lib/i18n';
import { landingText } from '@/lib/landingText';

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
  const cookieStore = cookies();
  const locale = cookieStore.get(LANGUAGE_COOKIE_KEY)?.value;
  const language = isSiteLanguage(locale || null) ? (locale as SiteLanguage) : defaultLanguage;
  const t = landingText[language];

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-white py-12 monitoring-epic-container">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Header */}
          <div className="mb-8 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">
              <a href="/" className="hover:text-cyan-400 transition-colors">
                {language === 'id' ? 'Beranda' : language === 'ms' ? 'Laman Utama' : language === 'zh' ? '首页' : language === 'ja' ? 'ホーム' : 'Home'}
              </a>
              <span>›</span>
              <span className="text-cyan-400">Monitor EPIC NASA</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-flex" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">LIVE STREAM</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              🌍 {language === 'id' ? 'Monitor Satelit EPIC NASA' : language === 'ms' ? 'Monitor Satelit EPIC NASA' : language === 'zh' ? 'NASA EPIC 卫星监测' : language === 'ja' ? 'NASA EPIC衛星モニター' : 'NASA EPIC Satellite Monitor'}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              {language === 'id' 
                ? 'Visualisasi Bumi full-disk secara real-time dari satelit DSCOVR di titik Lagrange L1, sejauh 1,5 juta kilometer dari Bumi.'
                : language === 'ms'
                ? 'Visualisasi Bumi full-disk secara masa nyata daripada satelit DSCOVR di titik Lagrange L1, sejauh 1.5 juta kilometer daripada Bumi.'
                : language === 'zh'
                ? '来自位于拉格朗日点 L1、距离地球150万公里的 DSCOVR 卫星的实时全盘地球可视化。'
                : language === 'ja'
                ? '地球から150万キロメートル離れたラグランジュ点L1にあるDSCOVR衛星からのリアルタイムのフルディスク地球画像。'
                : 'Real-time full-disk Earth visualization from the DSCOVR satellite at Lagrange Point L1, 1.5 million kilometers from Earth.'}
            </p>
          </div>

          {/* Main Component */}
          <EpicEarth language={language} />

          {/* Footer Credit */}
          <div className="mt-12 pt-6 border-t border-slate-800/60 text-center">
            <p className="text-xs text-slate-500 tracking-wide inline-block bg-slate-900/40 px-5 py-2.5 rounded-full border border-slate-800">
              🌌 {language === 'id' ? 'Sumber data dan gambar' : language === 'ms' ? 'Sumber data dan gambar' : language === 'zh' ? '数据与图片来源' : language === 'ja' ? 'データと画像のソース' : 'Data and image source'}:{' '}
              <a
                href="https://epic.gsfc.nasa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-500 hover:text-cyan-400 hover:underline font-bold"
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
