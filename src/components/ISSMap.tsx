"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ISSMapProps {
  position: { latitude: number; longitude: number; timestamp: number };
  history: [number, number][];
}

export default function ISSMap({ position, history }: ISSMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const initialPositionRef = useRef(position);
  const initialHistoryRef = useRef(history);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [initialPositionRef.current.latitude, initialPositionRef.current.longitude],
      zoom: 3,
      minZoom: 1,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark Mode Tile Layer from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    // Custom satellite marker using HTML & CSS animation
    const satelliteIcon = L.divIcon({
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center bg-cyan-500/20 border border-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          <span class="text-base animate-pulse select-none">🛰️</span>
          <div class="absolute -inset-1 border border-cyan-400/40 rounded-full animate-ping" style="animation-duration: 2s"></div>
        </div>
      `,
      className: 'custom-iss-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([initialPositionRef.current.latitude, initialPositionRef.current.longitude], { icon: satelliteIcon }).addTo(map);

    // Initial ISS flight path history line
    const pathLine = L.polyline(initialHistoryRef.current, {
      color: '#22d3ee',
      weight: 2,
      opacity: 0.6,
      dashArray: '4, 4',
    }).addTo(map);

    mapRef.current = map;
    markerRef.current = marker;
    pathRef.current = pathLine;

    // Subtle resize adjustment for Leaflet inside flex/hidden elements
    const resizeTimer = window.setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      window.clearTimeout(resizeTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map marker and line trail when position or history changes
  useEffect(() => {
    if (mapRef.current && markerRef.current && pathRef.current) {
      const newLatLng: L.LatLngExpression = [position.latitude, position.longitude];
      
      // Move marker smoothly
      markerRef.current.setLatLng(newLatLng);
      
      // Keep centering the map on the satellite
      mapRef.current.panTo(newLatLng);
      
      // Update trail path
      pathRef.current.setLatLngs(history);
    }
  }, [position, history]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full rounded-xl bg-slate-950" />
      {/* Live indicator overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-full border border-slate-700/50 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
        <span className="text-[10px] text-green-400 font-bold tracking-wider">LIVE ISS</span>
      </div>
    </div>
  );
}
