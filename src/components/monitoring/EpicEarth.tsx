'use client';

import { useEffect, useState, useRef } from 'react';
import { EpicImage } from '@/app/api/nasa/epic/route';

import { monitoringDict } from '@/lib/monitoringTranslations';
import type { SiteLanguage } from '@/lib/i18n';

export default function EpicEarth({ language = 'id' }: { language?: SiteLanguage }) {
  const dict = monitoringDict[language] || monitoringDict.id;
  const [images, setImages] = useState<EpicImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(400); // ms per frame
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isId = language === 'id';
  const isMs = language === 'ms';
  const isZh = language === 'zh';
  const isJa = language === 'ja';

  useEffect(() => {
    async function fetchEpic() {
      try {
        setLoading(true);
        const res = await fetch('/api/nasa/epic');
        if (!res.ok) throw new Error(language === 'id' ? 'Gagal memuat foto EPIC' : 'Failed to load EPIC photos');
        const json = await res.json();
        
        if (json.success && json.data?.length > 0) {
          setImages(json.data);
        } else {
          throw new Error(json.error || (language === 'id' ? 'Tidak ada data foto Bumi terbaru' : 'No recent Earth photos available'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchEpic();
  }, [language]);

  // Handle Play/Pause Auto-rotation
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, images.length, playbackSpeed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm mono-font">
            {isId ? 'Menghubungkan ke satelit DSCOVR...' : isMs ? 'Menghubungkan ke satelit DSCOVR...' : isZh ? '正在连接到 DSCOVR 卫星...' : isJa ? 'DSCOVR衛星に接続中...' : 'Connecting to DSCOVR satellite...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-500/30 text-center py-12">
        <p className="text-red-400 text-sm">❌ {error}</p>
      </div>
    );
  }

  const current = images[currentIndex];
  if (!current) return null;

  // Calculate distance from J2000 positions
  const calculateDistance = (pos: { x: number; y: number; z: number }) => {
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    return dist.toLocaleString(dict.weekdayLocale || 'id-ID', { maximumFractionDigits: 0 }) + ' km';
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="dashboard-card p-5 flex flex-col md:flex-row md:items-center gap-4 text-left">
        <div className="text-4xl float-anim mx-auto md:mx-0">🌎</div>
        <div className="flex-grow flex-shrink">
          <h2 className="text-white font-bold text-lg">{dict.epicEarthPhoto}</h2>
          <p className="text-slate-405 dark:text-slate-400 text-xs mt-1 leading-relaxed">
            {isId 
              ? 'Melihat Bumi dari Titik Lagrange L1 (1.5 Juta Kilometer dari Bumi) menggunakan kamera EPIC milik NASA. Gunakan tombol putar untuk melihat visualisasi rotasi Bumi 24 jam terakhir.'
              : isMs
              ? 'Melihat Bumi daripada Titik Lagrange L1 (1.5 Juta Kilometer daripada Bumi) menggunakan kamera EPIC milik NASA. Gunakan butang putar untuk melihat visualisasi putaran Bumi 24 jam terakhir.'
              : isZh
              ? '使用 NASA 的 EPIC 相机从拉格朗日点 L1（距离地球150万公里）查看地球。使用播放按钮查看过去24小时地球自转的视觉效果。'
              : isJa
              ? 'NASAのEPICカメラを使用して、ラグランジュ点L1（地球から150万キロメートル離れた場所）から地球を監視します。再生ボタンを押すと、過去24日間の地球自転のアニメーションが表示されます。'
              : 'View Earth from Lagrange Point L1 (1.5 Million Kilometers from Earth) using NASA\'s EPIC camera. Use the play button to view rotation visualization of Earth over the last 24 hours.'}
          </p>
        </div>
        <div className="flex-shrink-0 text-right md:border-l md:border-cyan-900/30 md:pl-6 shrink-0 mx-auto md:mx-0">
          <p className="text-xs text-slate-500 uppercase tracking-widest mono-font">
            {isId ? 'Status Satelit' : isMs ? 'Status Satelit' : isZh ? '卫星状态' : isJa ? '衛星ステータス' : 'Satellite Status'}
          </p>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <p className="text-sm font-bold text-cyan-400 mono-font">ONLINE (L1)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Earth Visualizer */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center dashboard-card p-6 relative overflow-hidden">
          {/* Sci-Fi Overlay corner markings */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400/40" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400/40" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400/40" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400/40" />

          {/* Compass / Targeting Grid */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full border border-cyan-400/5 animate-pulse" />
            <div className="w-[420px] h-[420px] rounded-full border border-dashed border-cyan-400/5 rotate-45" />
            {/* Crosshairs */}
            <div className="absolute h-full w-[1px] bg-cyan-400/5" />
            <div className="absolute w-full h-[1px] bg-cyan-400/5" />
          </div>

          {/* Main Image Container */}
          <div className="relative w-80 h-80 md:w-[380px] md:h-[380px] rounded-full overflow-hidden border border-cyan-400/20 shadow-[0_0_50px_rgba(34,211,238,0.15)] bg-black">
            {/* Scanning Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent w-full h-1/2 opacity-25 animate-pulse" style={{ animationDuration: '3s' }} />
            
            <img
              src={current.image_url}
              alt="Bumi Full Disk"
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => {
                // Fallback to official non-API URL if NASA API key CDN is failing
                const datePart = current.date.split(' ')[0];
                const [year, month, day] = datePart.split('-');
                (e.target as HTMLImageElement).src = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${current.image}.png`;
              }}
            />

            {/* Earth Hologram UI tag */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="bg-slate-950/90 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded text-[10px] mono-font tracking-widest uppercase">
                LAT: {current.coords.centroid.lat.toFixed(4)}° / LON: {current.coords.centroid.lon.toFixed(4)}°
              </span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="w-full mt-6 space-y-4 text-left">
            {/* Timeline Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 mono-font">
                <span>{isId ? 'Frame' : isMs ? 'Frame' : isZh ? '帧' : isJa ? 'フレーム' : 'Frame'} {currentIndex + 1} {isId ? 'dari' : isMs ? 'daripada' : isZh ? '的' : isJa ? '/' : 'of'} {images.length}</span>
                <span>{current.date} UTC</span>
              </div>
              <div className="h-1 bg-slate-900 rounded-full overflow-hidden flex">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentIndex(idx);
                    }}
                    className={`flex-1 h-full transition-colors ${
                      idx === currentIndex ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Main Buttons */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
                  }}
                  className="px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-lg text-xs mono-font transition-all"
                  title="Frame Sebelumnya"
                >
                  ◀ BACK
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-5 py-1.5 border text-xs font-bold rounded-lg transition-all mono-font flex items-center gap-2 ${
                    isPlaying
                      ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/5'
                      : 'border-slate-700 hover:border-slate-500 text-slate-200'
                  }`}
                >
                  {isPlaying 
                    ? `⏸ ${isId ? 'PAUSE ROTASI' : isMs ? 'PAUSE ROTASI' : isZh ? '暂停旋转' : isJa ? '回転一時停止' : 'PAUSE ROTATION'}` 
                    : `▶ ${isId ? 'PUTAR ROTASI' : isMs ? 'PUTAR ROTASI' : isZh ? '播放旋转' : isJa ? '回転再生' : 'PLAY ROTATION'}`}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex((prev) => (prev + 1) % images.length);
                  }}
                  className="px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-lg text-xs mono-font transition-all"
                  title="Frame Selanjutnya"
                >
                  NEXT ▶
                </button>
              </div>

              {/* Playback speed selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                {[
                  { label: '1x', val: 700 },
                  { label: '2x', val: 400 },
                  { label: '3x', val: 200 },
                ].map((speed) => (
                  <button
                    key={speed.label}
                    onClick={() => setPlaybackSpeed(speed.val)}
                    className={`text-[10px] px-2 py-1 rounded font-bold mono-font transition-all ${
                      playbackSpeed === speed.val
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/20'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Telemetry Details */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 text-left">
          {/* Metadata Card */}
          <div className="dashboard-card p-5 space-y-4 flex-1">
            <div className="border-b border-cyan-900/30 pb-3 flex justify-between items-center">
              <span className="text-white font-bold text-sm tracking-wider">
                {isId ? '📡 TELEMETRI DSCOVR' : isMs ? '📡 TELEMETRI DSCOVR' : isZh ? '📡 DSCOVR 遥测' : isJa ? '📡 DSCOVR テレメトリ' : '📡 DSCOVR TELEMETRY'}
              </span>
              <span className="text-[10px] mono-font text-cyan-400/80 bg-cyan-950/30 border border-cyan-900/40 px-2 py-0.5 rounded max-w-[140px] truncate">
                EPIC: {current.identifier}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-slate-550 dark:text-slate-550 uppercase tracking-widest text-[10px]">
                  {isId ? 'Instrumen' : isMs ? 'Instrumen' : isZh ? '仪器' : isJa ? '測定機器' : 'Instrument'}
                </p>
                <p className="text-slate-200 font-bold mt-0.5">Earth Polychromatic Imaging Camera (EPIC)</p>
              </div>

              <div>
                <p className="text-slate-550 dark:text-slate-550 uppercase tracking-widest text-[10px]">
                  {isId ? 'Waktu Pengambilan Gambar' : isMs ? 'Masa Pengambilan Gambar' : isZh ? '拍摄时间' : isJa ? '撮影時刻' : 'Capture Time'}
                </p>
                <p className="text-slate-200 font-bold mt-0.5">{current.date} UTC</p>
              </div>

              <div>
                <p className="text-slate-550 dark:text-slate-550 uppercase tracking-widest text-[10px]">
                  {isId ? 'Keterangan Foto' : isMs ? 'Keterangan Foto' : isZh ? '图片说明' : isJa ? 'キャプション' : 'Caption'}
                </p>
                <p className="text-slate-350 dark:text-slate-300 mt-0.5 italic leading-relaxed">{current.caption}</p>
              </div>

              <div className="border-t border-cyan-900/10 pt-3">
                <p className="text-cyan-400 font-semibold mb-2">VEKTOR POSISI J2000 (Satelit vs Bumi)</p>
                <div className="grid grid-cols-3 gap-2 mono-font bg-slate-950/50 p-2 border border-slate-900 rounded-lg">
                  <div>
                    <span className="text-slate-500 text-[10px]">X-Axis</span>
                    <p className="text-slate-300 font-bold text-xs">{current.coords.dscovr_position.x.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Y-Axis</span>
                    <p className="text-slate-300 font-bold text-xs">{current.coords.dscovr_position.y.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Z-Axis</span>
                    <p className="text-slate-300 font-bold text-xs">{current.coords.dscovr_position.z.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-cyan-900/10 pt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-550 dark:text-slate-550 uppercase tracking-widest text-[10px]">
                    {isId ? 'Jarak ke Bumi' : isMs ? 'Jarak ke Bumi' : isZh ? '距地球距离' : isJa ? '地球までの距離' : 'Distance to Earth'}
                  </p>
                  <p className="text-cyan-400 font-bold text-sm mono-font mt-0.5">
                    {calculateDistance(current.coords.dscovr_position)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-550 dark:text-slate-550 uppercase tracking-widest text-[10px]">
                    {isId ? 'Jarak ke Bulan' : isMs ? 'Jarak ke Bulan' : isZh ? '距月球距离' : isJa ? '月までの距離' : 'Distance to Moon'}
                  </p>
                  <p className="text-amber-400 font-bold text-sm mono-font mt-0.5">
                    {calculateDistance(current.coords.lunar_position)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick info specs */}
          <div className="dashboard-card p-4 space-y-2">
            <h4 className="text-white font-bold text-xs">
              ℹ️ {isId ? 'Mengenai DSCOVR' : isMs ? 'Mengenai DSCOVR' : isZh ? '关于 DSCOVR' : isJa ? 'DSCOVRについて' : 'About DSCOVR'}
            </h4>
            <p className="text-slate-405 dark:text-slate-450 text-[11px] leading-relaxed">
              {isId 
                ? 'Deep Space Climate Observatory (DSCOVR) adalah satelit cuaca antariksa Amerika Serikat yang diluncurkan pada 11 Februari 2015. Satelit ini terus memantau angin matahari dan memberikan visualisasi bumi secara real-time.'
                : isMs
                ? 'Deep Space Climate Observatory (DSCOVR) ialah satelit cuaca angkasa lepas Amerika Syarikat yang dilancarkan pada 11 Februari 2015. Satelit ini terus memantau angin suria dan memberikan visualisasi bumi secara masa nyata.'
                : isZh
                ? '深空气候观测台 (DSCOVR) 是美国于 2015 年 2 月 11 日发射的空间天气卫星。该卫星持续监测太阳风并提供地球的实时可视化。'
                : isJa
                ? '深宇宙気候観測衛星 (DSCOVR) は、2015年2月11日に打ち上げられたアメリカの宇宙天気観測衛星です。太陽風を継続的に観測し、リアルタイムの地球画像を配信しています。'
                : 'The Deep Space Climate Observatory (DSCOVR) is a space weather satellite launched on February 11, 2015. It constantly monitors solar wind and provides real-time Earth imaging.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
