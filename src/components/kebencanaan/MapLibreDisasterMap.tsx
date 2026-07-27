'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin, Navigation, Ruler, Trash2, Search, Share2,
  Copy, Check, ExternalLink, AlertTriangle, X, ChevronDown,
  Maximize2, QrCode, Route, CircleDot, Pentagon, Clock, Play, Square
} from 'lucide-react';

interface MapLibreDisasterMapProps {
  records: any[];
  centerLatLng?: [number, number];
  language: string;
}

type MeasurementMode = 'none' | 'polyline' | 'polygon' | 'radius' | 'eta';
type NavigationMode = 'none' | 'navigating' | 'simulating';
type MapStyle = 'dark' | 'osm' | 'satellite';

// MapLibre Styles
const MAP_STYLES: Record<MapStyle, any> = {
  osm: {
    version: 8,
    sources: {
      'osm-raster': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© CARTO, © OpenStreetMap'
      }
    },
    layers: [{ id: 'osm-layer', type: 'raster', source: 'osm-raster', minzoom: 0, maxzoom: 19 }]
  },
  satellite: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Tiles © Esri'
      }
    },
    layers: [{ id: 'satellite-layer', type: 'raster', source: 'esri-satellite', minzoom: 0, maxzoom: 19 }]
  },
  dark: {
    version: 8,
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© CARTO, © OpenStreetMap'
      }
    },
    layers: [{ id: 'dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 20 }]
  }
};

// ─── Geo Math Utilities ────────────────────────────────────────────────────────
function toRad(v: number) { return v * Math.PI / 180; }

function getDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  let a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  a = Math.min(1, Math.max(0, a));
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Shoelace formula for polygon area (km²)
function polygonAreaKM2(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const R = 6371;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRad(points[i][1]);
    const lat2 = toRad(points[j][1]);
    const dLon = toRad(points[j][0] - points[i][0]);
    area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2);
}

// Convert to DMS
function toDMS(lat: number, lng: number): string {
  const fmt = (v: number, dirs: [string, string]) => {
    const d = Math.floor(Math.abs(v));
    const m = Math.floor((Math.abs(v) - d) * 60);
    const s = ((Math.abs(v) - d - m / 60) * 3600).toFixed(1);
    return `${d}°${m}'${s}"${v >= 0 ? dirs[0] : dirs[1]}`;
  };
  return `${fmt(lat, ['N', 'S'])} ${fmt(lng, ['E', 'W'])}`;
}

// Convert lat/lng to UTM
function toUTM(lat: number, lng: number): string {
  const zone = Math.floor((lng + 180) / 6) + 1;
  const hemi = lat >= 0 ? 'N' : 'S';
  const x = Math.round((lng - (zone * 6 - 183)) * 111319.49 * Math.cos(toRad(lat)) + 500000);
  const y = Math.round(lat * 110574.27 + (lat >= 0 ? 0 : 10000000));
  return `${zone}${hemi} ${x}E ${y}N`;
}

// Generate circle GeoJSON
function circleGeoJSON(center: [number, number], radiusKM: number, steps = 64) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const lat = center[1] + (radiusKM / 111.32) * Math.sin(angle);
    const lng = center[0] + (radiusKM / (111.32 * Math.cos(toRad(center[1])))) * Math.cos(angle);
    coords.push([lng, lat]);
  }
  return { type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [coords] }, properties: {} };
}

// ─── Translations ──────────────────────────────────────────────────────────────
const T: Record<string, Record<string, string>> = {
  id: {
    myLocation: 'Lokasi Saya', trackingOn: '📍 Aktif Terlacak', trackingOff: 'Lokasi Saya',
    measureDist: 'Jarak', measureArea: 'Luas Area', measureRadius: 'Radius Buffer', measureETA: 'Rute & ETA',
    measureTotal: 'Total Jarak', polygonArea: 'Luas Polygon', radiusKM: 'Radius',
    etaWalk: 'Jalan Kaki', etaCar: 'Mobil', etaBike: 'Sepeda', etaCalc: 'Hitung Rute',
    etaFrom: 'Titik Awal', etaTo: 'Titik Tujuan', etaLoading: 'Menghitung rute...',
    reset: 'Reset', close: 'Selesai', clickMap: 'Klik peta untuk menambah titik',
    searchPlaceholder: 'Cari tempat makan, kantor, lokasi...', searching: 'Mencari...',
    coordInspector: 'Inspeksi Koordinat', elevation: 'Elevasi', distance: 'Jarak ke Anda',
    severity: 'Tingkat Bahaya', copied: 'Disalin!', copyCoord: 'Salin Koordinat',
    openGmaps: 'Google Maps', shareBtn: 'Bagikan', darkMap: 'Gelap', streetMap: 'Jalan', satMap: 'Satelit',
    warningHeader: '🚨 PERINGATAN BAHAYA DEKAT ANDA',
    warningBody: 'Anda berada dalam radius {dist} km dari {name} ({type}). Harap waspada!',
    gpsAccuracy: 'Akurasi GPS', gpsSpeed: 'Kecepatan', gpsAlt: 'Ketinggian',
    copy_lat: 'Salin Latitude', copy_lng: 'Salin Longitude', copy_latlng: 'Salin Lat,Lng',
    copy_gmaps: 'Format Google Maps', copy_osm: 'Format OpenStreetMap',
    copy_geojson: 'Format GeoJSON', copy_kml: 'Format KML', copy_dms: 'Format DMS',
    copy_utm: 'Format UTM', copy_all: 'Salin Semua Info',
    share_wa: 'WhatsApp', share_tg: 'Telegram', share_discord: 'Discord',
    share_fb: 'Facebook', share_email: 'Email', share_sms: 'SMS', share_qr: 'QR Code', share_link: 'Salin Link',
    shareTitle: 'Bagikan Lokasi', qrCode: 'QR Code Lokasi', pointsSelected: 'titik dipilih',
    threatDist: 'Ancaman Terdekat', noThreat: 'Aman - Tidak ada ancaman terdeteksi',
    threatGempa: 'Gempa', threatGunung: 'Gunung Api', threatApi: 'Titik Api',
    etaNoPoints: 'Gunakan tombol di atas untuk menentukan Titik A dan Titik B.',
    radiusItems: 'objek dalam radius',
    startNav: 'Mulai Navigasi', simulateRide: 'Simulasi Perjalanan', stopNav: 'Hentikan Navigasi',
    speed: 'Kecepatan', eta: 'Waktu Tiba', remaining: 'Sisa', arrived: 'Anda telah sampai!',
    navBanner: 'Ikuti rute jalan raya menuju tujuan Anda.',
    locationLabel: 'Lokasi', timeLabel: 'Waktu', providerLabel: 'Sumber Data',
    threatDanger: '⚠️ Bahaya', threatSafe: '✅ Aman'
  },
  en: {
    myLocation: 'My Location', trackingOn: '📍 Tracking Active', trackingOff: 'My Location',
    measureDist: 'Distance', measureArea: 'Area', measureRadius: 'Radius Buffer', measureETA: 'Route & ETA',
    measureTotal: 'Total Distance', polygonArea: 'Polygon Area', radiusKM: 'Radius',
    etaWalk: 'Walking', etaCar: 'Driving', etaBike: 'Cycling', etaCalc: 'Calculate Route',
    etaFrom: 'Origin', etaTo: 'Destination', etaLoading: 'Calculating route...',
    reset: 'Reset', close: 'Done', clickMap: 'Click map to add points',
    searchPlaceholder: 'Search restaurant, office, location...', searching: 'Searching...',
    coordInspector: 'Coordinate Inspector', elevation: 'Elevation', distance: 'Distance to you',
    severity: 'Severity', copied: 'Copied!', copyCoord: 'Copy Coordinates',
    openGmaps: 'Google Maps', shareBtn: 'Share', darkMap: 'Dark', streetMap: 'Street', satMap: 'Satellite',
    warningHeader: '🚨 PROXIMITY HAZARD WARNING',
    warningBody: 'You are within {dist} km of {name} ({type}). Stay vigilant!',
    gpsAccuracy: 'GPS Accuracy', gpsSpeed: 'Speed', gpsAlt: 'Altitude',
    copy_lat: 'Copy Latitude', copy_lng: 'Copy Longitude', copy_latlng: 'Copy Lat,Lng',
    copy_gmaps: 'Google Maps Format', copy_osm: 'OpenStreetMap Format',
    copy_geojson: 'GeoJSON Format', copy_kml: 'KML Format', copy_dms: 'DMS Format',
    copy_utm: 'UTM Format', copy_all: 'Copy All Info',
    share_wa: 'WhatsApp', share_tg: 'Telegram', share_discord: 'Discord',
    share_fb: 'Facebook', share_email: 'Email', share_sms: 'SMS', share_qr: 'QR Code', share_link: 'Copy Link',
    shareTitle: 'Share Location', qrCode: 'Location QR Code', pointsSelected: 'points selected',
    threatDist: 'Nearest Threat', noThreat: 'Safe - No threats detected',
    threatGempa: 'Earthquake', threatGunung: 'Volcano', threatApi: 'Fire Hotspot',
    etaNoPoints: 'Use the buttons above to specify Point A and Point B.',
    radiusItems: 'objects within radius',
    startNav: 'Start Navigation', simulateRide: 'Simulate Ride', stopNav: 'Stop Navigation',
    speed: 'Speed', eta: 'ETA', remaining: 'Remaining', arrived: 'You have arrived!',
    navBanner: 'Follow the road route towards your destination.',
    locationLabel: 'Location', timeLabel: 'Time', providerLabel: 'Provider',
    threatDanger: '⚠️ Danger', threatSafe: '✅ Safe'
  },
  ms: {
    myLocation: 'Lokasi Saya', trackingOn: '📍 Aktif Dijejak', trackingOff: 'Lokasi Saya',
    measureDist: 'Jarak', measureArea: 'Kawasan Area', measureRadius: 'Radius Buffer', measureETA: 'Laluan & ETA',
    measureTotal: 'Jumlah Jarak', polygonArea: 'Kawasan Polygon', radiusKM: 'Radius',
    etaWalk: 'Berjalan kaki', etaCar: 'Kereta', etaBike: 'Basikal', etaCalc: 'Kira Laluan',
    etaFrom: 'Titik Permulaan', etaTo: 'Titik Destinasi', etaLoading: 'Mengira laluan...',
    reset: 'Set Semula', close: 'Selesai', clickMap: 'Klik peta untuk tambah titik',
    searchPlaceholder: 'Cari kedai makan, pejabat, lokasi...', searching: 'Mencari...',
    coordInspector: 'Pemeriksa Koordinat', elevation: 'Ketinggian Bumi', distance: 'Jarak kepada Anda',
    severity: 'Tahap Bahaya', copied: 'Disalin!', copyCoord: 'Salin Koordinat',
    openGmaps: 'Google Maps', shareBtn: 'Kongsi', darkMap: 'Gelap', streetMap: 'Jalan', satMap: 'Satelit',
    warningHeader: '🚨 AMARAN BAHAYA BERHAMPIRAN ANDA',
    warningBody: 'Anda berada dalam radius {dist} km dari {name} ({type}). Sila berwaspada!',
    gpsAccuracy: 'Ketepatan GPS', gpsSpeed: 'Kelajuan', gpsAlt: 'Altitud',
    copy_lat: 'Salin Latitude', copy_lng: 'Salin Longitude', copy_latlng: 'Salin Lat,Lng',
    copy_gmaps: 'Format Google Maps', copy_osm: 'Format OpenStreetMap',
    copy_geojson: 'Format GeoJSON', copy_kml: 'Format KML', copy_dms: 'Format DMS',
    copy_utm: 'Format UTM', copy_all: 'Salin Semua Info',
    share_wa: 'WhatsApp', share_tg: 'Telegram', share_discord: 'Discord',
    share_fb: 'Facebook', share_email: 'Emel', share_sms: 'SMS', share_qr: 'Kod QR', share_link: 'Salin Link',
    shareTitle: 'Kongsi Lokasi', qrCode: 'Kod QR Lokasi', pointsSelected: 'titik dipilih',
    threatDist: 'Ancaman Terdekat', noThreat: 'Selamat - Tiada ancaman dikesan',
    threatGempa: 'Gempa', threatGunung: 'Gunung Berapi', threatApi: 'Titik Api',
    etaNoPoints: 'Gunakan butang di atas untuk menentukan Titik A dan Titik B.',
    radiusItems: 'objek dalam radius',
    startNav: 'Mula Navigasi', simulateRide: 'Simulasi Perjalanan', stopNav: 'Hentikan Navigasi',
    speed: 'Kelajuan', eta: 'Waktu Tiba', remaining: 'Sisa', arrived: 'Anda telah sampai!',
    navBanner: 'Ikuti laluan jalan raya ke destinasi anda.',
    locationLabel: 'Lokasi', timeLabel: 'Waktu', providerLabel: 'Sumber Data',
    threatDanger: '⚠️ Bahaya', threatSafe: '✅ Selamat'
  },
  zh: {
    myLocation: '我的位置', trackingOn: '📍 追踪启用', trackingOff: '我的位置',
    measureDist: '距离', measureArea: '面积', measureRadius: '缓冲区半径', measureETA: '路线与时间',
    measureTotal: '总距离', polygonArea: '多边形面积', radiusKM: '半径',
    etaWalk: '步行', etaCar: '驾车', etaBike: '骑行', etaCalc: '计算路线',
    etaFrom: '起点', etaTo: '终点', etaLoading: '正在计算路线...',
    reset: '重置', close: '完成', clickMap: '点击地图添加点',
    searchPlaceholder: '搜索餐饮、办公室、位置...', searching: '搜索中...',
    coordInspector: '坐标详情', elevation: '海拔', distance: '与您的距离',
    severity: '危险等级', copied: '已复制！', copyCoord: '复制坐标',
    openGmaps: '谷歌地图', shareBtn: '分享', darkMap: '深色', streetMap: '街区', satMap: '卫星',
    warningHeader: '🚨 临近灾害警告',
    warningBody: '您处于距离 {name} ({type}) {dist} 公里的危险范围内。请保持警惕！',
    gpsAccuracy: 'GPS 精度', gpsSpeed: '速度', gpsAlt: '高度',
    copy_lat: '复制纬度', copy_lng: '复制经度', copy_latlng: '复制经纬度',
    copy_gmaps: '谷歌地图格式', copy_osm: 'OpenStreetMap 格式',
    copy_geojson: 'GeoJSON 格式', copy_kml: 'KML 格式', copy_dms: 'DMS 格式',
    copy_utm: 'UTM 格式', copy_all: '复制所有信息',
    share_wa: '微信/WhatsApp', share_tg: 'Telegram', share_discord: 'Discord',
    share_fb: 'Facebook', share_email: '电子邮件', share_sms: '短信', share_qr: '二维码', share_link: '复制链接',
    shareTitle: '分享位置', qrCode: '位置二维码', pointsSelected: '点已选择',
    threatDist: '最近威胁', noThreat: '安全 - 未检测到威胁',
    threatGempa: '地震', threatGunung: '火山', threatApi: '火点',
    etaNoPoints: '使用上方的按钮指定起点A和终点B。',
    radiusItems: '半径内的对象',
    startNav: '开始导航', simulateRide: '模拟行程', stopNav: '停止导航',
    speed: '速度', eta: '预计到达时间', remaining: '剩余', arrived: '您已到达目的地！',
    navBanner: '沿公路路线行驶至目的地。',
    locationLabel: '位置', timeLabel: '时间', providerLabel: '数据源',
    threatDanger: '⚠️ 危险', threatSafe: '✅ 安全'
  },
  ja: {
    myLocation: '現在地', trackingOn: '📍 追跡中', trackingOff: '現在地',
    measureDist: '距離', measureArea: '面積', measureRadius: 'バッファ半径', measureETA: 'ルート＆時間',
    measureTotal: '合計距離', polygonArea: '多角形面積', radiusKM: '半径',
    etaWalk: '徒歩', etaCar: '車', etaBike: '自転車', etaCalc: 'ルート計算',
    etaFrom: '出発地', etaTo: '目的地', etaLoading: 'ルート計算中...',
    reset: 'リセット', close: '完了', clickMap: '地図をクリックして点を追加',
    searchPlaceholder: '飲食店、オフィス、場所を検索...', searching: '検索中...',
    coordInspector: '座標インスペクタ', elevation: '標高', distance: '現在地からの距離',
    severity: '警戒レベル', copied: 'コピー完了！', copyCoord: '座標をコピー',
    openGmaps: 'Googleマップ', shareBtn: '共有', darkMap: 'ダーク', streetMap: 'マップ', satMap: '衛星',
    warningHeader: '🚨 接近災害警告',
    warningBody: 'あなたは {name} ({type}) から {dist} km の危険範囲内にいます。十分注意してください！',
    gpsAccuracy: 'GPS 精度', gpsSpeed: '速度', gpsAlt: '標高',
    copy_lat: '緯度をコピー', copy_lng: '経度をコピー', copy_latlng: '緯度経度をコピー',
    copy_gmaps: 'Googleマップ形式', copy_osm: 'OpenStreetMap形式',
    copy_geojson: 'GeoJSON形式', copy_kml: 'KML形式', copy_dms: 'DMS形式',
    copy_utm: 'UTM形式', copy_all: '全情報をコピー',
    share_wa: 'WhatsApp', share_tg: 'Telegram', share_discord: 'Discord',
    share_fb: 'Facebook', share_email: 'メール', share_sms: 'SMS', share_qr: 'QRコード', share_link: 'リンクをコピー',
    shareTitle: '位置を共有', qrCode: '位置QRコード', pointsSelected: '個の点を選択中',
    threatDist: '最寄りの脅威', noThreat: '安全 - 脅威は検出されていません',
    threatGempa: '地震', threatGunung: '火山', threatApi: '火点',
    etaNoPoints: '上のボタンを使って地点Aと地点Bを指定してください。',
    radiusItems: '半径内のオブジェクト',
    startNav: 'ナビ開始', simulateRide: 'シミュレーション走行', stopNav: 'ナビ終了',
    speed: '速度', eta: '到着予定時刻', remaining: '残り', arrived: '目的地に到着しました！',
    navBanner: '道路ルートに沿って目的地へ向かいます。',
    locationLabel: '場所', timeLabel: '時間', providerLabel: '提供元',
    threatDanger: '⚠️ 危険', threatSafe: '✅ 安全'
  },
  ru: {
    myLocation: 'Мое местоположение', trackingOn: '📍 Отслеживание', trackingOff: 'Мое местоположение',
    measureDist: 'Расстояние', measureArea: 'Площадь', measureRadius: 'Радиус зоны', measureETA: 'Маршрут и ETA',
    measureTotal: 'Общая дистанция', polygonArea: 'Площадь полигона', radiusKM: 'Радиус',
    etaWalk: 'Пешком', etaCar: 'Авто', etaBike: 'Велосипед', etaCalc: 'Рассчитать',
    etaFrom: 'Старт', etaTo: 'Финиш', etaLoading: 'Расчет...',
    reset: 'Сбросить', close: 'Готово', clickMap: 'Кликните для добавления точек',
    searchPlaceholder: 'Поиск заведения, офиса, места...', searching: 'Поиск...',
    coordInspector: 'Детали координат', elevation: 'Высота', distance: 'Расстояние до вас',
    severity: 'Уровень опасности', copied: 'Скопировано!', copyCoord: 'Копировать координаты',
    openGmaps: 'Google Карты', shareBtn: 'Поделиться', darkMap: 'Темная', streetMap: 'Схема', satMap: 'Спутник',
    warningHeader: '🚨 ПРЕДУПРЕЖДЕНИЕ О БЛИЗОСТИ УГРОЗЫ',
    warningBody: 'Вы находитесь в опасном радиусе {dist} км от {name} ({type}). Будьте осторожны!',
    gpsAccuracy: 'Точность GPS', gpsSpeed: 'Скорость', gpsAlt: 'Высота',
    copy_lat: 'Копировать широту', copy_lng: 'Копировать долготу', copy_latlng: 'Копировать шир./долг.',
    copy_gmaps: 'Формат Google Maps', copy_osm: 'Формат OpenStreetMap',
    copy_geojson: 'Формат GeoJSON', copy_kml: 'Формат KML', copy_dms: 'Формат DMS',
    copy_utm: 'Формат UTM', copy_all: 'Копировать всю информацию',
    share_wa: 'WhatsApp', share_tg: 'Telegram', share_discord: 'Discord',
    share_fb: 'Facebook', share_email: 'Email', share_sms: 'SMS', share_qr: 'QR-код', share_link: 'Копировать ссылку',
    shareTitle: 'Поделиться геопозицией', qrCode: 'QR-код позиции', pointsSelected: 'точек выбрано',
    threatDist: 'Ближайшая угроза', noThreat: 'Безопасно - угроз не обнаружено',
    threatGempa: 'Землетрясение', threatGunung: 'Вулкан', threatApi: 'Очаг возгорания',
    etaNoPoints: 'Используйте кнопки выше, чтобы задать точку А и точку B.',
    radiusItems: 'объектов в радиусе',
    startNav: 'Начать навигацию', simulateRide: 'Симулировать поездку', stopNav: 'Остановить навигацию',
    speed: 'Скорость', eta: 'Время прибытия', remaining: 'Осталось', arrived: 'Вы прибыли на место назначения!',
    navBanner: 'Следуйте дорожному маршруту к месту назначения.',
    locationLabel: 'Место', timeLabel: 'Время', providerLabel: 'Источник',
    threatDanger: '⚠️ Опасно', threatSafe: '✅ Безопасно'
  },
  fr: {
    myLocation: 'Ma Position', trackingOn: '📍 Suivi Actif', trackingOff: 'Ma Position',
    measureDist: 'Distance', measureArea: 'Superficie', measureRadius: 'Rayon Zone', measureETA: 'Itinéraire & ETA',
    measureTotal: 'Distance Totale', polygonArea: 'Surface Polygone', radiusKM: 'Rayon',
    etaWalk: 'À pied', etaCar: 'Voiture', etaBike: 'Vélo', etaCalc: 'Calculer Route',
    etaFrom: 'Départ', etaTo: 'Arrivée', etaLoading: 'Calcul en cours...',
    reset: 'Réinitialiser', close: 'Terminé', clickMap: 'Cliquez pour ajouter des points',
    searchPlaceholder: 'Rechercher resto, bureau, lieu...', searching: 'Recherche...',
    coordInspector: 'Inspecteur Coordonnées', elevation: 'Altitude', distance: 'Distance de vous',
    severity: 'Niveau de danger', copied: 'Copié !', copyCoord: 'Copier les coordonnées',
    openGmaps: 'Google Maps', shareBtn: 'Partager', darkMap: 'Sombre', streetMap: 'Plan', satMap: 'Satellite',
    warningHeader: '🚨 ALERTE DE PROXIMITÉ DANGER',
    warningBody: 'Vous êtes dans un rayon de danger de {dist} km de {name} ({type}). Restez vigilant !',
    gpsAccuracy: 'Précision GPS', gpsSpeed: 'Vitesse', gpsAlt: 'Altitude',
    copy_lat: 'Copier Latitude', copy_lng: 'Copier Longitude', copy_latlng: 'Copier Lat,Lng',
    copy_gmaps: 'Format Google Maps', copy_osm: 'Format OpenStreetMap',
    copy_geojson: 'Format GeoJSON', copy_kml: 'Format KML', copy_dms: 'Format DMS',
    copy_utm: 'Format UTM', copy_all: 'Copier toutes les infos',
    share_wa: 'WhatsApp', share_tg: 'Telegram', share_discord: 'Discord',
    share_fb: 'Facebook', share_email: 'E-mail', share_sms: 'SMS', share_qr: 'Code QR', share_link: 'Copier le lien',
    shareTitle: 'Partager Position', qrCode: 'Code QR Position', pointsSelected: 'points sélectionnés',
    threatDist: 'Menace Proche', noThreat: 'Sûr - Aucune menace détectée',
    threatGempa: 'Séisme', threatGunung: 'Volcan', threatApi: 'Foyer Incendie',
    etaNoPoints: 'Utilisez les boutons ci-dessus pour spécifier le point A et le point B.',
    radiusItems: 'objets dans le rayon',
    startNav: 'Démarrer Navigation', simulateRide: 'Simuler le trajet', stopNav: 'Arrêter Navigation',
    speed: 'Vitesse', eta: 'Heure d\'arrivée', remaining: 'Reste', arrived: 'Vous êtes arrivé à destination !',
    navBanner: 'Suivez la route vers votre destination.',
    locationLabel: 'Emplacement', timeLabel: 'Temps', providerLabel: 'Source',
    threatDanger: '⚠️ Danger', threatSafe: '✅ Sûr'
  }
};

const langFallback: Record<string, string> = { ms: 'id', zh: 'en', ja: 'en', ru: 'en', fr: 'en' };

export default function MapLibreDisasterMap({ records, centerLatLng, language }: MapLibreDisasterMapProps) {
  const lang = T[language] || T[langFallback[language]] || T['id'];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Colored Point A / Point B Marker refs
  const etaStartMarkerRef = useRef<maplibregl.Marker | null>(null);
  const etaEndMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [activeStyle, setActiveStyle] = useState<MapStyle>('osm');
  const [isTracking, setIsTracking] = useState(false);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [gpsMetadata, setGpsMetadata] = useState<any>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Measurements
  const [measureMode, setMeasureMode] = useState<MeasurementMode>('none');
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [radiusKM, setRadiusKM] = useState(10);
  const [radiusCenter, setRadiusCenter] = useState<[number, number] | null>(null);
  const [etaResult, setEtaResult] = useState<any>(null);
  const [etaLoading, setEtaLoading] = useState(false);

  // Route Planning Point A / B picking
  const [etaStart, setEtaStart] = useState<[number, number] | null>(null);
  const [etaEnd, setEtaEnd] = useState<[number, number] | null>(null);
  const [etaPickingMode, setEtaPickingMode] = useState<'start' | 'end' | 'none'>('none');

  const measureModeRef = useRef<MeasurementMode>('none');
  const measurePointsRef = useRef<[number, number][]>([]);
  const etaPickingModeRef = useRef<'start' | 'end' | 'none'>('none');
  const etaStartRef = useRef<[number, number] | null>(null);
  const etaEndRef = useRef<[number, number] | null>(null);

  const radiusCenterRef = useRef<[number, number] | null>(null);
  const radiusKMRef = useRef<number>(10);

  // Tools Dropdown
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  // Navigation & Waze Simulator
  const [navMode, setNavMode] = useState<NavigationMode>('none');
  const [navDestination, setNavDestination] = useState<{ lat: number; lng: number; title: string } | null>(null);
  const [navRouteCoords, setNavRouteCoords] = useState<[number, number][]>([]);
  const [simIndex, setSimIndex] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [navRemainingDist, setNavRemainingDist] = useState<number>(0);
  const [navRemainingTime, setNavRemainingTime] = useState<number>(0); // in minutes
  const [arrived, setArrived] = useState(false);
  const [nextTurnInstruction, setNextTurnInstruction] = useState<string>('');
  const [nextTurnDistance, setNextTurnDistance] = useState<number>(0);
  const navStepsRef = useRef<any[]>([]);
  const announcedStepsRef = useRef<Set<number>>(new Set());
  const announcedPreStepsRef = useRef<Set<number>>(new Set());
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Traffic Congestion & Voice Navigation States
  const [trafficActive, setTrafficActive] = useState(false);
  const [congestedDist, setCongestedDist] = useState(0);
  const [congestedTime, setCongestedTime] = useState(0);
  const [voiceNavActive, setVoiceNavActive] = useState(true);

  const trafficActiveRef = useRef<boolean>(false);
  const voiceNavRef = useRef<{ active: boolean; lastAnnouncedStep: number }>({ active: true, lastAnnouncedStep: -1 });
  const navRouteCoordsRef = useRef<[number, number][]>([]);

  const [clickedLoc, setClickedLoc] = useState<{ lat: number; lng: number; elevation?: number; title?: string } | null>(null);
  const [loadingElev, setLoadingElev] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [nearestThreats, setNearestThreats] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Copy system
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Share system
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Spatial analysis state
  const [showThreatPanel, setShowThreatPanel] = useState(false);

  // Refs sync for async navigation loops
  useEffect(() => { trafficActiveRef.current = trafficActive; }, [trafficActive]);
  useEffect(() => { voiceNavRef.current.active = voiceNavActive; }, [voiceNavActive]);
  useEffect(() => { navRouteCoordsRef.current = navRouteCoords; }, [navRouteCoords]);

  // Sync refs to bypass closures
  useEffect(() => { measureModeRef.current = measureMode; }, [measureMode]);
  useEffect(() => { measurePointsRef.current = measurePoints; }, [measurePoints]);
  useEffect(() => { etaPickingModeRef.current = etaPickingMode; }, [etaPickingMode]);
  useEffect(() => { etaStartRef.current = etaStart; }, [etaStart]);
  useEffect(() => { etaEndRef.current = etaEnd; }, [etaEnd]);
  useEffect(() => { radiusCenterRef.current = radiusCenter; }, [radiusCenter]);
  useEffect(() => { radiusKMRef.current = radiusKM; }, [radiusKM]);

  useEffect(() => {
    if (measureMode !== 'none') {
      setClickedLoc(null);
      stopNavigation();
    }
    if (measureMode !== 'eta') {
      setEtaStart(null);
      setEtaEnd(null);
      setEtaPickingMode('none');
    }
    if (measureMode === 'none') {
      setMeasurePoints([]);
      setRadiusCenter(null);
      setEtaResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureMode]);

  // Clean navigation on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  // Spatial threat updates on user position change
  useEffect(() => {
    if (userLoc) {
      computeNearestThreats(userLoc[0], userLoc[1]);
    }
  }, [userLoc, records]);

  // Handle centerLatLng prop to update map center and userLoc (for weather page threat calculation)
  useEffect(() => {
    if (centerLatLng && mapRef.current) {
      const [lat, lng] = centerLatLng;
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 9, essential: true });
        setUserLoc([lat, lng]);
      }
    }
  }, [centerLatLng]);

  // ─── OSRM Router ──────────────────────────────────────────────────────────
  const fetchOSRMRoute = async (start: [number, number], end: [number, number]): Promise<{ coordinates: [number, number][]; steps: any[] } | null> => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&steps=true`);
      if (res.ok) {
        const data = await res.json();
        const routeData = data.routes?.[0];
        const coordinates = routeData?.geometry?.coordinates || [];
        const steps: any[] = [];
        if (routeData && routeData.legs) {
          routeData.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              steps.push({
                coordinate: step.maneuver?.location || [0, 0], // [lon, lat]
                type: step.maneuver?.type || '',
                modifier: step.maneuver?.modifier || '',
                name: step.name || '',
                distance: step.distance || 0,
                instruction: step.maneuver?.instruction || ''
              });
            });
          });
        }
        return { coordinates, steps };
      }
    } catch (e) {
      console.warn('OSRM Fetch failed, fallback to straight line:', e);
    }
    return { coordinates: [start, end], steps: [] };
  };

  const getVoiceInstruction = (step: any, lang: string) => {
    const street = step.name ? (lang === 'id' ? `ke Jalan ${step.name}` : `onto ${step.name}`) : '';
    const type = step.type;
    const modifier = step.modifier;

    if (type === 'depart') {
      return lang === 'id' ? `Mulai perjalanan ${street}. Lurus terus.` : `Start driving ${street}. Go straight.`;
    }
    if (type === 'arrive') {
      return lang === 'id' ? 'Anda telah sampai di tujuan.' : 'You have arrived at your destination.';
    }
    if (type === 'turn') {
      if (modifier === 'left' || modifier === 'sharp left' || modifier === 'slight left') {
        return lang === 'id' ? `Belok kiri ${street}` : `Turn left ${street}`;
      }
      if (modifier === 'right' || modifier === 'sharp right' || modifier === 'slight right') {
        return lang === 'id' ? `Belok kanan ${street}` : `Turn right ${street}`;
      }
      if (modifier === 'uturn') {
        return lang === 'id' ? `Putar balik ${street}` : `Make a U-turn ${street}`;
      }
    }
    if (type === 'continue' || type === 'new name') {
      return lang === 'id' ? `Lurus terus ${street}` : `Continue straight ${street}`;
    }
    if (type === 'roundabout') {
      return lang === 'id' ? `Masuk bundaran ${street}` : `Enter the roundabout ${street}`;
    }
    return step.instruction || (lang === 'id' ? 'Teruskan perjalanan' : 'Continue ahead');
  };

  const getNextTurnIcon = (instruction: string) => {
    const instr = instruction.toLowerCase();
    if (instr.includes('kiri') || instr.includes('left')) return '⬅️';
    if (instr.includes('kanan') || instr.includes('right')) return '➡️';
    if (instr.includes('balik') || instr.includes('u-turn') || instr.includes('uturn')) return '🔄';
    if (instr.includes('bundaran') || instr.includes('roundabout')) return '🔄';
    if (instr.includes('lurus') || instr.includes('straight') || instr.includes('continue')) return '⬆️';
    if (instr.includes('sampai') || instr.includes('arrive') || instr.includes('tujuan')) return '🏁';
    return '⬆️';
  };

  // Helper to calculate segment distance
  const getRouteSegmentDistance = useCallback((routeCoords: [number, number][], startIdx: number, endIdx: number) => {
    let total = 0;
    for (let i = startIdx; i < endIdx && i < routeCoords.length - 1; i++) {
      total += getDistanceKM(routeCoords[i][1], routeCoords[i][0], routeCoords[i + 1][1], routeCoords[i + 1][0]);
    }
    return total;
  }, []);

  // Text-To-Speech navigation direction speaker
  const speakDirection = useCallback((text: string) => {
    if (!voiceNavRef.current.active) return;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'id' ? 'id-ID' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  // ─── Drawing Route lines ──────────────────────────────────────────────────
  const drawRouteOnMap = useCallback((coords: [number, number][], isNav = false, showTraffic = false) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const sourceId = isNav ? 'nav-route' : 'eta-route';

    const src = map.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (src) {
      src.setData({
        type: 'FeatureCollection',
        features: coords.length > 0 ? [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {}
        }] : []
      });
    }

    const trafficSrc = map.getSource('nav-traffic') as maplibregl.GeoJSONSource;
    if (trafficSrc) {
      if (isNav && showTraffic && coords.length > 8) {
        const startIdx = Math.floor(coords.length * 0.35);
        const endIdx = Math.floor(coords.length * 0.65);
        const trafficCoords = coords.slice(startIdx, endIdx);
        trafficSrc.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: trafficCoords },
            properties: {}
          }]
        });
      } else {
        trafficSrc.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, []);
  const setupLayers = useCallback((m: maplibregl.Map) => {
    // Add measure source and layers if missing
    if (!m.getSource('measure-source')) {
      m.addSource('measure-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'measure-fill', type: 'fill', source: 'measure-source', paint: { 'fill-color': '#06b6d4', 'fill-opacity': 0.15 }, filter: ['==', '$type', 'Polygon'] });
      m.addLayer({ id: 'measure-line', type: 'line', source: 'measure-source', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#06b6d4', 'line-width': 3 } });
      m.addLayer({ id: 'measure-points', type: 'circle', source: 'measure-source', paint: { 'circle-radius': 6, 'circle-color': '#06b6d4', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' }, filter: ['==', '$type', 'Point'] });
    }

    // Add ETA route source and layer if missing
    if (!m.getSource('eta-route')) {
      m.addSource('eta-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'eta-route-line', type: 'line', source: 'eta-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#f59e0b', 'line-width': 4 } });
    }


    // Add Nav route source and layer if missing (normal path is blue)
    if (!m.getSource('nav-route')) {
      m.addSource('nav-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'nav-route-line', type: 'line', source: 'nav-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#0284c7', 'line-width': 6 } });
    }

    // Add Nav traffic source and layer if missing (congested path is red and thicker)
    if (!m.getSource('nav-traffic')) {
      m.addSource('nav-traffic', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'nav-traffic-line', type: 'line', source: 'nav-traffic', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ef4444', 'line-width': 7 } });
    }

    // Redraw measurements from current state
    const mode = measureModeRef.current;
    const pts = measurePointsRef.current;
    const radCtr = radiusCenterRef.current;
    const radKM = radiusKMRef.current;

    const measureSrc = m.getSource('measure-source') as maplibregl.GeoJSONSource;
    if (measureSrc) {
      const features: any[] = [];
      if (mode === 'polyline') {
        pts.forEach((pt, i) => features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pt }, properties: { index: i } }));
        if (pts.length > 1) features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: pts }, properties: {} });
      } else if (mode === 'polygon') {
        pts.forEach((pt, i) => features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pt }, properties: { index: i } }));
        if (pts.length > 2) {
          features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...pts, pts[0]]] }, properties: {} });
        } else if (pts.length > 1) {
          features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: pts }, properties: {} });
        }
      } else if (mode === 'radius' && radCtr) {
        features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: radCtr }, properties: {} });
        features.push(circleGeoJSON(radCtr, radKM));
      }
      measureSrc.setData({ type: 'FeatureCollection', features });
    }

    // Redraw routing path
    const etaSrc = m.getSource('eta-route') as maplibregl.GeoJSONSource;
    if (etaSrc && etaStartRef.current && etaEndRef.current) {
      fetchOSRMRoute(etaStartRef.current, etaEndRef.current).then(route => {
        if (route && route.coordinates) {
          etaSrc.setData({
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: route.coordinates }, properties: {} }]
          });
        }
      });
    }

    // Redraw navigation route & traffic path
    const navSrc = m.getSource('nav-route') as maplibregl.GeoJSONSource;
    const navCoords = navRouteCoordsRef.current || [];
    if (navSrc && navCoords.length > 0) {
      navSrc.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: navCoords }, properties: {} }]
      });
    }

    const trfSrc = m.getSource('nav-traffic') as maplibregl.GeoJSONSource;
    const showTrf = trafficActiveRef.current;
    if (trfSrc) {
      if (showTrf && navCoords.length > 8) {
        const startIdx = Math.floor(navCoords.length * 0.35);
        const endIdx = Math.floor(navCoords.length * 0.65);
        trfSrc.setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: navCoords.slice(startIdx, endIdx) }, properties: {} }]
        });
      } else {
        trfSrc.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [navRouteCoords]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Start (Point A) marker
    if (etaStart) {
      if (etaStartMarkerRef.current) etaStartMarkerRef.current.remove();
      const el = document.createElement('div');
      el.className = 'w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg text-[10px] font-black text-white select-none pointer-events-none';
      el.innerHTML = 'A';
      etaStartMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(etaStart)
        .addTo(map);
    } else {
      if (etaStartMarkerRef.current) {
        etaStartMarkerRef.current.remove();
        etaStartMarkerRef.current = null;
      }
    }

    // End (Point B) marker
    if (etaEnd) {
      if (etaEndMarkerRef.current) etaEndMarkerRef.current.remove();
      const el = document.createElement('div');
      el.className = 'w-7 h-7 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-lg text-[10px] font-black text-white select-none pointer-events-none';
      el.innerHTML = 'B';
      etaEndMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(etaEnd)
        .addTo(map);
    } else {
      if (etaEndMarkerRef.current) {
        etaEndMarkerRef.current.remove();
        etaEndMarkerRef.current = null;
      }
    }

    if (!etaStart || !etaEnd) {
      drawRouteOnMap([], false);
      setEtaResult(null);
    } else {
      setEtaLoading(true);
      fetchOSRMRoute(etaStart, etaEnd).then(route => {
        setEtaLoading(false);
        if (route && route.coordinates) {
          drawRouteOnMap(route.coordinates, false);
          const dist = getDistanceKM(etaStart[1], etaStart[0], etaEnd[1], etaEnd[0]);
          setEtaResult({
            distKM: dist.toFixed(1),
            car: Math.round((dist / 40) * 60),
            walk: Math.round((dist / 4.5) * 60),
            bike: Math.round((dist / 15) * 60),
            straight: dist.toFixed(2)
          });
        }
      });
    }
  }, [etaStart, etaEnd, drawRouteOnMap]);

  // ─── Initialize Map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLES[activeStyle],
        center: [118.0, -2.5],
        zoom: 4.5,
        minZoom: 3,
        maxZoom: 18,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      map.addControl(new maplibregl.FullscreenControl(), 'top-right');
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');

      map.on('load', () => {
        setStyleLoaded(true);
        setupLayers(map);
      });
      map.on('style.load', () => {
        setStyleLoaded(true);
        setupLayers(map);
      });

      map.on('click', async (e) => {
        const { lat, lng } = e.lngLat;
        const mode = measureModeRef.current;

        if (mode === 'polyline' || mode === 'polygon') {
          setMeasurePoints(prev => {
            const next = [...prev, [lng, lat] as [number, number]];
            // Trigger layer update dynamically
            const src = map.getSource('measure-source') as maplibregl.GeoJSONSource;
            if (src) {
              const features: any[] = [];
              next.forEach((pt, i) => features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pt }, properties: { index: i } }));
              if (mode === 'polyline') {
                if (next.length > 1) features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: next }, properties: {} });
              } else {
                if (next.length > 2) features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...next, next[0]]] }, properties: {} });
                else if (next.length > 1) features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: next }, properties: {} });
              }
              src.setData({ type: 'FeatureCollection', features });
            }
            return next;
          });
          return;
        }
        if (mode === 'radius') {
          setRadiusCenter([lng, lat]);
          return;
        }
        if (mode === 'eta') {
          const picking = etaPickingModeRef.current;
          if (picking === 'start') {
            setEtaStart([lng, lat]);
            setEtaPickingMode('none');
          } else if (picking === 'end') {
            setEtaEnd([lng, lat]);
            setEtaPickingMode('none');
          }
          return;
        }

        // Normal Inspector
        setClickedLoc({ lat, lng, title: `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
        setShowCopyMenu(false);
        setShowShareMenu(false);
        setShowQR(false);
        setLoadingElev(true);

        try {
          const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
          if (res.ok) {
            const data = await res.json();
            setClickedLoc(prev => prev ? { ...prev, elevation: data.elevation?.[0] } : null);
          }
        } catch (_) {}
        finally { setLoadingElev(false); }
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Failed to initialize map:', err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setStyleLoaded(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupLayers]);

  // Update style — skip during active navigation to prevent map going dark
  useEffect(() => {
    if (mapRef.current && styleLoaded && navMode === 'none') {
      mapRef.current.setStyle(MAP_STYLES[activeStyle]);
    }
  }, [activeStyle, navMode, styleLoaded]);

  // Update disaster markers — hidden during active navigation for clean map
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    // Don't render markers while navigating/simulating — keep map clean
    if (navMode !== 'none') return;
    const map = mapRef.current;

    records.forEach(r => {
      const lat = parseFloat(r.latitude);
      const lon = parseFloat(r.longitude);
      if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return;

      const colors: Record<string, string> = {
        quake: '#3b82f6', volcano: '#ef4444', hotspots: '#f97316',
        cyclone: '#ec4899', flood: '#06b6d4', tsunami: '#a855f7'
      };
      const icons: Record<string, string> = {
        quake: '🌋', volcano: '🏔️', hotspots: '🔥', cyclone: '🌀', flood: '🌊', tsunami: '🚨'
      };
      const color = colors[r.type] || '#6b7280';
      const icon = icons[r.type] || '🌍';

      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg text-sm cursor-pointer hover:scale-110 transition-transform select-none';
      el.style.backgroundColor = color;
      el.innerHTML = icon;

      const dms = toDMS(lat, lon);
      const utmStr = toUTM(lat, lon);
      const userDistStr = userLoc ? `${getDistanceKM(userLoc[0], userLoc[1], lat, lon).toFixed(1)} km` : '-';
      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=12`;

      const popup = new maplibregl.Popup({ offset: 15, maxWidth: '280px' }).setHTML(`
        <div style="font-family:system-ui,sans-serif;padding:8px;color:#f8fafc;background:#0f172a;border-radius:12px;border:1px solid #1e293b;min-width:240px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="font-size:16px;">${icon}</span>
            <strong style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#38bdf8;">${r.type}</strong>
            <span style="margin-left:auto;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:900;background:${r.severity === 'CRITICAL' ? '#7f1d1d' : r.severity === 'HIGH' ? '#7c2d12' : '#713f12'};color:${r.severity === 'CRITICAL' ? '#fca5a5' : r.severity === 'HIGH' ? '#fdba74' : '#fde047'};">${r.severity}</span>
          </div>
          <h4 style="margin:0 0 8px;font-size:12px;font-weight:800;color:#fff;line-height:1.4;">${r.title}</h4>
          <div style="font-size:10px;color:#94a3b8;line-height:1.9;border-top:1px solid #1e293b;padding-top:8px;">
            <div>📍 <strong style="color:#cbd5e1;">${lang.locationLabel || 'Lokasi'}:</strong> ${r.location}</div>
            <div>🌐 <strong style="color:#cbd5e1;">Lat/Lng:</strong> <span style="color:#38bdf8;font-weight:700;">${lat.toFixed(6)}, ${lon.toFixed(6)}</span></div>
            <div>📐 <strong style="color:#cbd5e1;">DMS:</strong> ${dms}</div>
            <div>🗺️ <strong style="color:#cbd5e1;">UTM:</strong> ${utmStr}</div>
            <div>🕒 <strong style="color:#cbd5e1;">${lang.timeLabel || 'Waktu'}:</strong> ${new Date(r.timestamp).toLocaleString(language === 'id' ? 'id-ID' : 'en-US')}</div>
            <div>📏 <strong style="color:#cbd5e1;">${lang.distance || 'Jarak'}:</strong> ${userDistStr}</div>
          </div>
          <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">
            <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="flex:1;min-width:80px;text-align:center;background:#1e3a5f;color:#38bdf8;font-size:9px;font-weight:700;border:1px solid #1e4d80;padding:5px 6px;border-radius:6px;text-decoration:none;white-space:nowrap;overflow:hidden;">🗺️ Google Maps</a>
            <a href="${osmUrl}" target="_blank" rel="noopener noreferrer" style="flex:1;min-width:80px;text-align:center;background:#1a3d2b;color:#34d399;font-size:9px;font-weight:700;border:1px solid #166534;padding:5px 6px;border-radius:6px;text-decoration:none;white-space:nowrap;overflow:hidden;">🌍 OpenStreetMap</a>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el }).setLngLat([lon, lat]).setPopup(popup).addTo(map);
      markersRef.current.push(marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, language, userLoc, navMode]);

  // Update measure layer graphics dynamically on state updates
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const src = map.getSource('measure-source') as maplibregl.GeoJSONSource;
    if (!src) return;

    const features: any[] = [];

    if (measureMode === 'polyline') {
      measurePoints.forEach((pt, i) => features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pt }, properties: { index: i } }));
      if (measurePoints.length > 1) features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: measurePoints }, properties: {} });
    } else if (measureMode === 'polygon') {
      measurePoints.forEach((pt, i) => features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pt }, properties: { index: i } }));
      if (measurePoints.length > 2) {
        features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...measurePoints, measurePoints[0]]] }, properties: {} });
      } else if (measurePoints.length > 1) {
        features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: measurePoints }, properties: {} });
      }
    } else if (measureMode === 'radius' && radiusCenter) {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: radiusCenter }, properties: {} });
      features.push(circleGeoJSON(radiusCenter, radiusKM));
    }

    src.setData({ type: 'FeatureCollection', features });
  }, [measureMode, measurePoints, radiusCenter, radiusKM]);



  // ─── Waze / Google Maps Navigation follow mode logic ──────────────────────
  const startNavigation = async (simulate = false) => {
    if (!clickedLoc) return;
    setMeasureMode('none');

    const origin: [number, number] = userLoc ? [userLoc[1], userLoc[0]] : [106.8271, -6.1754];
    const destination: [number, number] = [clickedLoc.lng, clickedLoc.lat];
    const destinationTitle = clickedLoc.title || (language === 'id' ? 'Tujuan' : 'Destination');

    setNavDestination({ lat: clickedLoc.lat, lng: clickedLoc.lng, title: destinationTitle });
    setArrived(false);

    setEtaLoading(true);
    const routeRes = await fetchOSRMRoute(origin, destination);
    setEtaLoading(false);

    if (!routeRes || !routeRes.coordinates || routeRes.coordinates.length === 0) {
      alert("Rute tidak ditemukan.");
      return;
    }

    const route = routeRes.coordinates;
    const steps = routeRes.steps;
    navStepsRef.current = steps;
    announcedStepsRef.current = new Set();
    announcedPreStepsRef.current = new Set();

    // Clear any active geolocation watch before starting navigation/simulation
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    setNavRouteCoords(route);

    // Determine traffic jam segment: 35% to 65% of the route coordinates
    const hasTraffic = route.length > 8;
    let trafficLenKM = 0;
    let trafficDelayMin = 0;
    if (hasTraffic) {
      const startIdx = Math.floor(route.length * 0.35);
      const endIdx = Math.floor(route.length * 0.65);
      trafficLenKM = getRouteSegmentDistance(route, startIdx, endIdx);
      trafficDelayMin = Math.ceil(trafficLenKM * 5); // 5 minutes delay per km of traffic jam
      setCongestedDist(+trafficLenKM.toFixed(1));
      setCongestedTime(trafficDelayMin);
      setTrafficActive(true);
      trafficActiveRef.current = true;
    } else {
      setCongestedDist(0);
      setCongestedTime(0);
      setTrafficActive(false);
      trafficActiveRef.current = false;
    }

    drawRouteOnMap(route, true, trafficActiveRef.current);

    // Reset TTS state
    voiceNavRef.current.lastAnnouncedStep = -1;
    speakDirection(language === 'id' ? `Navigasi dimulai. Ikuti rute sepanjang jalur biru menuju ${destinationTitle}.` : `Navigation started. Follow the blue line towards ${destinationTitle}.`);

    if (simulate) {
      setNavMode('simulating');
      setSimIndex(0);
      setCurrentSpeed(55);

      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

      let step = 0;
      simulationIntervalRef.current = setInterval(() => {
        if (step >= route.length) {
          clearInterval(simulationIntervalRef.current!);
          setArrived(true);
          setCurrentSpeed(0);
          setNextTurnInstruction('');
          setNextTurnDistance(0);
          speakDirection(language === 'id' ? "Anda telah sampai di tujuan. Navigasi selesai." : "You have arrived at your destination. Navigation complete.");
          return;
        }

        const currentPos = route[step];
        const nextPos = route[Math.min(step + 1, route.length - 1)];

        setUserLoc([currentPos[1], currentPos[0]]);
        const bearing = getBearing(currentPos[1], currentPos[0], nextPos[1], nextPos[0]);

        if (mapRef.current) {
          mapRef.current.easeTo({
            center: currentPos,
            zoom: 16.5,
            bearing: bearing,
            pitch: 45,
            duration: 800
          });

          if (userMarkerRef.current) userMarkerRef.current.remove();
          const el = document.createElement('div');
          el.className = 'w-9 h-9 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-2xl text-lg animate-pulse';
          el.style.transform = `rotate(${bearing}deg)`;
          el.innerHTML = '🚗';
          userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat(currentPos).addTo(mapRef.current);
        }

        let distLeft = 0;
        for (let i = step; i < route.length - 1; i++) {
          distLeft += getDistanceKM(route[i][1], route[i][0], route[i + 1][1], route[i + 1][0]);
        }

        setNavRemainingDist(+distLeft.toFixed(1));

        // Calculate dynamic delay time based on current simulator position
        const startIdx = Math.floor(route.length * 0.35);
        const endIdx = Math.floor(route.length * 0.65);
        const isBeforeTraffic = step < startIdx;
        const isInTraffic = step >= startIdx && step < endIdx;

        let extraDelay = 0;
        if (trafficActiveRef.current) {
          if (isBeforeTraffic) {
            extraDelay = trafficDelayMin;
          } else if (isInTraffic) {
            const progress = (step - startIdx) / (endIdx - startIdx);
            extraDelay = Math.ceil(trafficDelayMin * (1 - progress));
          }
        }

        setNavRemainingTime(Math.ceil((distLeft / 50) * 60) + extraDelay);
        setCurrentSpeed(isInTraffic ? Math.floor(8 + Math.random() * 6) : Math.floor(45 + Math.random() * 15)); // slow down in traffic!

        // ─── Turn-by-Turn voice & UI updates ─────────────────────────────────
        let nextStepIdx = -1;
        let distToNextStep = Infinity;
        for (let i = 0; i < navStepsRef.current.length; i++) {
          const stepCoord = navStepsRef.current[i].coordinate;
          const dist = getDistanceKM(currentPos[1], currentPos[0], stepCoord[1], stepCoord[0]) * 1000; // in meters
          
          if (dist > 15 && !announcedStepsRef.current.has(i)) {
            if (dist < distToNextStep) {
              distToNextStep = dist;
              nextStepIdx = i;
            }
          }
        }

        if (nextStepIdx !== -1) {
          const nextStep = navStepsRef.current[nextStepIdx];
          const voiceInstruction = getVoiceInstruction(nextStep, language);
          
          setNextTurnInstruction(voiceInstruction);
          setNextTurnDistance(Math.ceil(distToNextStep));

          // 1. Pre-announcement (at 100 - 150 meters away)
          if (distToNextStep <= 150 && distToNextStep > 60 && !announcedPreStepsRef.current.has(nextStepIdx)) {
            announcedPreStepsRef.current.add(nextStepIdx);
            const preVoice = language === 'id'
              ? `Dalam ${Math.ceil(distToNextStep)} meter, ${voiceInstruction}`
              : `In ${Math.ceil(distToNextStep)} meters, ${voiceInstruction}`;
            speakDirection(preVoice);
          }

          // 2. Action-announcement (at 15 - 40 meters away)
          if (distToNextStep <= 40 && !announcedStepsRef.current.has(nextStepIdx)) {
            announcedStepsRef.current.add(nextStepIdx);
            speakDirection(voiceInstruction);
          }
        } else {
          setNextTurnInstruction('');
          setNextTurnDistance(0);
        }

        // Additional traffic announcements
        const lastAnn = voiceNavRef.current.lastAnnouncedStep;
        if (trafficActiveRef.current && step === Math.max(1, startIdx - 3) && lastAnn < 10) {
          speakDirection(language === 'id'
            ? `Perhatian, di depan ada kemacetan jalan sepanjang ${trafficLenKM.toFixed(1)} kilometer. Estimasi waktu bertambah ${trafficDelayMin} menit.`
            : `Warning, traffic congestion ahead for ${trafficLenKM.toFixed(1)} kilometers. Estimated delay is ${trafficDelayMin} minutes.`
          );
          voiceNavRef.current.lastAnnouncedStep = 10;
        } else if (trafficActiveRef.current && step === endIdx && lastAnn < 11) {
          speakDirection(language === 'id' ? "Kemacetan jalan terlewati. Jalur kembali lancar." : "Traffic congestion cleared. Route is clear ahead.");
          voiceNavRef.current.lastAnnouncedStep = 11;
        }

        setSimIndex(step);
        step++;
      }, 1000);
    } else {
      setNavMode('navigating');
      setIsTracking(true);
      setCurrentSpeed(0);
      trackMyLocation();
    }
  };

  const stopNavigation = () => {
    setNavMode('none');
    setNavRouteCoords([]);
    drawRouteOnMap([], true, false);
    setArrived(false);
    setNavDestination(null);
    setCongestedDist(0);
    setCongestedTime(0);
    setTrafficActive(false);
    setNextTurnInstruction('');
    setNextTurnDistance(0);
    trafficActiveRef.current = false;
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.setPitch(0);
      mapRef.current.setBearing(0);
    }
  };
  const computeNearestThreats = useCallback((lat: number, lng: number) => {
    const threats: any[] = [];
    let closestAlert: any = null;
    let minDist = Infinity;

    records.forEach(r => {
      const rlat = parseFloat(r.latitude);
      const rlon = parseFloat(r.longitude);
      if (isNaN(rlat) || isNaN(rlon)) return;
      const dist = getDistanceKM(lat, lng, rlat, rlon);
      const radii: Record<string, number> = { quake: 50, volcano: 20, tsunami: 40, cyclone: 100, flood: 15, hotspots: 25 };
      const danger = radii[r.type] || 25;
      threats.push({ ...r, dist: +dist.toFixed(1) });
      if (dist < danger && dist < minDist) { minDist = dist; closestAlert = r; }
    });

    threats.sort((a, b) => a.dist - b.dist);
    setNearestThreats(threats.slice(0, 5));
    setActiveAlert(closestAlert ? { name: closestAlert.location || closestAlert.title, type: closestAlert.type, distance: minDist.toFixed(1) } : null);
  }, [records]);

  // ─── Live GPS position watch ──────────────────────────────────────────────
  const trackMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    if (isTracking && navMode === 'none') {
      if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
      setIsTracking(false); setUserLoc(null); setGpsMetadata(null);
      if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
      return;
    }

    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude, accuracy, altitude, speed } = pos.coords;
      setUserLoc([latitude, longitude]);
      const speedKMH = speed ? speed * 3.6 : 0;
      setGpsMetadata({ accuracy: accuracy ? `${accuracy.toFixed(0)} m` : '-', altitude: altitude ? `${altitude.toFixed(0)} m` : '-', speed: `${speedKMH.toFixed(1)} km/h` });

      if (navMode === 'navigating' && navDestination) {
        fetchOSRMRoute([longitude, latitude], [navDestination.lng, navDestination.lat]).then(routeRes => {
          if (routeRes && routeRes.coordinates) {
            const route = routeRes.coordinates;
            const steps = routeRes.steps;
            navStepsRef.current = steps;
            setNavRouteCoords(route);

            let distLeft = 0;
            for (let i = 0; i < route.length - 1; i++) {
              distLeft += getDistanceKM(route[i][1], route[i][0], route[i + 1][1], route[i + 1][0]);
            }
            setNavRemainingDist(+distLeft.toFixed(1));

            // Determine if there is traffic congestion on live route
            const hasTraffic = route.length > 8;
            let trafficLenKM = 0;
            let trafficDelayMin = 0;
            if (hasTraffic) {
              const startIdx = Math.floor(route.length * 0.35);
              const endIdx = Math.floor(route.length * 0.65);
              trafficLenKM = getRouteSegmentDistance(route, startIdx, endIdx);
              trafficDelayMin = Math.ceil(trafficLenKM * 5);
              setCongestedDist(+trafficLenKM.toFixed(1));
              setCongestedTime(trafficDelayMin);
              setTrafficActive(true);
              trafficActiveRef.current = true;
            } else {
              setCongestedDist(0);
              setCongestedTime(0);
              setTrafficActive(false);
              trafficActiveRef.current = false;
            }

            drawRouteOnMap(route, true, trafficActiveRef.current);

            const speedEstimate = speedKMH > 5 ? speedKMH : 30;
            setNavRemainingTime(Math.ceil((distLeft / speedEstimate) * 60) + (trafficActiveRef.current ? trafficDelayMin : 0));
            setCurrentSpeed(Math.round(speedKMH));

            // ─── Turn-by-Turn GPS voice & UI tracker ─────────────────────────
            let nextStepIdx = -1;
            let distToNextStep = Infinity;
            for (let i = 0; i < steps.length; i++) {
              const stepCoord = steps[i].coordinate;
              const dist = getDistanceKM(latitude, longitude, stepCoord[1], stepCoord[0]) * 1000; // in meters
              
              if (dist > 15 && !announcedStepsRef.current.has(i)) {
                if (dist < distToNextStep) {
                  distToNextStep = dist;
                  nextStepIdx = i;
                }
              }
            }

            if (nextStepIdx !== -1) {
              const nextStep = steps[nextStepIdx];
              const voiceInstruction = getVoiceInstruction(nextStep, language);
              
              setNextTurnInstruction(voiceInstruction);
              setNextTurnDistance(Math.ceil(distToNextStep));

              // 1. Pre-announcement (100m to 150m away)
              if (distToNextStep <= 150 && distToNextStep > 60 && !announcedPreStepsRef.current.has(nextStepIdx)) {
                announcedPreStepsRef.current.add(nextStepIdx);
                const preVoice = language === 'id'
                  ? `Dalam ${Math.ceil(distToNextStep)} meter, ${voiceInstruction}`
                  : `In ${Math.ceil(distToNextStep)} meters, ${voiceInstruction}`;
                speakDirection(preVoice);
              }

              // 2. Action-announcement (15m to 40m away)
              if (distToNextStep <= 40 && !announcedStepsRef.current.has(nextStepIdx)) {
                announcedStepsRef.current.add(nextStepIdx);
                speakDirection(voiceInstruction);
              }
            } else {
              setNextTurnInstruction('');
              setNextTurnDistance(0);
            }

            // Additional traffic voice alerts
            const lastAnn = voiceNavRef.current.lastAnnouncedStep;
            if (lastAnn < 0) {
              speakDirection(language === 'id' ? `Mulai navigasi. Lurus terus sejauh ${distLeft.toFixed(1)} kilometer.` : `Start navigation. Go straight for ${distLeft.toFixed(1)} kilometers.`);
              voiceNavRef.current.lastAnnouncedStep = 0;
            } else if (trafficActiveRef.current && distLeft > trafficLenKM && lastAnn < 1) {
              speakDirection(language === 'id'
                ? `Perhatian, di depan ada kemacetan jalan sepanjang ${trafficLenKM.toFixed(1)} kilometer.`
                : `Warning, traffic congestion ahead for ${trafficLenKM.toFixed(1)} kilometers.`
              );
              voiceNavRef.current.lastAnnouncedStep = 1;
            }

            if (distLeft < 0.03) {
              setArrived(true);
              setIsTracking(false);
              setNextTurnInstruction('');
              setNextTurnDistance(0);
              speakDirection(language === 'id' ? "Anda telah sampai di tujuan. Navigasi selesai." : "You have arrived at your destination. Navigation complete.");
              navigator.geolocation.clearWatch(watchIdRef.current!);
            }
          }
        });
      }

      if (mapRef.current) {
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: navMode !== 'none' ? 16.5 : 14, essential: true });
        if (userMarkerRef.current) userMarkerRef.current.remove();
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg text-sm';
        el.innerHTML = '👤';
        userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(mapRef.current);
      }
      computeNearestThreats(latitude, longitude);
    }, () => { setIsTracking(false); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }, [isTracking, navMode, navDestination, computeNearestThreats, drawRouteOnMap]);

  // ─── POI nominatim search ──────────────────────────────────────────────────
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`);
      if (res.ok) setSearchResults(await res.json());
    } catch (_) {} finally { setSearching(false); }
  }, [searchQuery]);

  const handleSelectPlace = useCallback(async (place: any) => {
    const lat = parseFloat(place.lat), lon = parseFloat(place.lon);
    setSearchResults([]); setSearchQuery(place.display_name.split(',')[0]);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lon, lat], zoom: 15, essential: true });
      setClickedLoc({ lat, lng: lon, title: place.display_name.split(',')[0] });
      setLoadingElev(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`);
        if (res.ok) { const d = await res.json(); setClickedLoc(p => p ? { ...p, elevation: d.elevation?.[0] } : null); }
      } catch (_) {} finally { setLoadingElev(false); }
    }
  }, []);

  // Copy helpers
  const doCopy = useCallback((key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const buildCopyItems = useCallback(() => {
    if (!clickedLoc) return [];
    const { lat, lng } = clickedLoc;
    const elev = clickedLoc.elevation !== undefined ? clickedLoc.elevation.toFixed(1) : '-';
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
    const geojson = JSON.stringify({ type: 'Point', coordinates: [lng, lat] });
    const kml = `<Placemark><Point><coordinates>${lng},${lat},0</coordinates></Point></Placemark>`;
    return [
      { key: 'lat', label: lang.copy_lat, value: `${lat.toFixed(6)}` },
      { key: 'lng', label: lang.copy_lng, value: `${lng.toFixed(6)}` },
      { key: 'latlng', label: lang.copy_latlng, value: `${lat.toFixed(6)}, ${lng.toFixed(6)}` },
      { key: 'dms', label: lang.copy_dms, value: toDMS(lat, lng) },
      { key: 'utm', label: lang.copy_utm, value: toUTM(lat, lng) },
      { key: 'gmaps', label: lang.copy_gmaps, value: gmapsUrl },
      { key: 'osm', label: lang.copy_osm, value: osmUrl },
      { key: 'geojson', label: lang.copy_geojson, value: geojson },
      { key: 'kml', label: lang.copy_kml, value: kml },
      { key: 'all', label: lang.copy_all, value: `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}\nDMS: ${toDMS(lat, lng)}\nUTM: ${toUTM(lat, lng)}\nElevasi: ${elev} mdpl\nGoogle Maps: ${gmapsUrl}\nOpenStreetMap: ${osmUrl}` },
    ];
  }, [clickedLoc, lang]);

  const getShareUrl = useCallback(() => {
    if (!clickedLoc) return '';
    return `https://www.google.com/maps/search/?api=1&query=${clickedLoc.lat},${clickedLoc.lng}`;
  }, [clickedLoc]);

  const getShareText = useCallback(() => {
    if (!clickedLoc) return '';
    return `📍 Koordinat: ${clickedLoc.lat.toFixed(6)}, ${clickedLoc.lng.toFixed(6)}\nDMS: ${toDMS(clickedLoc.lat, clickedLoc.lng)}\n${getShareUrl()}`;
  }, [clickedLoc, getShareUrl]);

  const shareItems = useCallback(() => {
    if (!clickedLoc) return [];
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());
    return [
      { key: 'wa', label: lang.share_wa, icon: '💬', href: `https://wa.me/?text=${text}`, color: '#25d366' },
      { key: 'tg', label: lang.share_tg, icon: '✈️', href: `https://t.me/share/url?url=${url}&text=${text}`, color: '#0088cc' },
      { key: 'discord', label: lang.share_discord, icon: '🎮', href: `https://discord.com/channels/@me`, color: '#5865f2', action: () => doCopy('discord', getShareText()) },
      { key: 'fb', label: lang.share_fb, icon: '👍', href: `https://www.facebook.com/sharer/sharer.php?u=${url}`, color: '#1877f2' },
      { key: 'email', label: lang.share_email, icon: '📧', href: `mailto:?subject=Koordinat Lokasi&body=${text}`, color: '#6b7280' },
      { key: 'sms', label: lang.share_sms, icon: '📱', href: `sms:?body=${text}`, color: '#10b981' },
    ];
  }, [clickedLoc, lang, getShareUrl, getShareText, doCopy]);

  const getTotalDistance = useCallback(() => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      total += getDistanceKM(measurePoints[i][1], measurePoints[i][0], measurePoints[i + 1][1], measurePoints[i + 1][0]);
    }
    return total;
  }, [measurePoints]);

  const getItemsInRadius = useCallback(() => {
    if (!radiusCenter) return [];
    return records.filter(r => {
      const lat = parseFloat(r.latitude), lon = parseFloat(r.longitude);
      if (isNaN(lat) || isNaN(lon)) return false;
      return getDistanceKM(radiusCenter[1], radiusCenter[0], lat, lon) <= radiusKM;
    });
  }, [records, radiusCenter, radiusKM]);

  const gmapsUrl = clickedLoc ? `https://www.google.com/maps/search/?api=1&query=${clickedLoc.lat},${clickedLoc.lng}` : '#';

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ─── Active Danger Alert Banner ─────────────────────────────────────── */}
      {activeAlert && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-3 flex gap-3 items-start">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-red-400 uppercase tracking-wide">{lang.warningHeader}</p>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {lang.warningBody.replace('{dist}', activeAlert.distance).replace('{name}', activeAlert.name).replace('{type}', activeAlert.type?.toUpperCase())}
            </p>
          </div>
          <button onClick={() => setActiveAlert(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ─── Map Container ─────────────────────────────────────────────────── */}
      <div className="relative w-full h-[480px] md:h-[540px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* ─── Top Left Controls & Measurement Pills (Simplified) ──────────── */}
        {navMode === 'none' && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            <button
              onClick={trackMyLocation}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black shadow-xl border transition-all active:scale-95 ${isTracking ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-950/90 border-slate-700 text-cyan-400 hover:bg-slate-900'}`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isTracking ? 'animate-spin' : ''}`} />
              {isTracking ? lang.trackingOn : lang.trackingOff}
            </button>

            {/* Dropdown Alat Ukur / Map Tools */}
            <div className="relative">
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black shadow-xl border transition-all active:scale-95 ${measureMode !== 'none' ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'bg-slate-950/90 border-slate-700 text-slate-200 hover:bg-slate-900'}`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>{measureMode !== 'none' ? (lang[`measure${measureMode.charAt(0).toUpperCase() + measureMode.slice(1)}`] || 'Alat Ukur') : (language === 'id' ? 'Alat Ukur Map' : 'Map Tools')}</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>

              {showToolsDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowToolsDropdown(false)} />
                  <div className="absolute left-0 mt-1.5 w-48 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl p-1 z-20 flex flex-col gap-1">
                    {([
                      { mode: 'polyline' as const, icon: <Ruler className="w-3.5 h-3.5" />, label: lang.measureDist },
                      { mode: 'polygon' as const, icon: <Pentagon className="w-3.5 h-3.5" />, label: lang.measureArea },
                      { mode: 'radius' as const, icon: <CircleDot className="w-3.5 h-3.5" />, label: lang.measureRadius },
                      { mode: 'eta' as const, icon: <Route className="w-3.5 h-3.5" />, label: lang.measureETA },
                    ] as const).map(({ mode, icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setMeasureMode(measureMode === mode ? 'none' : mode);
                          setShowToolsDropdown(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black text-left w-full transition-all ${measureMode === mode ? 'bg-cyan-500 text-slate-950' : 'text-slate-200 hover:text-cyan-300 hover:bg-slate-900'}`}
                      >
                        {icon} <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── Waze Navigation Mode Top Instruction Banner ─────────────────── */}
        {navMode !== 'none' && (
          <div className="absolute top-3 left-3 right-12 z-10 bg-emerald-600/95 border border-emerald-500 p-3 rounded-2xl shadow-2xl text-white flex items-center gap-3 animate-slide-down">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
              {arrived ? '🎉' : navMode === 'simulating' ? '🚗' : '🧭'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-emerald-200 font-black uppercase tracking-widest">{arrived ? lang.arrived : navMode === 'simulating' ? 'MODE SIMULASI JALAN' : 'NAVIGASI AKTIF'}</p>
              <p className="text-xs font-bold truncate">{arrived ? lang.arrived : `${lang.navBanner}`}</p>
            </div>
            <button
              onClick={stopNavigation}
              className="shrink-0 flex items-center gap-1 bg-red-500 hover:bg-red-400 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg"
            >
              <Square className="w-3 h-3" />
              <span>{lang.stopNav}</span>
            </button>
          </div>
        )}

        {/* ─── Floating POI Search Input ───────────────────────────────────── */}
        {navMode === 'none' && (
          <div className="absolute top-3 right-12 z-10 w-56 max-w-[calc(100vw-180px)]">
            <form onSubmit={handleSearch} className="flex bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xl">
              <input
                type="text"
                placeholder={lang.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-slate-900 px-3 py-2 text-[10px] focus:outline-none w-full font-bold placeholder:text-slate-400"
              />
              <button type="submit" className="bg-cyan-500 text-slate-950 px-2.5 flex items-center hover:bg-cyan-400 transition-all">
                {searching ? <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <Search className="w-3 h-3" />}
              </button>
            </form>
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-44 overflow-y-auto z-20 divide-y divide-slate-100">
                {searchResults.map((item, i) => (
                  <button key={i} onClick={() => handleSelectPlace(item)} className="w-full text-left px-3 py-2 text-[10px] text-slate-700 hover:bg-slate-50 font-bold transition-colors">
                    📍 {item.display_name.split(',').slice(0, 3).join(', ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Map Style Selector ──────────────────────────────────────────── */}
        {navMode === 'none' && (
          <div className="absolute bottom-3 left-3 z-10 flex gap-1 bg-slate-950/90 border border-slate-700 p-1 rounded-xl shadow-xl">
            {([
              { key: 'dark' as const, icon: '🌌', label: lang.darkMap },
              { key: 'osm' as const, icon: '🗺️', label: lang.streetMap },
              { key: 'satellite' as const, icon: '🛰️', label: lang.satMap },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => setActiveStyle(s.key)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeStyle === s.key ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-cyan-300'}`}
              >
                {s.icon} <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ─── Navigation HUD: speed / coords / ETA panel ──────────────────── */}
        {navMode !== 'none' && !arrived && (
          <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/95 border border-slate-700 rounded-2xl shadow-2xl px-4 py-3 flex gap-4 items-center">
            {/* Speed */}
            <div className="text-center shrink-0">
              <p className="text-2xl font-black text-white leading-none">{currentSpeed}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">km/h</p>
            </div>
            <div className="w-px h-8 bg-slate-700 shrink-0" />
            {/* Route info */}
            <div className="flex-1 min-w-0 space-y-0.5">
              {nextTurnInstruction ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] shrink-0 leading-none">{getNextTurnIcon(nextTurnInstruction)}</span>
                  <p className="text-[10px] text-cyan-300 font-black truncate leading-none">
                    {nextTurnInstruction} ({nextTurnDistance}m)
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-cyan-400 font-black truncate">
                  {navDestination?.title || (language === 'id' ? 'Menuju Tujuan' : 'Navigating to Destination')}
                </p>
              )}
              <div className="flex items-center gap-3 text-[9px] text-slate-300 font-bold">
                <span>📏 {navRemainingDist} km</span>
                <span>⏱ {navRemainingTime} {language === 'id' ? 'mnt' : 'min'}</span>
                {navMode === 'simulating' && <span className="text-amber-400 animate-pulse">🚗 SIMULASI</span>}
              </div>
              {userLoc && (
                <p className="text-[8px] text-slate-500 font-mono">
                  {userLoc[0].toFixed(5)}°, {userLoc[1].toFixed(5)}°
                </p>
              )}
            </div>
            <div className="w-px h-8 bg-slate-700 shrink-0" />
            {/* ETA clock */}
            <div className="text-center shrink-0">
              <p className="text-xs font-black text-emerald-400">
                {navRemainingTime > 0
                  ? new Date(Date.now() + navRemainingTime * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'
                }
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase">{language === 'id' ? 'Tiba' : 'ETA'}</p>
            </div>
          </div>
        )}

        {navMode !== 'none' && arrived && (
          <div className="absolute bottom-3 left-3 right-3 z-10 bg-emerald-950/95 border border-emerald-600 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-400">{lang.arrived}</p>
              <p className="text-[10px] text-slate-400">{navDestination?.title}</p>
            </div>
            <button onClick={stopNavigation} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black">
              {language === 'id' ? 'Selesai' : 'Done'}
            </button>
          </div>
        )}
      </div>

      {measureMode === 'radius' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭕</span>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{lang.measureRadius}</p>
            </div>
            <button onClick={() => setMeasureMode('none')} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
          </div>
          <input
            type="range" min={1} max={200} step={1} value={radiusKM}
            onChange={e => setRadiusKM(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-bold"><span>1 km</span><span>{radiusKM} km</span><span>200 km</span></div>
          {radiusCenter ? (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-black text-slate-700">📍 Pusat: {radiusCenter[1].toFixed(4)}°, {radiusCenter[0].toFixed(4)}°</p>
              <p>🌐 Luas Area: ~{(Math.PI * radiusKM * radiusKM).toFixed(1)} km²</p>
              <p className="font-bold text-amber-600">⚠️ {getItemsInRadius().length} {lang.radiusItems}</p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 italic text-center">{lang.clickMap}</p>
          )}
        </div>
      )}

      {/* ─── Simplified Polyline / Polygon Panel ──────────────────────────── */}
      {(measureMode === 'polyline' || measureMode === 'polygon') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">{measureMode === 'polyline' ? '📏' : '📐'}</span>
            <div className="flex-1">
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{measureMode === 'polyline' ? lang.measureDist : lang.measureArea}</p>
              <p className="font-extrabold text-slate-800 text-sm mt-0.5">
                {measureMode === 'polyline'
                  ? <>{lang.measureTotal}: <span className="text-cyan-600">{getTotalDistance().toFixed(2)} km</span></>
                  : <>{lang.polygonArea}: <span className="text-cyan-600">{polygonAreaKM2(measurePoints).toFixed(2)} km²</span> <span className="text-slate-500 text-xs">({(polygonAreaKM2(measurePoints) * 100).toFixed(0)} ha)</span></>
                }
              </p>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 italic space-y-2">
            <p>{lang.clickMap} ({measurePoints.length} {lang.pointsSelected})</p>
            
            {/* Realtime Clicked Coordinates List */}
            {measurePoints.length > 0 && (
              <div className="max-h-24 overflow-y-auto divide-y divide-slate-100 border-t border-slate-150 pt-2 space-y-1">
                {measurePoints.map((pt, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[9px] text-slate-500 py-0.5 font-mono">
                    <span>📍 Titik {idx + 1}</span>
                    <span>{pt[1].toFixed(5)}°, {pt[0].toFixed(5)}°</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setMeasurePoints([])} disabled={measurePoints.length === 0} className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 disabled:opacity-40 px-3.5 py-2 rounded-xl text-xs font-black transition-all">
              <Trash2 className="w-3.5 h-3.5" /> {lang.reset}
            </button>
            <button onClick={() => setMeasureMode('none')} className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all">
              {lang.close}
            </button>
          </div>
        </div>
      )}

      {/* ─── Simplified & Guided Route / ETA Selector HUD ──────────────────── */}
      {measureMode === 'eta' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛣️</span>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{lang.measureETA}</p>
            </div>
            <button onClick={() => setMeasureMode('none')} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Point A */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-700">🟢 Titik A (Awal)</span>
                {etaStart && (
                  <button onClick={() => setEtaStart(null)} className="text-[10px] text-rose-500 hover:underline">Hapus</button>
                )}
              </div>
              <div className="flex gap-1.5 items-center">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-600 truncate">
                  {etaStart ? `${etaStart[1].toFixed(5)}, ${etaStart[0].toFixed(5)}` : 'Belum ditentukan'}
                </div>
                <button
                  onClick={() => setEtaPickingMode(etaPickingMode === 'start' ? 'none' : 'start')}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${etaPickingMode === 'start' ? 'bg-cyan-500 border-cyan-450 text-slate-950 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  {etaPickingMode === 'start' ? 'Memilih...' : 'Set A'}
                </button>
                {userLoc && (
                  <button
                    onClick={() => setEtaStart([userLoc[1], userLoc[0]])}
                    className="bg-emerald-500 text-white px-2 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all"
                    title="Gunakan lokasi GPS saat ini"
                  >
                    GPS
                  </button>
                )}
              </div>
            </div>

            {/* Point B */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-700">🔴 Titik B (Tujuan)</span>
                {etaEnd && (
                  <button onClick={() => setEtaEnd(null)} className="text-[10px] text-rose-500 hover:underline">Hapus</button>
                )}
              </div>
              <div className="flex gap-1.5 items-center">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-600 truncate">
                  {etaEnd ? `${etaEnd[1].toFixed(5)}, ${etaEnd[0].toFixed(5)}` : 'Belum ditentukan'}
                </div>
                <button
                  onClick={() => setEtaPickingMode(etaPickingMode === 'end' ? 'none' : 'end')}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${etaPickingMode === 'end' ? 'bg-cyan-500 border-cyan-450 text-slate-950 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  {etaPickingMode === 'end' ? 'Memilih...' : 'Set B'}
                </button>
              </div>
            </div>
          </div>

          {etaPickingMode !== 'none' && (
            <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-bold px-3 py-2 rounded-xl text-center">
              {etaPickingMode === 'start' ? '👉 Silakan klik di peta untuk menentukan Titik A (Awal).' : '👉 Silakan klik di peta untuk menentukan Titik B (Tujuan).'}
            </div>
          )}

          {etaResult ? (
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
              {[
                { icon: '🚗', label: lang.etaCar, mins: etaResult.car },
                { icon: '🚶', label: lang.etaWalk, mins: etaResult.walk },
                { icon: '🚴', label: lang.etaBike, mins: etaResult.bike },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-0.5">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-[8px] text-slate-400 font-black uppercase">{item.label}</p>
                  <p className="text-xs font-black text-slate-800">{item.mins ? `${item.mins} min` : '-'}</p>
                </div>
              ))}
              <div className="col-span-3 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5 flex justify-between text-[10px] text-amber-700 font-bold">
                <span>📏 Jarak Rute: <strong>{etaResult.distKM} km</strong></span>
                <span>📐 Lurus: <strong>{etaResult.straight} km</strong></span>
              </div>
            </div>
          ) : (
            etaPickingMode === 'none' && <p className="text-[10px] text-slate-400 italic text-center">{lang.etaNoPoints}</p>
          )}
        </div>
      )}

      {/* ─── Coordinate & Search Destination Inspector ────────────────────── */}
      {clickedLoc && measureMode === 'none' && navMode === 'none' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg shrink-0">📍</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{lang.coordInspector}</p>
              <h4 className="font-extrabold text-slate-800 text-sm break-all truncate">{clickedLoc.title || `${clickedLoc.lat.toFixed(6)}, ${clickedLoc.lng.toFixed(6)}`}</h4>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                DMS: {toDMS(clickedLoc.lat, clickedLoc.lng)} &bull; {lang.elevation}:{' '}
                {loadingElev ? <span className="text-cyan-500 animate-pulse">...</span> : clickedLoc.elevation !== undefined ? <span className="text-cyan-600 font-black">{clickedLoc.elevation.toFixed(1)} mdpl</span> : '-'}
              </p>
            </div>
            <button onClick={() => { setClickedLoc(null); setShowCopyMenu(false); setShowShareMenu(false); }} className="text-slate-300 hover:text-slate-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1.5 border-t border-slate-100">
            <button
              onClick={() => startNavigation(false)}
              className="flex-grow flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{lang.startNav}</span>
            </button>

            <button
              onClick={() => startNavigation(true)}
              className="flex-grow flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{lang.simulateRide}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-grow">
              <button
                onClick={() => { setShowCopyMenu(p => !p); setShowShareMenu(false); }}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-black transition-all"
              >
                <Copy className="w-3.5 h-3.5" /> {lang.copyCoord} <ChevronDown className="w-3 h-3" />
              </button>
              {showCopyMenu && (
                <div className="absolute bottom-full mb-1.5 left-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-100">
                  {buildCopyItems().map(item => (
                    <button
                      key={item.key}
                      onClick={() => doCopy(item.key, item.value)}
                      className="w-full text-left px-3.5 py-2 text-[10px] text-slate-700 hover:bg-slate-50 flex items-center justify-between font-bold"
                    >
                      <span>{item.label}</span>
                      {copiedKey === item.key ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-300" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-grow">
              <button
                onClick={() => { setShowShareMenu(p => !p); setShowCopyMenu(false); }}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-black transition-all"
              >
                <Share2 className="w-3.5 h-3.5" /> {lang.shareBtn} <ChevronDown className="w-3 h-3" />
              </button>
              {showShareMenu && (
                <div className="absolute bottom-full mb-1.5 left-0 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 overflow-hidden p-2 space-y-1">
                  {shareItems().map(s => (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={s.action}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black text-slate-700 hover:bg-slate-50"
                    >
                      <span className="text-base">{s.icon}</span>
                      <span>{s.label}</span>
                    </a>
                  ))}
                  <button
                    onClick={() => doCopy('link', getShareUrl())}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black text-slate-700 hover:bg-slate-50"
                  >
                    <span>🔗 {copiedKey === 'link' ? lang.copied : lang.share_link}</span>
                  </button>
                  <button
                    onClick={() => { setShowQR(p => !p); setShowShareMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black text-slate-700 hover:bg-slate-50"
                  >
                    <span>📷 {lang.share_qr}</span>
                  </button>
                </div>
              )}
            </div>

            <a
              href={gmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-grow flex items-center justify-center gap-1.5 bg-cyan-500 text-white px-3 py-2 rounded-xl text-xs font-black hover:bg-cyan-600 transition-all text-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang.openGmaps}</span>
            </a>
          </div>

          {showQR && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(gmapsUrl)}`}
                alt="QR Code"
                className="w-36 h-36 rounded-xl border border-slate-200"
              />
              <button onClick={() => setShowQR(false)} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">{lang.close}</button>
            </div>
          )}
        </div>
      )}

      {/* ─── Threat Analysis / Distance relative to hazards ─────────────────── */}
      {nearestThreats.length > 0 && measureMode === 'none' && navMode === 'none' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
          <button
            onClick={() => setShowThreatPanel(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider">{lang.threatDist}</p>
              {activeAlert ? (
                <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">{lang.threatDanger || '⚠️ Bahaya'}</span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{lang.threatSafe || '✅ Aman'}</span>
              )}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showThreatPanel ? 'rotate-180' : ''}`} />
          </button>
          {showThreatPanel && (
          <div className="divide-y divide-slate-100">
              {nearestThreats.map((t, i) => {
                const typeIcons: Record<string, string> = { quake: '🌋', volcano: '🏔️', hotspots: '🔥', cyclone: '🌀', flood: '🌊', tsunami: '🚨' };
                const danger = t.dist < (t.type === 'quake' ? 50 : t.type === 'volcano' ? 20 : 25);
                const tLat = parseFloat(t.latitude);
                const tLng = parseFloat(t.longitude);
                const canFly = !isNaN(tLat) && !isNaN(tLng);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!canFly || !mapRef.current) return;
                      mapRef.current.flyTo({ center: [tLng, tLat], zoom: 12, essential: true });
                      setClickedLoc({ lat: tLat, lng: tLng, title: t.title || t.location });
                      setLoadingElev(true);
                      fetch(`https://api.open-meteo.com/v1/elevation?latitude=${tLat}&longitude=${tLng}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(d => { if (d) setClickedLoc(p => p ? { ...p, elevation: d.elevation?.[0] } : null); })
                        .catch(() => {})
                        .finally(() => setLoadingElev(false));
                      setShowThreatPanel(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs text-left transition-all group ${danger ? 'bg-red-50/50 hover:bg-red-100/70' : 'hover:bg-slate-50'} ${canFly ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="text-lg shrink-0">{typeIcons[t.type] || '🌍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{t.location}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className={`font-black text-sm ${danger ? 'text-red-600' : 'text-emerald-600'}`}>{t.dist} km</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{t.severity}</p>
                      </div>
                      {canFly && (
                        <span className="text-slate-300 group-hover:text-cyan-500 transition-colors text-sm">➜</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
