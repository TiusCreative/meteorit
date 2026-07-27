'use client';

import { useEffect, useRef, useState } from 'react';

interface MapProps {
  activeLayers: {
    volcano: boolean;
    quake: boolean;
    hotspots: boolean;
    rain: boolean;
    himawari: boolean;
    flood: boolean;
    cyclone: boolean;
  };
  quakeData?: any[];
  hotspotData?: any[];
  volcanoData?: any[];
  centerLatLng?: [number, number];
}

export default function DisasterMap({
  activeLayers,
  quakeData = [],
  hotspotData = [],
  volcanoData = [],
  centerLatLng
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // References to all layer groups
  const layersRef = useRef<Record<string, any>>({});

  // 1. Initialize Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        // Adjust default marker icons
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

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
            attribution: '&copy; CARTO &copy; OpenStreetMap'
          }
        );

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

        // Initialize Layer Groups
        layersRef.current = {
          volcano: L.default.layerGroup().addTo(map),
          quake: L.default.layerGroup().addTo(map),
          hotspots: L.default.layerGroup().addTo(map),
          rain: L.default.layerGroup().addTo(map),
          himawari: L.default.layerGroup().addTo(map),
          flood: L.default.layerGroup().addTo(map),
          cyclone: L.default.layerGroup().addTo(map),
        };

        mapRef.current = map;
        setLeafletLoaded(true);

        setTimeout(() => {
          map.invalidateSize();
        }, 300);

        const ro = new ResizeObserver(() => {
          map.invalidateSize();
        });
        if (mapContainerRef.current) ro.observe(mapContainerRef.current);
        (map as any)._resizeObserver = ro;

      } catch (err) {
        console.error('Failed to initialize Leaflet Map:', err);
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
        layersRef.current = {};
        setLeafletLoaded(false);
      }
    };
  }, []);

  // 2. Render Markers and Layer overlays when layers, type or data changes
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;

    import('leaflet').then((L) => {
      const map = mapRef.current;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // --- 1. VOLCANOES LAYER ---
      const volcanoGroup = layersRef.current.volcano;
      volcanoGroup.clearLayers();
      if (activeLayers.volcano) {
        volcanoData.forEach((v) => {
          const lat = parseFloat(v.latitude);
          const lon = parseFloat(v.longitude);
          if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) return;

          const color = v.status_level === 'Awas' ? '#ef4444' : v.status_level === 'Siaga' ? '#f97316' : v.status_level === 'Waspada' ? '#eab308' : '#10b981';
          const circle = L.default.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            radius: v.status_level === 'Awas' ? 30000 : v.status_level === 'Siaga' ? 20000 : 12000,
            weight: 2,
          });

          const popupContent = `
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px; min-width: 160px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: bold; color: ${color};">🌋 Gunung ${v.name}</h4>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">
                Status: <strong>${v.status || v.status_level}</strong><br>
                Kolom Abu: ${v.ash_height > 0 ? `${v.ash_height} m` : 'Tidak teramati'}<br>
                Arah Abu: ${v.ash_direction || 'Nihil'}<br>
                Aktivitas/Ringkasan: ${v.description || 'Stabil'}<br>
                Waktu: ${new Date(v.last_updated).toLocaleString('id-ID')}
              </p>
            </div>
          `;
          circle.bindPopup(popupContent);
          volcanoGroup.addLayer(circle);
        });
      }

      // --- 2. EARTHQUAKES LAYER ---
      const quakeGroup = layersRef.current.quake;
      quakeGroup.clearLayers();
      if (activeLayers.quake) {
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
              <h4 style="margin: 0; font-size: 12px; font-weight: bold;">M ${q.magnitude.toFixed(1)} - ${q.place || q.region}</h4>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b;">
                Kedalaman: ${q.depth} km<br>
                Waktu: ${q.time ? new Date(q.time).toLocaleString('id-ID') : q.dateTime || '-'}<br>
                Tsunami: <strong>${q.tsunamiPotential || (q.tsunami ? 'POTENSI' : 'Tidak Berpotensi')}</strong>
              </p>
            </div>
          `;
          circle.bindPopup(popupContent);
          quakeGroup.addLayer(circle);
        });
      }

      // --- 3. HOTSPOTS LAYER ---
      const hotspotGroup = layersRef.current.hotspots;
      hotspotGroup.clearLayers();
      if (activeLayers.hotspots) {
        hotspotData.forEach((fire) => {
          const lat = parseFloat(fire.latitude);
          const lon = parseFloat(fire.longitude);
          if (isNaN(lat) || isNaN(lon)) return;

          const radius = Math.min(30000, Math.max(4000, (fire.frp || 1) * 250));
          const circle = L.default.circle([lat, lon], {
            color: '#f97316',
            fillColor: '#ef4444',
            fillOpacity: 0.45,
            radius: radius,
            weight: 1,
          });

          const popupContent = `
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <h4 style="margin: 0; font-size: 12px; font-weight: bold; color: #ea580c;">🔥 Titik Karhutla</h4>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b;">
                Satelit: ${fire.satellite}<br>
                Radiasi (FRP): ${fire.frp} MW<br>
                Confidence: ${fire.confidence}<br>
                Waktu: ${fire.acq_date} ${fire.acq_time} UTC
              </p>
            </div>
          `;
          circle.bindPopup(popupContent);
          hotspotGroup.addLayer(circle);
        });
      }

      // --- 4. RAIN RADAR (GPM) OVERLAY ---
      const rainGroup = layersRef.current.rain;
      rainGroup.clearLayers();
      if (activeLayers.rain) {
        const gpmTile = L.default.tileLayer(
          `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${yesterday}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
          {
            maxZoom: 6,
            opacity: 0.55,
            attribution: 'NASA GIBS'
          }
        );
        rainGroup.addLayer(gpmTile);
      }

      // --- 5. HIMAWARI CLOUD IMAGERY OVERLAY ---
      const himawariGroup = layersRef.current.himawari;
      himawariGroup.clearLayers();
      if (activeLayers.himawari) {
        const himawariTile = L.default.tileLayer(
          `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_True_Color/default/${yesterday}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
          {
            maxZoom: 6,
            opacity: 0.5,
            attribution: 'NASA GIBS / JMA'
          }
        );
        himawariGroup.addLayer(himawariTile);
      }

      // --- 6. FLOOD LAYER OVERLAYS ---
      const floodGroup = layersRef.current.flood;
      floodGroup.clearLayers();
      if (activeLayers.flood) {
        // Overlay standard flood points of concern
        const floodWatchPoints = [
          { name: 'Semarang (Pantura)', coords: [-6.96, 110.42], desc: 'Limpasan air laut pasang (Rob) dan tanggul sungai kritis.' },
          { name: 'Jakarta Utara (Muara Baru)', coords: [-6.11, 106.80], desc: 'Rob laut pesisir dan kenaikan muka air pintu pasar ikan.' },
          { name: 'Demak (Sungai Wulan)', coords: [-6.89, 110.63], desc: 'Tanggul jebol dan genangan sawah berkepanjangan.' },
          { name: 'Luwu Utara', coords: [-2.54, 120.31], desc: 'Siaga banjir limpasan air permukaan lereng pegunungan.' }
        ];

        floodWatchPoints.forEach((pt) => {
          const circle = L.default.circle(pt.coords as [number, number], {
            color: '#06b6d4',
            fillColor: '#22d3ee',
            fillOpacity: 0.4,
            radius: 40000,
            weight: 2
          });

          const popupContent = `
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px; min-width: 140px;">
              <h4 style="margin: 0; font-size: 12px; font-weight: bold; color: #0891b2;">🌊 Pos Pantau Banjir</h4>
              <p style="margin: 4px 0 0 0; font-size: 10px; color: #475569;">
                Wilayah: <strong>${pt.name}</strong><br>
                Detail Risiko: ${pt.desc}
              </p>
            </div>
          `;
          circle.bindPopup(popupContent);
          floodGroup.addLayer(circle);
        });
      }

      // --- 7. CYCLONES LAYER OVERLAYS ---
      const cycloneGroup = layersRef.current.cyclone;
      cycloneGroup.clearLayers();
      if (activeLayers.cyclone) {
        // Draw track of mock tropical depression/cyclone near equator
        const trackPoints: [number, number][] = [
          [-10.0, 115.0],
          [-11.2, 113.5],
          [-12.5, 112.0],
          [-14.0, 110.0]
        ];

        const polyline = L.default.polyline(trackPoints, {
          color: '#ec4899',
          weight: 3,
          dashArray: '5, 10',
          opacity: 0.75
        });

        const pulseMarker = L.default.circle(trackPoints[0], {
          color: '#db2777',
          fillColor: '#f472b6',
          fillOpacity: 0.6,
          radius: 60000,
          weight: 2
        });

        const popupContent = `
          <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
            <h4 style="margin: 0; font-size: 12px; font-weight: bold; color: #be185d;">🌀 Depresi Tropis (Siklon)</h4>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #475569;">
              Status: Aktif Melacak<br>
              Kecepatan Angin: 55 km/jam<br>
              Koordinat: -10.0 S, 115.0 E<br>
              Pengaruh: Curah hujan sedang-tinggi di wilayah Jawa bagian selatan & Bali.
            </p>
          </div>
        `;
        pulseMarker.bindPopup(popupContent);

        cycloneGroup.addLayer(polyline);
        cycloneGroup.addLayer(pulseMarker);
      }
    });
  }, [leafletLoaded, activeLayers, quakeData, hotspotData, volcanoData]);

  // 3. Pan map when centerLatLng changes
  useEffect(() => {
    if (mapRef.current && centerLatLng && centerLatLng[0] !== 0 && centerLatLng[1] !== 0) {
      mapRef.current.setView(centerLatLng, 7.5, { animate: true });
    }
  }, [centerLatLng]);

  if (mapError) {
    return (
      <div className="w-full h-80 md:h-[400px] flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-500">
        Gagal memuat peta satelit Leaflet.
      </div>
    );
  }

  return (
    <div className="w-full h-80 md:h-[400px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-900 shadow-2xl">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Premium Light/Dark Theme Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-cyan-500/20 p-3 rounded-2xl text-[9px] font-bold tracking-wider text-slate-800 dark:text-slate-200 shadow-2xl pointer-events-none space-y-1.5 min-w-[130px]">
        <p className="text-blue-600 dark:text-cyan-400 font-extrabold uppercase border-b border-slate-100 dark:border-cyan-900/50 pb-1 mb-1 tracking-widest text-[8px]">LEGENDA PETA</p>
        
        {activeLayers.volcano && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Gunung Api (Awas/Siaga)</span>
          </div>
        )}
        {activeLayers.quake && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Gempa Bumi &ge; 4.0</span>
          </div>
        )}
        {activeLayers.hotspots && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Hotspots FIRMS</span>
          </div>
        )}
        {activeLayers.rain && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-2 bg-blue-500/40 inline-block rounded" />
            <span>Radar Hujan GPM</span>
          </div>
        )}
        {activeLayers.himawari && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-2 bg-white/30 inline-block rounded" />
            <span>Satelit Himawari Cloud</span>
          </div>
        )}
        {activeLayers.flood && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Pos Siaga Banjir</span>
          </div>
        )}
        {activeLayers.cyclone && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span>Siklon Tropis</span>
          </div>
        )}
      </div>
    </div>
  );
}
