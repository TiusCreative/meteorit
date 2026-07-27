type CacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

const globalCache = globalThis as typeof globalThis & {
  __meteoritNasaApiCache?: Map<string, CacheEntry<unknown>>;
};

function getCache() {
  if (!globalCache.__meteoritNasaApiCache) {
    globalCache.__meteoritNasaApiCache = new Map();
  }
  return globalCache.__meteoritNasaApiCache;
}

export async function fetchNasaJsonCached<T>(key: string, url: string, ttlMs: number): Promise<T> {
  const cache = getCache();
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  }).then(async (res) => {
    if (!res.ok) {
      throw new Error(`NASA API returned status ${res.status}`);
    }
    return res.json() as Promise<T>;
  });

  cache.set(key, {
    expiresAt: now + ttlMs,
    promise,
  });

  try {
    return await promise;
  } catch (error) {
    cache.delete(key);
    throw error;
  }
}
