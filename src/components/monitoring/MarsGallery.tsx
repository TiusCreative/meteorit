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

function PhotoCard({ photo }: { photo: MarsPhoto }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState(false);

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
              <p className="text-slate-600 text-xs">Foto tidak tersedia</p>
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
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <p className="text-white font-bold text-xs">Klik untuk perbesar</p>
          </div>
          {/* Camera badge */}
          <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm text-rose-400 text-xs font-bold px-2 py-0.5 rounded mono-font border border-rose-500/30">
            {photo.camera_abbrev}
          </div>
        </div>
        <div className="p-3">
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
              ✕ Tutup
            </button>
            <img
              src={photo.img_src}
              alt={photo.camera_name}
              className="w-full h-auto rounded-xl"
            />
            <div className="mt-3 flex justify-between text-xs mono-font text-slate-400">
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

export default function MarsGallery() {
  const [photos, setPhotos] = useState<MarsPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<string>('ALL');

  useEffect(() => {
    async function fetchMars() {
      try {
        setLoading(true);
        const res = await fetch(`/api/nasa/mars?t=${Date.now()}`);
        if (!res.ok) throw new Error('Gagal memuat foto Mars');
        const json = await res.json();
        setPhotos(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error tidak diketahui');
      } finally {
        setLoading(false);
      }
    }
    fetchMars();
  }, []);

  const cameras = ['ALL', ...Array.from(new Set(photos.map((p) => p.camera_abbrev)))];
  const filtered = selectedCamera === 'ALL' ? photos : photos.filter((p) => p.camera_abbrev === selectedCamera);

  const latestDate = photos[0]?.earth_date || '—';
  const latestSol = photos[0]?.sol || '—';

  return (
    <div>
      {/* Info banner */}
      <div className="dashboard-card p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="text-4xl float-anim">🔴</div>
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">Transmisi Terbaru dari Mars — Curiosity Rover</h2>
          <p className="text-slate-400 text-xs mt-1">
            Foto-foto di bawah ini adalah transmisi terbaru dari Curiosity yang mendarat di kawah Gale, Mars sejak 6 Agustus 2012.
            Data diperbarui setiap kali NASA merilis foto terbaru dari rover.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          <div className="text-center">
            <p className="text-2xl font-black mono-font text-rose-400">{loading ? '...' : photos.length}</p>
            <p className="text-xs text-slate-500">Foto Ditampilkan</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black mono-font text-amber-400">{loading ? '...' : latestSol}</p>
            <p className="text-xs text-slate-500">Sol Terbaru</p>
          </div>
        </div>
      </div>

      {/* Latest date */}
      {!loading && photos.length > 0 && (
        <p className="text-xs mono-font text-slate-500 mb-4">
          📅 Tanggal terbaru di Bumi: <span className="text-rose-400">{latestDate}</span>
        </p>
      )}

      {/* Camera filter */}
      {!loading && cameras.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
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
            <p className="text-slate-400 text-sm mono-font">Mengambil transmisi terbaru dari Mars...</p>
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
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Tidak ada foto dari kamera {selectedCamera}.</p>
            </div>
          )}
        </>
      )}

      {/* Camera legend */}
      {!loading && (
        <div className="dashboard-card p-4 mt-6">
          <p className="text-xs text-slate-400 font-semibold mb-3">📷 Kamera Curiosity Rover</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {[
              { abbr: 'FHAZ', name: 'Front Hazard Camera' },
              { abbr: 'RHAZ', name: 'Rear Hazard Camera' },
              { abbr: 'MAST', name: 'Mast Camera' },
              { abbr: 'CHEMCAM', name: 'Chemistry & Camera' },
              { abbr: 'MAHLI', name: 'Mars Hand Lens Imager' },
              { abbr: 'NAVCAM', name: 'Navigation Camera' },
            ].map((c) => (
              <div key={c.abbr} className="flex gap-2">
                <span className="text-rose-400 mono-font font-bold w-16">{c.abbr}</span>
                <span className="text-slate-500">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600 mt-4 text-right mono-font">
        Sumber: NASA Mars Rover Photos API • Curiosity Rover
      </p>
    </div>
  );
}
