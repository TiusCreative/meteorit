import { fetchJsonFromR2, uploadToR2 } from './r2Client';

export interface ChatbotQACacheItem {
  id: string;
  normalizedQuery: string;
  rawQuery: string;
  answer: string;
  provider: string;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

const R2_QA_CACHE_KEY = 'data/chatbot/qa_cache.json';
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let inMemoryCache: ChatbotQACacheItem[] | null = null;
let lastFetchTimestamp = 0;

/**
 * Normalizes user query text for consistent cache matching.
 * Converts to lowercase, strips punctuation, and normalizes whitespace.
 */
export function normalizeQuery(query: string): string {
  if (!query) return '';
  
  let text = query.toLowerCase().trim();

  // Strip common Indonesian greetings at the beginning if followed by question
  text = text.replace(/^(halo|hai|permisi|min|admin|permisi min|tanya min|mau tanya|halo min)[,.\s]+/gi, '');

  // Strip non-alphanumeric characters except space
  text = text.replace(/[^\p{L}\p{N}\s]/gu, '');

  // Collapse multiple spaces
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Checks if a user query is time-sensitive / real-time (e.g. weather today, current disasters, latest news).
 * Real-time queries bypass static Q&A caching to guarantee fresh data from live APIs and database.
 */
export function isTimeSensitiveQuery(query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();

  const timeKeywords = [
    'hari ini', 'sekarang', 'saat ini', 'terkini', 'terbaru', 'tadi',
    'jam ini', 'minggu ini', 'bulan ini', 'live', 'realtime', 'real-time',
    'kemarin', 'besok', 'lusa'
  ];

  const dynamicTopicKeywords = [
    'cuaca', 'tsunami', 'banjir', 'erupsi', 'gunung meletus', 'gempa',
    'bencana', 'peringatan dini', 'space weather', 'badai matahari', 'suhu'
  ];

  const hasTimeKeyword = timeKeywords.some(kw => q.includes(kw));
  const hasDynamicTopic = dynamicTopicKeywords.some(kw => q.includes(kw));

  return hasTimeKeyword || hasDynamicTopic;
}

/**
 * Loads Q&A cache array from memory or Cloudflare R2
 */
export async function loadQACache(): Promise<ChatbotQACacheItem[]> {
  const now = Date.now();
  if (inMemoryCache && (now - lastFetchTimestamp < MEMORY_CACHE_TTL_MS)) {
    return inMemoryCache;
  }

  try {
    const data = await fetchJsonFromR2<ChatbotQACacheItem[]>(R2_QA_CACHE_KEY);
    if (Array.isArray(data)) {
      inMemoryCache = data;
    } else {
      inMemoryCache = [];
    }
  } catch (error) {
    console.warn('[Chatbot Cache] Failed to load QA cache from R2:', error);
    if (!inMemoryCache) inMemoryCache = [];
  }

  lastFetchTimestamp = now;
  return inMemoryCache;
}

const VALID_EXACT_ROUTES = new Set([
  '/',
  '/ensiklopedia',
  '/langit-malam',
  '/apod',
  '/blog',
  '/cuaca',
  '/komet',
  '/mars',
  '/fireball',
  '/eonet',
  '/kebencanaan',
  '/forum',
  '/astronot',
  '/glossarium',
  '/monitoring',
  '/monitoring-epic',
  '/tentang',
  '/visi-misi',
  '/kontak',
  '/kebijakan-privasi',
  '/syarat-ketentuan',
  '/login',
]);

const VALID_DYNAMIC_PREFIXES = [
  '/ensiklopedia/',
  '/blog/',
  '/mars/',
  '/fireball/',
  '/eonet/',
];

/**
 * Normalizes full domain URLs (e.g. https://meteorit.my.id/meteor-usa or http://localhost:3000/blog)
 * to relative internal path string (e.g. /meteor-usa or /blog)
 */
export function normalizeUrlToRelative(url: string): string {
  if (!url) return '';
  let clean = url.trim();

  if (clean.includes('meteorit.my.id') || clean.includes('localhost') || clean.includes('vercel.app')) {
    try {
      const parsed = new URL(clean);
      clean = parsed.pathname + parsed.search + parsed.hash;
    } catch {
      clean = clean.replace(/^https?:\/\/[^\/]+/, '');
    }
  }

  return clean;
}

/**
 * Checks if an internal URL string is valid and won't trigger a 404
 */
export function isValidInternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  
  let clean = normalizeUrlToRelative(url);
  // We only check relative internal links starting with '/'
  if (!clean.startsWith('/')) return true;

  const pathOnly = clean.split('?')[0].split('#')[0];

  if (VALID_EXACT_ROUTES.has(pathOnly)) return true;

  for (const prefix of VALID_DYNAMIC_PREFIXES) {
    if (pathOnly.startsWith(prefix) && pathOnly.length > prefix.length) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if text contains any invalid internal markdown links like [Text](/invalid-path)
 */
export function hasInvalidInternalLinks(text: string): boolean {
  if (!text) return false;
  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const url = normalizeUrlToRelative(match[1]);
    if (url.startsWith('/') && !isValidInternalUrl(url)) {
      return true;
    }
  }
  return false;
}

/**
 * Automatically fixes or sanitizes invalid internal links in text to valid parent categories.
 * For example: [/komet-shoemaker-levy-9] -> [/komet]
 *              [https://meteorit.my.id/meteor-usa] -> [/ensiklopedia]
 */
export function sanitizeInternalLinks(text: string): string {
  if (!text) return text;
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    let cleanUrl = normalizeUrlToRelative(url);

    // If external link (not starting with '/'), leave as is
    if (!cleanUrl.startsWith('/')) {
      return match;
    }

    if (isValidInternalUrl(cleanUrl)) {
      return `[${label}](${cleanUrl})`;
    }

    // Attempt smart fallback based on path prefix & keywords
    const pathLower = cleanUrl.toLowerCase();
    let safeTarget = '/ensiklopedia';
    
    if (pathLower.startsWith('/komet') || pathLower.includes('komet') || pathLower.includes('comet') || pathLower.includes('asteroid')) {
      safeTarget = '/komet';
    } else if (pathLower.startsWith('/mars') || pathLower.includes('mars')) {
      safeTarget = '/mars';
    } else if (pathLower.startsWith('/fireball') || pathLower.includes('fireball') || pathLower.includes('bolide')) {
      safeTarget = '/fireball';
    } else if (pathLower.startsWith('/eonet') || pathLower.includes('eonet')) {
      safeTarget = '/eonet';
    } else if (pathLower.startsWith('/blog') || pathLower.startsWith('/article') || pathLower.includes('berita') || pathLower.includes('artikel')) {
      safeTarget = '/blog';
    } else if (pathLower.startsWith('/sky') || pathLower.startsWith('/langit') || pathLower.includes('peta')) {
      safeTarget = '/langit-malam';
    } else if (pathLower.startsWith('/weather') || pathLower.startsWith('/cuaca')) {
      safeTarget = '/cuaca';
    } else if (pathLower.startsWith('/bencana') || pathLower.includes('gempa') || pathLower.includes('tsunami')) {
      safeTarget = '/kebencanaan';
    } else if (pathLower.startsWith('/forum') || pathLower.includes('diskusi')) {
      safeTarget = '/forum';
    } else if (pathLower.startsWith('/astronot') || pathLower.includes('astronaut')) {
      safeTarget = '/astronot';
    } else if (pathLower.startsWith('/glossar') || pathLower.includes('kamus')) {
      safeTarget = '/glossarium';
    }

    return `[${label}](${safeTarget})`;
  });
}

/**
 * Searches for a cached answer matching the normalized user query
 */
export async function findCachedAnswer(rawQuery: string): Promise<ChatbotQACacheItem | null> {
  // Real-time queries (cuaca, bencana, hari ini, dll) HARUS selalu mengambil data AI & live API terbaru
  if (isTimeSensitiveQuery(rawQuery)) {
    return null;
  }

  const normalized = normalizeQuery(rawQuery);
  if (!normalized || normalized.length < 2) return null;

  const cache = await loadQACache();
  if (cache.length === 0) return null;

  // 1. Direct match on normalized query
  let matchIndex = cache.findIndex(item => item.normalizedQuery === normalized);

  // 2. Fallback: match without common punctuation / trailing words
  if (matchIndex === -1) {
    matchIndex = cache.findIndex(item => {
      const itemNorm = item.normalizedQuery;
      return itemNorm && (itemNorm === normalized || (itemNorm.length > 5 && normalized.length > 5 && (itemNorm.includes(normalized) || normalized.includes(itemNorm))));
    });
  }

  if (matchIndex !== -1) {
    const match = cache[matchIndex];

    // Reject cached answers that contain invalid / 404 internal links
    if (hasInvalidInternalLinks(match.answer)) {
      console.warn('[Chatbot Cache] Rejecting & purging cached answer with invalid 404 URL');
      cache.splice(matchIndex, 1);
      persistQACacheAsync(cache).catch(err => console.warn('[Chatbot Cache] Async purge error:', err));
      return null;
    }

    // Update hit count and timestamp in background
    match.hitCount = (match.hitCount || 0) + 1;
    match.updatedAt = new Date().toISOString();

    // Persist hit count update asynchronously
    persistQACacheAsync(cache).catch(err => console.warn('[Chatbot Cache] Async update error:', err));

    return match;
  }

  return null;
}

/**
 * Saves a new Q&A pair to the R2 JSON cache and updates in-memory cache
 */
export async function saveQAToCache(rawQuery: string, answer: string, provider: string): Promise<boolean> {
  // Jangan simpan pertanyaan real-time (cuaca, bencana, hari ini) ke cache statis
  if (isTimeSensitiveQuery(rawQuery)) {
    return false;
  }

  const normalized = normalizeQuery(rawQuery);

  // Don't cache invalid queries or generic error messages
  if (!normalized || normalized.length < 2 || !answer || answer.trim().length === 0) {
    return false;
  }

  if (answer.includes('Maaf, sistem AI sedang mengalami peningkatan traffic') || answer.includes('Terjadi kesalahan')) {
    return false;
  }

  try {
    const cache = await loadQACache();
    const nowIso = new Date().toISOString();

    const existingIndex = cache.findIndex(item => item.normalizedQuery === normalized);

    if (existingIndex !== -1) {
      cache[existingIndex] = {
        ...cache[existingIndex],
        rawQuery,
        answer: answer.trim(),
        provider,
        hitCount: (cache[existingIndex].hitCount || 1) + 1,
        updatedAt: nowIso,
      };
    } else {
      const newItem: ChatbotQACacheItem = {
        id: `qa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        normalizedQuery: normalized,
        rawQuery: rawQuery.trim(),
        answer: answer.trim(),
        provider,
        hitCount: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      cache.unshift(newItem); // put newest at top
    }

    // Limit cache items to top 2000 to keep R2 JSON small
    if (cache.length > 2000) {
      // Sort by hitCount (descending) and keep top 2000
      cache.sort((a, b) => (b.hitCount || 0) - (a.hitCount || 0));
      cache.splice(2000);
    }

    inMemoryCache = cache;
    lastFetchTimestamp = Date.now();

    await uploadToR2(R2_QA_CACHE_KEY, JSON.stringify(cache, null, 2), 'application/json');
    return true;
  } catch (err) {
    console.error('[Chatbot Cache] Failed to save QA to R2:', err);
    return false;
  }
}

/**
 * Helper to upload cache to R2 without blocking main thread
 */
async function persistQACacheAsync(cache: ChatbotQACacheItem[]) {
  try {
    await uploadToR2(R2_QA_CACHE_KEY, JSON.stringify(cache, null, 2), 'application/json');
  } catch (e) {
    console.warn('[Chatbot Cache] Error in async persist:', e);
  }
}
