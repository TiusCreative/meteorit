/**
 * src/lib/nasaApodHelper.ts
 *
 * Centralized, reliable NASA APOD data harvester.
 * Solves the known NASA OpenAPI issue where api.nasa.gov returns placeholder
 * themes/nasa-child/assets/images/nasa-logo@2x.png and title "NASA Science".
 *
 * Falls back seamlessly to science.nasa.gov WordPress REST API to obtain:
 * 1. True astronomical picture of the day (high-res image)
 * 2. True scientific article title
 * 3. Full scientific explanation
 * 4. Proper media type & video embed/thumbnail handling
 */

export interface RawApodData {
  date: string;
  title: string;
  explanation: string;
  imageUrl: string;
  hdImageUrl?: string;
  mediaType: 'image' | 'video';
  copyright: string;
  videoEmbedUrl?: string;
  videoThumbnailUrl?: string;
  source: 'nasa-api' | 'wordpress-api' | 'fallback';
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

/**
 * Checks whether an image URL is a NASA logo or generic placeholder rather than astronomy photo.
 */
export function isNasaLogoPlaceholder(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('nasa-logo') ||
    lower.includes('nasa_logo') ||
    lower.includes('meatball') ||
    lower.includes('worm-logo') ||
    lower.includes('/themes/nasa-child/') ||
    lower.includes('editor-page-nasa-logo') ||
    lower.includes('/placeholder') ||
    lower.includes('placeholder')
  );
}

/**
 * Extracts YouTube video ID from URL
 */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Normalizes video embed URL and extracts official video thumbnail
 */
export function parseVideoMedia(url: string): { embedUrl: string; thumbnailUrl: string } {
  const ytId = extractYoutubeId(url);
  if (ytId) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
    };
  }
  if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com/video/')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (vimeoId) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        thumbnailUrl: 'https://cdn.meteorit.my.id/data/glossary/images/nasa-apod.webp',
      };
    }
  }
  return {
    embedUrl: url,
    thumbnailUrl: 'https://cdn.meteorit.my.id/data/glossary/images/nasa-apod.webp',
  };
}

/**
 * Clean HTML entities and tags from WordPress API output
 */
function cleanWordPressText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '...')
    .replace(/\[&hellip;\]/g, '...')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Fetches accurate APOD article from science.nasa.gov WordPress REST API.
 */
export async function fetchApodFromWordPress(dateStr: string): Promise<RawApodData | null> {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = MONTH_NAMES[parseInt(monthStr, 10) - 1];
    const day = parseInt(dayStr, 10);
    const paddedDay = String(day).padStart(2, '0');

    // Search variants for NASA WordPress REST API
    const terms = [
      `apod-${year}-${month}-${day}`,
      `apod-${year}-${month}-${paddedDay}`,
      `${year}-${month}-${day}`,
    ];

    for (const term of terms) {
      try {
        const wpUrl = `https://science.nasa.gov/wp-json/wp/v2/image-article?search=${encodeURIComponent(term)}&per_page=5`;
        const res = await fetch(wpUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeteoritIndonesia/1.0)' },
          signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(12000) : undefined,
        });

        if (!res.ok) continue;

        const items = await res.json();
        if (!Array.isArray(items) || items.length === 0) continue;

        const matched = items.find((it: any) => {
          const slug = it.slug || '';
          return slug.startsWith(`apod-${year}-${month}-${day}`) || slug.startsWith(`apod-${year}-${month}-${paddedDay}`);
        }) || items[0];

        if (matched) {
          const rawTitle = cleanWordPressText(matched.title?.rendered || '')
            .replace(/^APOD:\s*\d{4}\s*\w+\s*\d+\s*[–—\-]\s*/i, '')
            .trim();

          // Extract explanation from content or excerpt
          let explanation = '';
          const contentHtml = matched.content?.rendered || '';
          const expMatch = contentHtml.match(/<strong>Explanation:<\/strong>\s*([\s\S]*?)(?:<div|Tomorrow's picture:|$)/i);
          if (expMatch && expMatch[1]) {
            explanation = cleanWordPressText(expMatch[1]);
          } else {
            explanation = cleanWordPressText(matched.excerpt?.rendered || matched.caption || '');
          }

          // Featured image
          let imageUrl = '';
          const fi = matched.featured_image;
          if (fi?.file && !isNasaLogoPlaceholder(fi.file)) {
            imageUrl = fi.file;
          } else if (matched.featured_image_url && !isNasaLogoPlaceholder(matched.featured_image_url)) {
            imageUrl = matched.featured_image_url;
          }

          // Check if article embeds a video
          let mediaType: 'image' | 'video' = 'image';
          let videoEmbedUrl: string | undefined;
          let videoThumbnailUrl: string | undefined;

          if (contentHtml.includes('youtube.com') || contentHtml.includes('youtu.be') || contentHtml.includes('vimeo.com')) {
            const ytMatch = contentHtml.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_\-]+)/);
            if (ytMatch && ytMatch[0]) {
              mediaType = 'video';
              const parsed = parseVideoMedia(ytMatch[0]);
              videoEmbedUrl = parsed.embedUrl;
              videoThumbnailUrl = parsed.thumbnailUrl;
              if (!imageUrl || isNasaLogoPlaceholder(imageUrl)) {
                imageUrl = parsed.thumbnailUrl;
              }
            }
          }

          if (imageUrl && !isNasaLogoPlaceholder(imageUrl) && rawTitle && !rawTitle.toLowerCase().includes('nasa science')) {
            return {
              date: dateStr,
              title: rawTitle,
              explanation,
              imageUrl,
              hdImageUrl: imageUrl,
              mediaType,
              copyright: 'NASA Public Domain',
              videoEmbedUrl,
              videoThumbnailUrl,
              source: 'wordpress-api',
            };
          }
        }
      } catch (innerErr) {
        console.warn(`[NASA APOD Helper] WP search term "${term}" failed:`, innerErr);
      }
    }

    return null;
  } catch (err) {
    console.error('[NASA APOD Helper] fetchApodFromWordPress error:', err);
    return null;
  }
}

/**
 * Main function: Obtains accurate, authentic NASA APOD data for any given date.
 * Handles the fallback automatically if api.nasa.gov returns placeholder logos or titles.
 */
export async function fetchRawApod(targetDate?: string): Promise<RawApodData> {
  const dateStr = targetDate || new Date().toISOString().split('T')[0];
  const nasaKey = process.env.NASA_API_KEY || 'hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN';

  let apiData: any = null;
  let apiSuccess = false;

  // 1. Try official NASA OpenAPI
  try {
    const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${nasaKey}&date=${dateStr}`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeteoritIndonesia/1.0)' },
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined,
    });

    if (res.ok) {
      apiData = await res.json();
      const rawUrl = apiData.hdurl || apiData.url || '';
      const rawTitle = (apiData.title || '').trim();

      // Check if NASA returned invalid placeholder logo or generic "NASA Science" title
      const isPlaceholder = apiData.media_type !== 'video' && isNasaLogoPlaceholder(rawUrl);
      const isGenericTitle = !rawTitle || rawTitle.toLowerCase() === 'nasa science';

      if (!isPlaceholder && !isGenericTitle) {
        apiSuccess = true;
      }
    }
  } catch (err) {
    console.warn(`[NASA APOD Helper] Official NASA API fetch failed for ${dateStr}:`, err);
  }

  if (apiSuccess && apiData) {
    const isVideo = apiData.media_type === 'video';
    let videoEmbedUrl: string | undefined;
    let videoThumbnailUrl: string | undefined;
    let finalImageUrl = apiData.hdurl || apiData.url || '';

    if (isVideo) {
      const parsed = parseVideoMedia(apiData.url);
      videoEmbedUrl = parsed.embedUrl;
      videoThumbnailUrl = parsed.thumbnailUrl;
      finalImageUrl = parsed.thumbnailUrl;
    }

    return {
      date: apiData.date || dateStr,
      title: apiData.title,
      explanation: apiData.explanation || '',
      imageUrl: finalImageUrl,
      hdImageUrl: apiData.hdurl || finalImageUrl,
      mediaType: isVideo ? 'video' : 'image',
      copyright: apiData.copyright || 'NASA Public Domain',
      videoEmbedUrl,
      videoThumbnailUrl,
      source: 'nasa-api',
    };
  }

  // 2. Official API returned placeholder or failed: fetch true article from science.nasa.gov WordPress
  console.log(`[NASA APOD Helper] Using WordPress fallback for ${dateStr} (API returned placeholder/failed)...`);
  const wpApod = await fetchApodFromWordPress(dateStr);
  if (wpApod) {
    return wpApod;
  }

  // 3. If WordPress article for today hasn't published yet (e.g. timezone difference), try yesterday
  if (!targetDate || targetDate === new Date().toISOString().split('T')[0]) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    console.log(`[NASA APOD Helper] Fetching yesterday's APOD (${yesterday}) as fallback...`);
    const yesterdayWp = await fetchApodFromWordPress(yesterday);
    if (yesterdayWp) {
      return {
        ...yesterdayWp,
        date: dateStr, // keep current date identifier
      };
    }
  }

  // 4. Ultimate fallback to clean astronomy photo (NEVER NASA logo)
  return {
    date: dateStr,
    title: 'Keindahan Kosmos dan Galeri Antariksa NASA',
    explanation: 'Pengamatan teleskop antariksa merekam struktur kosmik, gugus bintang, dan materi antarbintang yang mengungkap proses pembentukan alam semesta.',
    imageUrl: 'https://cdn.meteorit.my.id/data/glossary/images/nasa-apod.webp',
    mediaType: 'image',
    copyright: 'NASA Public Domain',
    source: 'fallback',
  };
}

