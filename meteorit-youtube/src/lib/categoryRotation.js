// src/lib/categoryRotation.js
// ============================================================
// Rotasi 9 kategori konten harian secara deterministik
// Kategori dipilih berdasarkan dayOfYear % 9
// Setiap kategori juga memiliki prefix artikel untuk R2 fetch
// ============================================================

/**
 * 9 Kategori rotasi konten harian
 */
export const CATEGORIES = [
  {
    id: 'meteorit',
    name: 'Ensiklopedia Meteorit',
    emoji: '☄️',
    description: 'Fakta dan edukasi seputar meteorit',
    r2Prefix: ['article-'],                        // article-*.json (Panduan/Edukasi)
    r2Categories: ['Panduan', 'Edukasi', 'Trivia'],
    hashtags: '#meteorit #astronomi #luarangkasa #sains #faktaluarangkasa #edukasiastronomi #nasaindonesia',
    titleSuffix: 'Fakta Meteorit',
  },
  {
    id: 'komet',
    name: 'Komet & Asteroid',
    emoji: '🪐',
    description: 'Objek dekat Bumi dan benda angkasa',
    r2Prefix: ['asteroid-', 'komet-'],
    r2Categories: ['Komet & Asteroid'],
    hashtags: '#komet #asteroid #nasaneows #luarangkasa #astronomy #faktaasteoid #sains',
    titleSuffix: 'Komet & Asteroid',
  },
  {
    id: 'eonet',
    name: 'Peristiwa Alam (EONET)',
    emoji: '🌍',
    description: 'Kejadian alam dipantau NASA dari luar angkasa',
    r2Prefix: ['eonet-'],
    r2Categories: ['Peristiwa Alam', 'EONET'],
    hashtags: '#peristiwaalama #bumi #nasaeonet #gempa #gunungberapi #sainsalam #monitoring',
    titleSuffix: 'Peristiwa Alam NASA',
  },
  {
    id: 'mars',
    name: 'Planet Mars',
    emoji: '🔴',
    description: 'Eksplorasi Planet Merah oleh NASA',
    r2Prefix: ['mars-'],
    r2Categories: ['Mars', 'Planet'],
    hashtags: '#mars #planetmerah #nasa #explorasimars #perseverance #luarangkasa #roket',
    titleSuffix: 'Eksplorasi Mars',
  },
  {
    id: 'apod',
    name: 'Foto Astronomi NASA (APOD)',
    emoji: '🌌',
    description: 'Foto astronomi terpilih NASA hari ini',
    r2Prefix: ['apod-'],
    r2Categories: ['APOD', 'Foto Astronomi'],
    hashtags: '#nasaapod #fotoastromi #astrophotography #luarangkasa #nasaindonesia #bintang #galaksi',
    titleSuffix: 'NASA APOD',
    apodPath: 'data/encyclopedia/latest.json', // Path khusus APOD
  },
  {
    id: 'fireball',
    name: 'Bola Api (Fireball)',
    emoji: '🔥',
    description: 'Laporan bola api meteor terbaru dari JPL NASA',
    r2Prefix: ['fireball-'],
    r2Categories: ['Bola Api & Fireball', 'Fireball'],
    hashtags: '#fireball #bolaapi #meteor #luarangkasa #sains #nasajpl #atmosfer',
    titleSuffix: 'Fireball NASA',
  },
  {
    id: 'astronot',
    name: 'Astronot & Misi Luar Angkasa',
    emoji: '👨‍🚀',
    description: 'Profil astronot dan misi luar angkasa',
    r2Prefix: ['astronot-'],
    r2Categories: ['Astronot', 'Misi Luar Angkasa'],
    hashtags: '#astronot #iss #nasaastronauts #luarangkasa #stasiun #angkasawan #misiangkasa',
    titleSuffix: 'Astronot NASA',
  },
  {
    id: 'trivia',
    name: 'Trivia Luar Angkasa',
    emoji: '🌠',
    description: 'Fakta menarik dan trivia tentang alam semesta',
    r2Prefix: ['article-'],
    r2Categories: ['Trivia', 'Sejarah'],
    hashtags: '#triviaangkasa #faktaluarangkasa #edukasi #sains #luarangkasa #nasaindonesia #universe',
    titleSuffix: 'Trivia Luar Angkasa',
  },
  {
    id: 'bumi',
    name: 'Pusat Kontrol Bumi',
    emoji: '🛰️',
    description: 'Pemantauan Bumi dari luar angkasa',
    r2Prefix: ['earth-', 'eonet-'],
    r2Categories: ['Peristiwa Alam', 'Earth Monitoring'],
    hashtags: '#bumidariangkasa #satelit #nasa #kontrolbumi #teknologi #roket #monitoring',
    titleSuffix: 'Pantauan Bumi NASA',
  },
];

/**
 * Dapatkan kategori hari ini berdasarkan dayOfYear % 9
 * Deterministik — hasil sama untuk tanggal yang sama
 * @param {Date} date - Tanggal (default: hari ini)
 * @returns {Object} Kategori hari ini
 */
export function getTodayCategory(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const index = dayOfYear % CATEGORIES.length;
  const category = CATEGORIES[index];

  console.log(`📅 Hari ke-${dayOfYear} tahun ini → Kategori [${index}]: ${category.emoji} ${category.name}`);
  return category;
}

/**
 * Preview jadwal 9 hari ke depan
 */
export function previewSchedule(days = 9) {
  console.log('\n📅 Preview Jadwal Konten:\n');
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const cat = getTodayCategory(date);
    const label = i === 0 ? ' ← HARI INI' : i === 1 ? ' ← BESOK' : '';
    console.log(`  ${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}: ${cat.emoji} ${cat.name}${label}`);
  }
  console.log();
}
