import { getSiteUrl } from './siteUrl';

// Mengambil token dari Environment Variable demi keamanan kode
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Mengirim pesan dengan format HTML ke Telegram Chat ID atau Channel ID.
 * Sudah dilengkapi fitur otomatis Bypass Cache Gambar Open Graph untuk link ensiklopedia.
 */
export async function sendTelegramMessage(chatId: string, text: string, retries = 2): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN tidak terdefinisi di Environment Variables.");
    return false;
  }

  // --- TRIK BYPASS CACHE GAMBAR TELEGRAM ---
  let updatedText = text;
  try {
    const escapedSiteUrl = getSiteUrl().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const urlRegex = new RegExp(`(${escapedSiteUrl}/[^\\s<]+)`, 'g');
    if (urlRegex.test(text)) {
      updatedText = text.replace(urlRegex, (match) => {
        const separator = match.includes('?') ? '&' : '?';
        return `${match}${separator}v=${Date.now()}`;
      });
    }
  } catch {
    updatedText = text;
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: updatedText,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        }),
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined
      });

      if (res.ok) {
        return true;
      }

      const errBody = await res.text().catch(() => '');
      console.warn(`[Telegram] Percobaan ${attempt} gagal untuk chat ${chatId}: ${res.status} ${errBody.slice(0, 100)}`);
    } catch (err: any) {
      console.warn(`[Telegram] Percobaan ${attempt} error untuk chat ${chatId}: ${err?.message || err}`);
    }

    if (attempt <= retries) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  console.error(`[Telegram] Semua percobaan pengiriman (${retries + 1}x) gagal untuk chat ${chatId}.`);
  return false;
}
