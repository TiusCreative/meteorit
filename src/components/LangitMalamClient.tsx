"use client";

import { useState, useEffect } from 'react';
import { useSiteLanguage } from '@/lib/useSiteLanguage';
import { landingText } from '@/lib/landingText';

const INDONESIAN_CITIES = [
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Semarang', lat: -6.9667, lon: 110.4167 },
  { name: 'Yogyakarta', lat: -7.7956, lon: 110.3695 },
  { name: 'Palembang', lat: -2.9909, lon: 104.7567 },
  { name: 'Surabaya', lat: -7.2575, lon: 112.7521 },
  { name: 'Bandung', lat: -6.9175, lon: 107.6191 },
  { name: 'Medan', lat: 3.5952, lon: 98.6722 },
  { name: 'Makassar', lat: -5.1477, lon: 119.4327 },
  { name: 'Denpasar (Bali)', lat: -8.6705, lon: 115.2126 },
  { name: 'Pontianak', lat: -0.0263, lon: 109.3425 },
  { name: 'Manado', lat: 1.4748, lon: 124.8421 },
  { name: 'Jayapura', lat: -2.5916, lon: 140.6690 },
  { name: 'Lombok', lat: -8.6529, lon: 116.3239 },
  { name: 'Balikpapan', lat: -1.2379, lon: 116.8529 },
  { name: 'Batam', lat: 1.1301, lon: 104.0529 },
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

export default function LangitMalamClient() {
  const language = useSiteLanguage();
  const t = landingText[language];

  const [selectedCity, setSelectedCity] = useState<{ name: string; lat: number; lon: number }>({ name: 'Jakarta', lat: -6.2088, lon: 106.8456 });
  const [useGps, setUseGps] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [showMap] = useState(true);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lon: number; name: string }>({ lat: -6.2088, lon: 106.8456, name: 'Jakarta' });
  const [stars, setStars] = useState<Star[]>([]);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualError, setManualError] = useState('');

  useEffect(() => {
    // Generate stars on client only to prevent SSR hydration mismatch
    const generatedStars = [...Array(50)].map(() => ({
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.7 + 0.1,
      duration: `${Math.random() * 4 + 2}s`,
      delay: `${Math.random() * 4}s`,
    }));
    setStars(generatedStars);
  }, []);

  const handleGps = () => {
    setGpsLoading(true);
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError(t.gpsNotSupported || 'Browser Anda tidak mendukung GPS.');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setGpsCoords(coords);
        setGpsLoading(false);
        setUseGps(true);
        setActiveCoords({ lat: coords.lat, lon: coords.lon, name: language === 'id' ? 'Lokasi Anda' : 'Your Location' });
      },
      () => {
        setGpsError(t.gpsErrorDenied || 'Akses GPS ditolak atau tidak tersedia. Pilih kota secara manual.');
        setGpsLoading(false);
      }
    );
  };

  const handleManualApply = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setManualError(t.latError || 'Latitude harus berupa angka antara -90 dan 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setManualError(t.lonError || 'Longitude harus berupa angka antara -180 dan 180.');
      return;
    }

    setUseGps(false);
    setGpsCoords(null);
    setSelectedCity({ name: '', lat: 0, lon: 0 }); // reset selected city
    setActiveCoords({ lat, lon, name: language === 'id' ? `Koordinat Manual (${lat.toFixed(2)}, ${lon.toFixed(2)})` : `Manual Coordinates (${lat.toFixed(2)}, ${lon.toFixed(2)})` });
  };

  // Stellarium Web embed URL
  const getStellariumUrl = (lat: number, lon: number) => {
    return `https://stellarium-web.org/skysource/current?lat=${lat}&lng=${lon}`;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 to-slate-950 z-0 langit-malam-bg-gradient" />
        <div className="absolute inset-0 bg-[url('/nebula.webp')] bg-cover bg-center opacity-20 z-0 langit-malam-nebula" />

        {/* Stars */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
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

        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-indigo-400">
            {t.starMapBadge || '🌠 Peta Bintang Interaktif'}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white langit-malam-title">
            {t.starMapTitle || 'Langit Malam'} <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Indonesia</span>
          </h1>
          <p className="text-gray-300 text-base max-w-xl mx-auto mb-8">
            {t.starMapSubtitle || 'Izinkan akses lokasi GPS atau pilih kota Anda untuk menggeser peta koordinat rasi bintang malam ini secara dinamis.'}
          </p>

          {/* Selector Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 max-w-lg mx-auto shadow-2xl">
            {/* GPS Button */}
            <button
              onClick={handleGps}
              disabled={gpsLoading}
              className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-sm mb-4 transition-all duration-300 ${
                useGps && gpsCoords
                  ? 'bg-green-600/20 border-2 border-green-500 text-green-400'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105'
              }`}
            >
              {gpsLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  {t.gpsDetecting || 'Mendeteksi Lokasi...'}
                </>
              ) : useGps && gpsCoords ? (
                <>✅ {t.gpsDetected || 'GPS Terdeteksi:'} {gpsCoords.lat.toFixed(2)}°, {gpsCoords.lon.toFixed(2)}°</>
              ) : (
                <>{t.useGpsBtn || '📍 Gunakan Lokasi GPS Saya'}</>
              )}
            </button>

            {gpsError && (
              <p className="text-red-400 text-xs text-center mb-4 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">{gpsError}</p>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-slate-700"></div>
              <span className="text-[10px] text-gray-500 font-semibold">{t.orSelectCity || 'ATAU PILIH KOTA'}</span>
              <div className="h-px flex-1 bg-slate-700"></div>
            </div>

            {/* City Selector */}
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto mb-4 pr-1">
              {INDONESIAN_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    const targetCity = { name: city.name, lat: city.lat, lon: city.lon };
                    setSelectedCity(targetCity);
                    setUseGps(false);
                    setGpsCoords(null);
                    setActiveCoords({ lat: city.lat, lon: city.lon, name: city.name });
                  }}
                  className={`text-center px-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                    selectedCity?.name === city.name && !useGps
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700/50 text-gray-300 hover:border-indigo-500/50 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-slate-700"></div>
              <span className="text-[10px] text-gray-500 font-semibold">{t.orManualInput || 'ATAU INPUT MANUAL'}</span>
              <div className="h-px flex-1 bg-slate-700"></div>
            </div>

            <form onSubmit={handleManualApply} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1 text-left uppercase">{t.latLabel || 'Latitude (Lintang)'}</label>
                  <input
                    type="text"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder={t.latPlaceholder || 'Contoh: -6.2088'}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/80 transition-colors text-left"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1 text-left uppercase">{t.lonLabel || 'Longitude (Bujur)'}</label>
                  <input
                    type="text"
                    value={manualLon}
                    onChange={(e) => setManualLon(e.target.value)}
                    placeholder={t.lonPlaceholder || 'Contoh: 106.8456'}
                    className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/80 transition-colors text-left"
                  />
                </div>
              </div>
              {manualError && (
                <p className="text-red-400 text-[10px] text-left">{manualError}</p>
              )}
              <button
                type="submit"
                className="w-full bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 font-bold py-2 px-4 rounded-xl text-xs transition-all duration-300"
              >
                {t.applyCoordsBtn || 'Terapkan Koordinat Kustom'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Stellarium Embed */}
      {showMap && activeCoords && (
        <div className="container mx-auto px-4 max-w-6xl pb-16">
          <div className="bg-slate-900/60 backdrop-blur border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌠</span>
                <div className="text-left">
                  <h2 className="font-bold text-white text-sm">{(t.nightSkyAt || 'Langit Malam di')} {activeCoords.name}</h2>
                  <p className="text-xs text-gray-500">
                    {activeCoords.lat.toFixed(4)}°, {activeCoords.lon.toFixed(4)}° •{' '}
                    {new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <a
                href={getStellariumUrl(activeCoords.lat, activeCoords.lon)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
              >
                {t.openFullScreen || 'Buka Layar Penuh ↗'}
              </a>
            </div>
            <div className="w-full" style={{ height: '70vh', minHeight: '500px' }}>
              <iframe
                key={`${activeCoords.lat}-${activeCoords.lon}`}
                src={getStellariumUrl(activeCoords.lat, activeCoords.lon)}
                title={`Peta bintang langit malam di ${activeCoords.name}`}
                className="w-full h-full border-0"
                allow="geolocation"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-gray-600">
                {t.starMapProvidedBy || 'Peta bintang disajikan oleh'}{' '}
                <a href="https://stellarium-web.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">Stellarium Web</a> — Planetarium Online Gratis
              </p>
              <p className="text-xs text-gray-600">
                {t.starMapInstructions || '🖱️ Klik & seret untuk memutar langit • Scroll untuk zoom'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="container mx-auto px-4 max-w-6xl pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '⭐', title: t.constellationTitle || 'Konstelasi Malam Ini', desc: t.constellationDesc || 'Identifikasi rasi bintang yang terlihat dari kota Anda malam ini berdasarkan posisi dan waktu real-time.' },
            { icon: '🌙', title: t.moonPhaseTitle || 'Fase Bulan', desc: t.moonPhaseDesc || 'Pantau fase bulan hari ini dan prediksi fase berikutnya untuk perencanaan observasi astronomi terbaik.' },
            { icon: '🔭', title: t.visiblePlanetsTitle || 'Planet yang Terlihat', desc: t.visiblePlanetsDesc || 'Ketahui planet mana yang bisa diamati dengan mata telanjang atau teleskop dari lokasi Anda malam ini.' },
          ].map((card) => (
            <div key={card.title} className="bg-slate-900/40 border border-slate-700/40 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 text-left">
              <span className="text-4xl block mb-4">{card.icon}</span>
              <h3 className="font-bold text-white mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
