/**
 * src/lib/imageSafeguard.ts
 * 
 * Central image URL safeguard system.
 * Memastikan TIDAK ADA banner/kartu yang tampil tanpa gambar.
 * 
 * Hirarki fallback:
 * 1. URL asli (R2, NASA, dll) → divalidasi
 * 2. generateImageWithFallback (Pollinations → CF Workers AI → R2 upload)
 * 3. CF Workers AI langsung → R2 upload
 * 4. Gambar kategori statis dari R2 public (pre-upload)
 * 5. Placehold.co sebagai LAST RESORT (harus tetap return string valid)
 */

const R2_PUBLIC = process.env.R2_PUBLIC_URL || 'https://cdn.meteorit.my.id';

/** Daftar gambar kategori statis yang sudah ada di R2 sebagai fallback per kategori */
const CATEGORY_FALLBACKS: Record<string, string> = {
  meteorit: `${R2_PUBLIC}/data/meteorites/images/fallback-meteorit.jpg`,
  meteorite: `${R2_PUBLIC}/data/meteorites/images/fallback-meteorit.jpg`,
  komet: `${R2_PUBLIC}/data/blog/images/fallback-komet.jpg`,
  comet: `${R2_PUBLIC}/data/blog/images/fallback-komet.jpg`,
  mars: `${R2_PUBLIC}/data/blog/images/fallback-mars.jpg`,
  apod: `${R2_PUBLIC}/data/encyclopedia/images/fallback-apod.jpg`,
  astronot: `${R2_PUBLIC}/data/astronauts/images/fallback-astronot.jpg`,
  astronaut: `${R2_PUBLIC}/data/astronauts/images/fallback-astronot.jpg`,
  fireball: `${R2_PUBLIC}/data/blog/images/fallback-fireball.jpg`,
  eonet: `${R2_PUBLIC}/data/blog/images/fallback-eonet.jpg`,
  glosarium: `${R2_PUBLIC}/data/glossary/images/bmkg-hujan-ringan.webp`,
  glossary: `${R2_PUBLIC}/data/glossary/images/nasa-apod.webp`,
  default: `${R2_PUBLIC}/data/glossary/images/nasa-apod.webp`,
};

/** 
 * Placehold.co statis per kategori (LAST RESORT jika R2 tidak ada)
 * Ini HARUS selalu return URL yang valid — tidak pernah null/undefined/''
 */
const PLACEHOLD_FALLBACKS: Record<string, string> = {
  meteorit: 'https://placehold.co/800x500/0a0a1a/f59e0b?text=Meteorit',
  mars: 'https://placehold.co/800x500/1a0a0a/ef4444?text=Mars',
  apod: 'https://placehold.co/800x500/020617/22d3ee?text=NASA+APOD',
  komet: 'https://placehold.co/800x500/0d0d2a/a78bfa?text=Komet',
  fireball: 'https://placehold.co/800x500/1a0a00/f97316?text=Fireball',
  astronot: 'https://placehold.co/400x500/020617/22d3ee?text=Astronot',
  default: 'https://placehold.co/800x500/020617/22d3ee?text=Meteorit+Indonesia',
};

/**
 * Periksa apakah URL adalah placeholder/logo yang tidak diinginkan
 */
export function isBadImageUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return true;
  const bad = [
    'nasa-logo',
    'nasa_logo',
    'meatball',
    'worm-logo',
    'placeholder',
    '/placeholder',
    'data:image/gif',
    'data:image/png;base64,R0lGOD', // transparent gif
  ];
  return bad.some(b => url.toLowerCase().includes(b));
}

/**
 * Fungsi utama: pastikan image_url selalu terisi valid.
 * 
 * @param currentUrl URL yang ada saat ini (bisa kosong/null)
 * @param category Kategori konten untuk memilih fallback yang tepat
 * @param generateFn Optional: fungsi async yang men-generate gambar baru jika URL kosong
 * @returns URL gambar yang valid (tidak pernah kosong)
 */
export async function ensureImageUrl(
  currentUrl: string | null | undefined,
  category: keyof typeof CATEGORY_FALLBACKS | string = 'default',
  generateFn?: () => Promise<string>
): Promise<string> {
  // 1. URL sudah ada dan valid → gunakan langsung
  if (currentUrl && !isBadImageUrl(currentUrl)) {
    return currentUrl;
  }

  // 2. Coba generate gambar baru jika ada generateFn
  if (generateFn) {
    try {
      const generated = await generateFn();
      if (generated && !isBadImageUrl(generated) && !generated.includes('placehold.co')) {
        return generated;
      }
    } catch (err) {
      console.warn(`[ImageSafeguard] generateFn gagal untuk kategori "${category}":`, err);
    }
  }

  // 3. Fallback ke gambar kategori statis dari R2
  const categoryKey = category.toLowerCase() as keyof typeof CATEGORY_FALLBACKS;
  const r2Fallback = CATEGORY_FALLBACKS[categoryKey] || CATEGORY_FALLBACKS['default'];
  
  // Verifikasi R2 fallback bisa diakses (quick HEAD check)
  try {
    const check = await fetch(r2Fallback, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
    if (check.ok) {
      console.log(`[ImageSafeguard] Menggunakan R2 category fallback untuk "${category}": ${r2Fallback}`);
      return r2Fallback;
    }
  } catch {
    // R2 fallback tidak tersedia, lanjut ke placehold
  }

  // 4. Last resort: placehold.co (selalu tersedia)
  const placehold = PLACEHOLD_FALLBACKS[categoryKey] || PLACEHOLD_FALLBACKS['default'];
  console.warn(`[ImageSafeguard] Semua fallback gagal untuk "${category}", menggunakan placehold: ${placehold}`);
  return placehold;
}

/**
 * Shortcut: pastikan image_url artikel/konten selalu terisi.
 * Digunakan sebelum menyimpan artikel ke R2/D1.
 */
export async function sanitizeArticleImageUrl(
  article: { image?: string; image_url?: string; imageUrl?: string; title?: string; category?: string },
  r2PathPrefix: string = 'data/blog/images'
): Promise<string> {
  const existing = article.image || article.image_url || article.imageUrl || '';
  const category = article.category?.toLowerCase() || 'default';

  if (existing && !isBadImageUrl(existing)) {
    return existing;
  }

  // Coba generate via Workers AI jika memungkinkan
  return ensureImageUrl(
    existing,
    category,
    async () => {
      const { generateImageWithFallback } = await import('./imageGenerator');
      const title = article.title || category;
      const prompt = `${title}, high quality photograph, scientific illustration, space science`;
      const path = `${r2PathPrefix}/auto-${Date.now()}.jpg`;
      return generateImageWithFallback(prompt, path);
    }
  );
}

