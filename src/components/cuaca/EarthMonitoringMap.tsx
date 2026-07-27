'use client';

import { useEffect, useRef, useState } from 'react';

interface MapProps {
  type: 'quake' | 'hotspots' | 'rain' | 'volcano';
  quakeData?: any[];
  hotspotData?: any[];
  volcanoData?: any[];
  centerLatLng?: [number, number];
}

export default function EarthMonitoringMap({ type, quakeData = [], hotspotData = [], volcanoData = [], centerLatLng }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const gibsLayerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // 1. Inisialisasi Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        const map = L.default.map(mapContainerRef.current, {
          center: [-2.5, 118.0], // Center of Indonesia
          zoom: 4.5,
          minZoom: 3,
          maxZoom: 10,
          zoomControl: true,
          preferCanvas: true,
        });

        // Bright Basemap (CARTO Voyager: clean white & cloud-blue oceans)
        const cartoVoyager = L.default.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          {
            maxZoom: 20,
            subdomains: 'abcd',
            attribution: '&copy; CARTO'
          }
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

        // Layer group for dynamic markers
        const layerGroup = L.default.layerGroup().addTo(map);

        mapRef.current = map;
        layerGroupRef.current = layerGroup;
        setLeafletLoaded(true);

        // Resize adjustments
        setTimeout(() => {
          map.invalidateSize();
        }, 300);

        const ro = new ResizeObserver(() => {
          map.invalidateSize();
        });
        if (mapContainerRef.current) ro.observe(mapContainerRef.current);
        (map as any)._resizeObserver = ro;

      } catch (err) {
        console.error('Failed to initialize Earth map:', err);
        setMapError(true);
      }
    });

    return () => {
      if (mapRef.current) {
        if (mapRef.current._resizeObserver) {
          mapRef.current._resizeObserver.disconnect();
        }
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
        gibsLayerRef.current = null;
        setLeafletLoaded(false);
      }
    };
  }, []);

  // 2. Render Markers & Layers when Type or Data changes
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !layerGroupRef.current) return;

    import('leaflet').then((L) => {
      const map = mapRef.current;
      const layerGroup = layerGroupRef.current;

      // Clean existing layers
      layerGroup.clearLayers();
      if (gibsLayerRef.current) {
        map.removeLayer(gibsLayerRef.current);
        gibsLayerRef.current = null;
      }

      if (type === 'quake') {
        // Plot earthquakes
        quakeData.forEach((q) => {
          const lat = parseFloat(q.latitude);
          const lon = parseFloat(q.longitude);
          if (isNaN(lat) || isNaN(lon)) return;

          const radius = Math.pow(2, q.magnitude) * 1200;
          const color = q.magnitude >= 5.0 ? '#ef4444' : q.magnitude >= 4.0 ? '#f59e0b' : '#3b82f6';

          const circle = L.default.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: 0.35,
            radius: radius,
            weight: 1.5,
          });

          const popupContent = `
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: bold;">M ${q.magnitude.toFixed(1)} - ${q.place || q.region}</h4>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">
                Kedalaman: ${q.depth} km<br>
                Waktu: ${q.time ? new Date(q.time).toLocaleString('id-ID') : q.dateTime || '-'}<br>
                Potensi: <strong>${q.tsunamiPotential || (q.tsunami ? 'POTENSI TSUNAMI' : 'Tidak Berpotensi Tsunami')}</strong>
              </p>
            </div>
          `;

          circle.bindPopup(popupContent);
          layerGroup.addLayer(circle);
        });
      } else if (type === 'hotspots') {
        // Plot active fires
        hotspotData.forEach((fire) => {
          const lat = parseFloat(fire.latitude);
          const lon = parseFloat(fire.longitude);
          if (isNaN(lat) || isNaN(lon)) return;

          const radius = Math.min(50000, Math.max(5000, (fire.frp || 1) * 300));
          const color = '#f97316';

          const circle = L.default.circle([lat, lon], {
            color: color,
            fillColor: '#ef4444',
            fillOpacity: 0.45,
            radius: radius,
            weight: 1,
          });

          const popupContent = `
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: #ea580c;">🔥 Titik Kebakaran Hutan</h4>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">
                Satelit: ${fire.satellite}<br>
                FRP (Radiasi Daya): ${fire.frp} MW<br>
                Confidence: ${fire.confidence}<br>
                Waktu: ${fire.acq_date} ${fire.acq_time} UTC (${fire.daynight === 'D' ? 'Siang' : 'Malam'})
              </p>
            </div>
          `;

          circle.bindPopup(popupContent);
          layerGroup.addLayer(circle);
        });
      } else if (type === 'rain') {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const gibsRainLayer = L.default.tileLayer(
          `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${yesterday}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
          {
            maxZoom: 6,
            opacity: 0.65,
            attribution: 'NASA GIBS / GPM IMERG'
          }
        );

        gibsRainLayer.addTo(map);
        gibsLayerRef.current = gibsRainLayer;
      } else if (type === 'volcano') {
        const getVolcanoCoords = (name: string): [number, number] => {
          const n = name.toLowerCase();
          if (n.includes('merapi')) return [-7.54, 110.44];
          if (n.includes('lewotobi')) return [-8.53, 122.78];
          if (n.includes('semeru')) return [-8.108, 112.92];
          if (n.includes('krakatau')) return [-6.102, 105.423];
          if (n.includes('sinabung')) return [3.17, 98.39];
          if (n.includes('ibu')) return [1.488, 127.63];
          if (n.includes('marapi')) return [-0.38, 100.47];
          if (n.includes('kerinci')) return [-1.697, 101.264];
          if (n.includes('raung')) return [-8.125, 114.042];
          if (n.includes('karangetang')) return [2.78, 125.40];
          if (n.includes('soputan')) return [1.112, 124.73];
          if (n.includes('dukono')) return [1.685, 127.894];
          return [-2.5, 118.0];
        };

        volcanoData.forEach((v) => {
          let lat = parseFloat(v.latitude);
          let lon = parseFloat(v.longitude);
          if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
            const fallback = getVolcanoCoords(v.volcano_name);
            lat = fallback[0];
            lon = fallback[1];
          }

          const color = v.current_code === 'RED' ? '#ef4444' : '#f97316';

          const circle = L.default.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: 0.55,
            radius: 20000,
            weight: 2,
          });

          const popupContent = `
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: ${color};">🌋 Gunung ${v.volcano_name}</h4>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">
                Kode Status: <strong>${v.current_code}</strong><br>
                Aktivitas: ${v.volcanic_activity_summary || 'Erupsi aktif terpantau.'}<br>
                Abu Vulkanik: ${v.ash_cloud || 'Tidak teramati.'}<br>
                Rilis VONA: ${new Date(v.issued_time).toLocaleString('id-ID')}
              </p>
            </div>
          `;

          circle.bindPopup(popupContent);
          layerGroup.addLayer(circle);
        });
      }
    });
  }, [leafletLoaded, type, quakeData, hotspotData, volcanoData]);

  // 3. Pan map when centerLatLng changes
  useEffect(() => {
    if (mapRef.current && centerLatLng && centerLatLng[0] !== 0 && centerLatLng[1] !== 0) {
      mapRef.current.setView(centerLatLng, 8, { animate: true });
    }
  }, [centerLatLng]);

  if (mapError) {
    return (
      <div className="w-full h-72 flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-500">
        Gagal memuat peta Leaflet.
      </div>
    );
  }

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 relative bg-white shadow-inner">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Legend overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur border border-slate-200 p-2.5 rounded-xl text-[9px] font-bold tracking-wider text-slate-700 shadow-md pointer-events-none space-y-1">
        {type === 'quake' && (
          <>
            <p className="text-slate-500 font-extrabold uppercase mb-1">Skala Magnitudo</p>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> M &ge; 5.0 (Kuat)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> M 4.0 - 4.9 (Sedang)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> M &lt; 4.0 (Kecil)</div>
          </>
        )}
        {type === 'hotspots' && (
          <>
            <p className="text-slate-500 font-extrabold uppercase mb-1">Daya Radiasi (FRP)</p>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> FRP Tinggi (&gt; 50 MW)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> FRP Rendah/Sedang</div>
          </>
        )}
        {type === 'rain' && (
          <>
            <p className="text-slate-500 font-extrabold uppercase mb-1">Curah Hujan NASA GPM</p>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-2.5 bg-blue-500/60 inline-block rounded" /> Hujan / Presipitasi Aktif</div>
          </>
        )}
        {type === 'volcano' && (
          <>
            <p className="text-slate-500 font-extrabold uppercase mb-1">Status Gunung Api</p>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> RED (Awas/Erupsi)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" /> ORANGE (Siaga)</div>
          </>
        )}
      </div>
    </div>
  );
}
