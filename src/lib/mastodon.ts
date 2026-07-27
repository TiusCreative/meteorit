/**
 * Integrasi Mastodon API
 * Berjalan di server-side untuk memposting status secara otomatis
 */

export async function postToMastodon(message: string, linkUrl?: string): Promise<boolean> {
  const server = process.env.MASTODON_SERVER || 'https://mastodon.social';
  const accessToken = process.env.MASTODON_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('[Mastodon] MASTODON_ACCESS_TOKEN tidak ditemukan di environment variables.');
    return false;
  }

  try {
    const statusText = message + (linkUrl ? `\n\n${linkUrl}` : '');

    const res = await fetch(`${server}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        status: statusText,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Mastodon] Respon error dari server:', errText);
      return false;
    }

    console.log('[Mastodon] Berhasil memposting status.');
    return true;
  } catch (error) {
    console.error('[Mastodon] Terjadi kesalahan dalam pemanggilan API:', error);
    return false;
  }
}
