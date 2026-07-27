/**
 * Helper untuk memvalidasi request pada Cron Job.
 * Mendukung bypass dari Vercel Cron Scheduler internal (x-vercel-cron)
 * dan autentikasi token/secret manual untuk pemicuan dari Admin Dashboard.
 */
export function isValidCronRequest(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  
  // Vercel menyertakan header ini secara eksklusif untuk request cron internal.
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';

  const CRON_SECRET = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';

  if (isVercelCron) {
    return true;
  }

  const cleanExpected = CRON_SECRET.trim();
  const cleanExpectedNoPad = cleanExpected.replace(/=+$/, '');

  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token === cleanExpected || token.replace(/=+$/, '') === cleanExpectedNoPad) {
      return true;
    }
  }

  if (secret) {
    const cleanSecret = decodeURIComponent(secret).trim();
    if (
      cleanSecret === cleanExpected ||
      cleanSecret.replace(/=+$/, '') === cleanExpectedNoPad ||
      secret.trim() === cleanExpected ||
      secret.trim().replace(/=+$/, '') === cleanExpectedNoPad
    ) {
      return true;
    }
  }

  return false;
}
