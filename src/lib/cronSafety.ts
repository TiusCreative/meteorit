import { adminDb } from './firebaseAdmin';

export async function shouldSkipExternalFetch(key: string, cooldownMs: number) {
  try {
    const docRef = adminDb.collection('system').doc(`external-fetch-${key}`);
    const snap = await docRef.get();
    const lastRunAt = snap.exists ? snap.data()?.lastRunAt : null;
    const lastRunTime = lastRunAt ? new Date(lastRunAt).getTime() : 0;

    if (lastRunTime && Date.now() - lastRunTime < cooldownMs) {
      return {
        skip: true,
        lastRunAt,
        nextAllowedAt: new Date(lastRunTime + cooldownMs).toISOString(),
      };
    }

    await docRef.set({ lastRunAt: new Date().toISOString() }, { merge: true });
    return { skip: false, lastRunAt, nextAllowedAt: '' };
  } catch (error) {
    console.warn(`[Cron Safety] Guard ${key} gagal, fetch tetap dilanjutkan:`, error);
    return { skip: false, lastRunAt: null, nextAllowedAt: '' };
  }
}
