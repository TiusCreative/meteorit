/**
 * Integrasi Discord Webhook API
 * Mengirimkan data terbitan artikel/peristiwa baru ke server Discord dalam bentuk embed kaya
 */

export async function sendDiscordWebhook(
  title: string,
  message: string,
  linkUrl?: string
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK;

  if (!webhookUrl) {
    console.warn('[Discord] DISCORD_WEBHOOK tidak ditemukan di environment variables.');
    return false;
  }

  try {
    const cleanMessage = message
      .replace(/<[^>]*>/g, '') // Bersihkan tag HTML jika ada
      .substring(0, 1500); // Batasi panjang deskripsi agar pas di embed Discord

    const payload = {
      embeds: [
        {
          title: title,
          description: cleanMessage,
          url: linkUrl || undefined,
          color: 3447003, // Soft blue / blurple color
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Meteorit Indonesia',
            icon_url: 'https://meteorit.my.id/pwa-icons/icon-192.png',
          },
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Discord] Gagal mengirim pesan ke webhook:', errText);
      return false;
    }

    console.log('[Discord] Berhasil mengirim pesan embed ke Discord Webhook.');
    return true;
  } catch (error) {
    console.error('[Discord] Terjadi kesalahan dalam pemanggilan Webhook:', error);
    return false;
  }
}
