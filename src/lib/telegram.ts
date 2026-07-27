import { getSiteUrl } from './siteUrl';

// Mengambil token dari Environment Variable demi keamanan kode
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Mengirim pesan dengan format HTML ke Telegram Chat ID atau Channel ID.
 * Sudah dilengkapi fitur otomatis Bypass Cache Gambar Open Graph untuk link ensiklopedia.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN tidak terdefinisi di Environment Variables.");
    return false;
  }

  try {
    // --- TRIK BYPASS CACHE GAMBAR TELEGRAM ---
    // Mencari semua URL internal website di dalam teks dan menambahkan ?v=timestamp unik
    // agar Telegram membypass cache preview-nya dan selalu mengambil logo terbaru
    let updatedText = text;
    const escapedSiteUrl = getSiteUrl().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const urlRegex = new RegExp(`(${escapedSiteUrl}/[^\\s<]+)`, 'g');
    
    if (urlRegex.test(text)) {
      updatedText = text.replace(urlRegex, (match) => {
        // Jika link sudah memiliki query (?), gunakan '&', jika belum gunakan '?'
        const separator = match.includes('?') ? '&' : '?';
        return `${match}${separator}v=${Date.now()}`;
      });
    }
    // -----------------------------------------

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: updatedText, // Mengirimkan teks yang URL-nya sudah dimodifikasi
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[Telegram] Respon error dari Telegram untuk chat ${chatId}:`, errBody);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[Telegram] Gagal mengirim pesan ke chat ${chatId}:`, err);
    return false;
  }
}
