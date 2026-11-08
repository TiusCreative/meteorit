import { queryD1 } from './d1Client';

export async function shouldSkipExternalFetch(key: string, cooldownMs: number) {
  try {
    const d1Key = `external-fetch-${key}`;
    const res = await queryD1('SELECT value FROM system_state WHERE key = ? LIMIT 1', [d1Key]);
    const row = res?.results?.[0];
    const lastRunAt = row?.value || null;
    const lastRunTime = lastRunAt ? new Date(lastRunAt).getTime() : 0;

    if (lastRunTime && Date.now() - lastRunTime < cooldownMs) {
      return {
        skip: true,
        lastRunAt,
        nextAllowedAt: new Date(lastRunTime + cooldownMs).toISOString(),
      };
    }

    const nowIso = new Date().toISOString();
    await queryD1('INSERT OR REPLACE INTO system_state (key, value, updated_at) VALUES (?, ?, ?)', [
      d1Key,
      nowIso,
      nowIso
    ]);
    return { skip: false, lastRunAt, nextAllowedAt: '' };
  } catch (error) {
    console.warn(`[Cron Safety] Guard ${key} gagal, fetch tetap dilanjutkan:`, error);
    return { skip: false, lastRunAt: null, nextAllowedAt: '' };
  }
}
