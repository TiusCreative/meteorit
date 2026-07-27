"use client";

import { useEffect, useRef, useState } from 'react';

interface ISSMapProps {
  position: { latitude: number; longitude: number; timestamp: number };
  history: [number, number][];
}

// NOTE: Leaflet CSS di-import global di src/app/globals.css
// Jangan import di sini untuk menghindari duplikasi dan konflik Next.js App Router

export default function ISSMap({ position, history }: ISSMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const pathRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const isValidPosition =
    Number.isFinite(position.latitude) && Number.isFinite(position.longitude);

  // ── Inisialisasi Leaflet saat mount ──────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !isValidPosition) return;

    // Dynamic import Leaflet supaya tidak di-bundle saat SSR
    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        const map = L.default.map(mapContainerRef.current, {
          center: [position.latitude, position.longitude],
          zoom: 3,
          minZoom: 1,
          maxZoom: 10,
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
        });

        // Primary tiles: CARTO Voyager (sangat cerah seperti logo putih & biru awan)
        const cartoVoyager = L.default.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          { maxZoom: 20, subdomains: 'abcd', attribution: '&copy; CARTO' }
        );

        // Fallback tiles: OpenStreetMap
        const osmFallback = L.default.tileLayer(
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          { maxZoom: 19, attribution: '&copy; OpenStreetMap' }
        );

        cartoVoyager.addTo(map);
        cartoVoyager.on('tileerror', () => {
          if (mapRef.current && !mapRef.current._usingFallback) {
            mapRef.current._usingFallback = true;
            cartoVoyager.remove();
            osmFallback.addTo(mapRef.current);
          }
        });

        // Custom animated satellite marker
        const satelliteIcon = L.default.divIcon({
          html: `
            <div style="
              width: 32px; height: 32px;
              display: flex; align-items: center; justify-content: center;
              background: rgba(34,211,238,0.15);
              border: 1.5px solid #22d3ee;
              border-radius: 50%;
              box-shadow: 0 0 14px rgba(34,211,238,0.5);
              animation: iss-pulse 2s ease-in-out infinite;
            ">
              <span style="font-size: 16px; line-height: 1; user-select: none;">🛰️</span>
            </div>
          `,
          className: 'custom-iss-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.default.marker(
          [position.latitude, position.longitude],
          { icon: satelliteIcon }
        ).addTo(map);

        // Trek orbit ISS
        const safeHistory = history.filter(
          ([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon)
        );
        const pathLine = L.default.polyline(safeHistory, {
          color: '#22d3ee',
          weight: 2,
          opacity: 0.55,
          dashArray: '5, 5',
        }).addTo(map);

        mapRef.current = map;
        markerRef.current = marker;
        pathRef.current = pathLine;
        setLeafletLoaded(true);

        // Paksa resize berkali-kali untuk mengatasi race condition flexbox/grid
        [100, 300, 700, 1500].forEach((delay) => {
          setTimeout(() => {
            if (mapRef.current) mapRef.current.invalidateSize({ pan: false });
          }, delay);
        });

        // ResizeObserver untuk handle resize dinamis container
        const ro = new ResizeObserver(() => {
          if (mapRef.current) mapRef.current.invalidateSize({ pan: false });
        });
        if (mapContainerRef.current) ro.observe(mapContainerRef.current);

        // Simpan observer untuk cleanup
        (mapRef.current as any)._resizeObserver = ro;

      } catch (err) {
        console.error('[ISSMap] Gagal inisialisasi Leaflet:', err);
        setMapError(true);
      }
    }).catch((err) => {
      console.error('[ISSMap] Gagal load Leaflet:', err);
      setMapError(true);
    });

    return () => {
      if (mapRef.current) {
        if (mapRef.current._resizeObserver) {
          mapRef.current._resizeObserver.disconnect();
        }
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        pathRef.current = null;
        setLeafletLoaded(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidPosition]);

  // ── Update posisi & trek saat data berubah ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !pathRef.current || !isValidPosition || !leafletLoaded) return;

    const newLatLng: [number, number] = [position.latitude, position.longitude];
    markerRef.current.setLatLng(newLatLng);
    mapRef.current.panTo(newLatLng, { animate: true, duration: 0.8 });

    const safeHistory = history.filter(
      ([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon)
    );
    pathRef.current.setLatLngs(safeHistory);
  }, [position, history, isValidPosition, leafletLoaded]);

  // ── Fallback: koordinat tidak valid ─────────────────────────────────────
  if (!isValidPosition) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-xs text-slate-500 rounded-xl">
        Koordinat ISS belum valid.
      </div>
    );
  }

  // ── Fallback: error Leaflet — tampilkan SVG dot map ─────────────────────
  if (mapError) {
    const x = ((position.longitude + 180) / 360) * 100;
    const y = ((90 - position.latitude) / 180) * 100;
    return (
      <div className="w-full h-full relative bg-slate-950 rounded-xl flex items-center justify-center">
        <svg viewBox="0 0 360 180" className="w-full h-full opacity-30 absolute inset-0" preserveAspectRatio="xMidYMid meet">
          <rect width="360" height="180" fill="#020617" />
          {/* Grid lines */}
          {[0,60,120,180,240,300,360].map(x => (
            <line key={x} x1={x} y1={0} x2={x} y2={180} stroke="#1e293b" strokeWidth="0.5" />
          ))}
          {[0,45,90,135,180].map(y => (
            <line key={y} x1={0} y1={y} x2={360} y2={y} stroke="#1e293b" strokeWidth="0.5" />
          ))}
        </svg>
        <div
          className="absolute w-5 h-5 flex items-center justify-center"
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <span className="text-xl animate-pulse" title={`ISS: ${position.latitude.toFixed(2)}°, ${position.longitude.toFixed(2)}°`}>🛰️</span>
        </div>
        <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-1 rounded-full text-[10px] text-cyan-400 border border-cyan-900/30">
          ⚠️ Map tiles unavailable
        </div>
      </div>
    );
  }

  // ── Render normal Leaflet ────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative">
      <style>{`
        @keyframes iss-pulse {
          0%, 100% { box-shadow: 0 0 14px rgba(34,211,238,0.5); }
          50% { box-shadow: 0 0 22px rgba(34,211,238,0.8), 0 0 6px rgba(34,211,238,0.4); }
        }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', minHeight: '192px', borderRadius: 'inherit' }}
      />
      {/* Overlay live badge */}
      <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.05)] pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[10px] text-blue-600 font-extrabold tracking-wider">LIVE ISS</span>
      </div>
      {/* Koordinat overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.05)] pointer-events-none">
        <span className="text-[9px] text-slate-800 font-mono font-bold">
          LAT: <span className="text-blue-600">{position.latitude.toFixed(4)}° {position.latitude >= 0 ? 'N' : 'S'}</span> &nbsp;|&nbsp; 
          LON: <span className="text-blue-600">{Math.abs(position.longitude).toFixed(4)}° {position.longitude >= 0 ? 'E' : 'W'}</span>
        </span>
      </div>
    </div>
  );
}
