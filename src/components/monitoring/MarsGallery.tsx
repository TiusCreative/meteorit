'use client';

import { useEffect, useState } from 'react';

interface MarsPhoto {
  id: number;
  sol: number;
  earth_date: string;
  img_src: string;
  camera_name: string;
  camera_abbrev: string;
  rover_name: string;
}

import { monitoringDict } from '@/lib/monitoringTranslations';
import type { SiteLanguage } from '@/lib/i18n';

function PhotoCard({ photo, language }: { photo: MarsPhoto; language: SiteLanguage }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  
  const isId = language === 'id';
  const isMs = language === 'ms';
  const isZh = language === 'zh';
  const isJa = language === 'ja';

  return (
    <>
      <div
        className="dashboard-card overflow-hidden group cursor-pointer"
        onClick={() => setZoomed(true)}
      >
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
          {!loaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
            </div>
          )}
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <p className="text-slate-650 text-xs">
                {isId ? 'Foto tidak tersedia' : isMs ? 'Foto tidak tersedia' : isZh ? '照片不可用' : isJa ? '写真はありません' : 'Photo unavailable'}
              </p>
            </div>
          ) : (
            <img
              src={photo.img_src}
              alt={`Mars Curiosity - ${photo.camera_name}`}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
              onError={() => { setError(true); setLoaded(true); }}
            />
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-left">
            <p className="text-white font-bold text-xs">
              {isId ? 'Klik untuk perbesar' : isMs ? 'Klik untuk perbesar' : isZh ? '点击放大' : isJa ? 'クリックして拡大' : 'Click to enlarge'}
            </p>
          </div>
          {/* Camera badge */}
          <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm text-rose-400 text-xs font-bold px-2 py-0.5 rounded mono-font border border-rose-500/30">
            {photo.camera_abbrev}
          </div>
        </div>
        <div className="p-3 text-left">
          <p className="text-white text-xs font-semibold truncate">{photo.camera_name}</p>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-slate-500 mono-font">Sol {photo.sol}</p>
            <p className="text-xs text-slate-500 mono-font">{photo.earth_date}</p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {zoomed && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setZoomed(false)}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white text-sm font-bold"
            >
              ✕ {isId ? 'Tutup' : isMs ? 'Tutup' : isZh ? '关闭' : isJa ? '閉じる' : 'Close'}
            </button>
            <img
              src={photo.img_src}
              alt={photo.camera_name}
              className="w-full h-auto rounded-xl"
            />
            <div className="mt-3 flex justify-between text-xs mono-font text-slate-400 text-left flex-wrap gap-2">
              <span>📷 {photo.camera_name}</span>
              <span>📅 {photo.earth_date} (Sol {photo.sol})</span>
              <span>🔴 {photo.rover_name}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MarsGallery({ language = 'id' }: { language?: SiteLanguage }) {
  const dict = monitoringDict[language] || monitoringDict.id;
  const [photos, setPhotos] = useState<MarsPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<string>('ALL');

  useEffect(() => {
    async function fetchMars() {
      try {
        setLoading(true);
        const res = await fetch(`/api/nasa/mars?t=${Date.now()}`);
        if (!res.ok) throw new Error(language === 'id' ? 'Gagal memuat foto Mars' : 'Failed to load Mars photos');
        const json = await res.json();
        setPhotos(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchMars();
  }, [language]);

  const cameras = ['ALL', ...Array.from(new Set(photos.map((p) => p.camera_abbrev)))];
  const filtered = selectedCamera === 'ALL' ? photos : photos.filter((p) => p.camera_abbrev === selectedCamera);

  const latestDate = photos[0]?.earth_date || '—';
  const latestSol = photos[0]?.sol || '—';

  return (
    <div>
      {/* Info banner */}
      <div className="dashboard-card p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4 text-left">
        <div className="text-4xl float-anim mx-auto md:mx-0">🔴</div>
        <div className="flex-grow flex-shrink">
          <h2 className="text-white font-bold text-lg">
            {language === 'id' ? 'Transmisi Terbaru dari Mars — Curiosity Rover' : language === 'ms' ? 'Transmisi Terkini dari Mars — Curiosity Rover' : language === 'zh' ? '来自火星的最新传输 — 好奇号火星车' : language === 'ja' ? '火星からの最新送信 — キュリオシティ・ローバー' : 'Latest Transmission from Mars — Curiosity Rover'}
          </h2>
          <p className="text-slate-405 dark:text-slate-400 text-xs mt-1 leading-relaxed">
            {language === 'id' 
              ? 'Foto-foto di bawah ini adalah transmisi terbaru dari Curiosity yang mendarat di kawah Gale, Mars sejak 6 Agustus 2012. Data diperbarui setiap kali NASA merilis foto terbaru.'
              : language === 'ms'
              ? 'Foto-foto di bawah adalah transmisi terkini daripada Curiosity yang mendarat di kawah Gale, Mars sejak 6 Ogos 2012. Data dikemas kini setiap kali NASA mengeluarkan foto baharu.'
              : language === 'zh'
              ? '以下照片是好奇号自2012年8月6日降落在火星盖尔陨石坑以来的最新传输。每当美国国家航空航天局（NASA）发布新照片时，数据就会更新。'
              : language === 'ja'
              ? '以下の写真は、2012年8月6日に火星のゲールクレーターに着陸したキュリオシティからの最新の送信データです。NASAが新しい写真を公開するたびにデータが更新されます。'
              : 'The photos below are the latest transmissions from Curiosity, which landed in Gale Crater, Mars on August 6, 2012. Data updates whenever NASA releases new photos.'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-shrink-0 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-black mono-font text-rose-400">{loading ? '...' : photos.length}</p>
            <p className="text-xs text-slate-550 dark:text-slate-500">
              {language === 'id' ? 'Foto Ditampilkan' : language === 'ms' ? 'Foto Dipaparkan' : language === 'zh' ? '显示的照片' : language === 'ja' ? '写真表示数' : 'Photos Shown'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black mono-font text-amber-400">{loading ? '...' : latestSol}</p>
            <p className="text-xs text-slate-550 dark:text-slate-500">
              {language === 'id' ? 'Sol Terbaru' : language === 'ms' ? 'Sol Terkini' : language === 'zh' ? '最新太阳日' : language === 'ja' ? '最新Sol' : 'Latest Sol'}
            </p>
          </div>
        </div>
      </div>

      {/* Latest date */}
      {!loading && photos.length > 0 && (
        <p className="text-xs mono-font text-slate-500 mb-4 text-left">
          📅 {language === 'id' ? 'Tanggal terbaru di Bumi' : language === 'ms' ? 'Tarikh terkini di Bumi' : language === 'zh' ? '地球上的最新日期' : language === 'ja' ? '地球上の最新日付' : 'Latest date on Earth'}: <span className="text-rose-400">{latestDate}</span>
        </p>
      )}

      {/* Camera filter */}
      {!loading && cameras.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5 justify-start">
          {cameras.map((cam) => (
            <button
              key={cam}
              onClick={() => setSelectedCamera(cam)}
              className={`text-xs px-3 py-1 rounded-lg border transition-colors mono-font ${
                selectedCamera === cam
                  ? 'border-rose-400 text-rose-400 bg-rose-400/10'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {cam}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm mono-font">{dict.loadingMars}</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl border border-red-500/30 text-center py-12">
          <p className="text-red-400 text-sm">❌ {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} language={language} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">{dict.noMarsPhotos}</p>
            </div>
          )}
        </>
      )}

      {/* Camera legend */}
      {!loading && (
        <div className="dashboard-card p-4 mt-6 text-left">
          <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mb-3">
            📷 {language === 'id' ? 'Kamera Curiosity Rover' : language === 'ms' ? 'Kamera Curiosity Rover' : language === 'zh' ? '好奇号相机列表' : language === 'ja' ? 'キュリオシティ・カメラ一覧' : 'Curiosity Rover Cameras'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {[
              { abbr: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
              { abbr: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
              { abbr: 'MAST', name: 'Mast Camera' },
              { abbr: 'CHEMCAM', name: 'Chemistry and Camera Complex' },
              { abbr: 'MAHLI', name: 'Mars Hand Lens Imager' },
              { abbr: 'NAVCAM', name: 'Navigation Camera' },
            ].map((c) => (
              <div key={c.abbr} className="flex gap-2">
                <span className="text-rose-400 mono-font font-bold w-16 shrink-0">{c.abbr}</span>
                <span className="text-slate-550 dark:text-slate-500">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-650 mt-4 text-right mono-font">
        Sumber: NASA Mars Rover Photos API • Curiosity Rover
      </p>
    </div>
  );
}
