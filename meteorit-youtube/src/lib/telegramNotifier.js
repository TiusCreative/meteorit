// src/lib/telegramNotifier.js
// ============================================================
// Kirim notifikasi ke Telegram Bot
// - Notifikasi sukses upload video
// - Notifikasi error/gagal
// - Laporan harian
// ============================================================

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = () => process.env.TELEGRAM_CHAT_ID;

/**
 * Kirim pesan HTML ke Telegram
 */
async function sendTelegramMessage(chatId, message) {
  const token = BOT_TOKEN();
  if (!token || !chatId) {
    console.warn('[Telegram] Token atau Chat ID tidak tersedia, skip notifikasi');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.warn(`[Telegram] Gagal kirim: ${err}`);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Telegram] Error:', err.message);
    return false;
  }
}

/**
 * Notifikasi sukses upload 1 video
 */
export async function notifySuccess({ article, category, youtubeResult, videoIndex, totalVideos }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const message =
    `🎬 <b>YouTube Shorts Berhasil Diupload!</b>\n\n` +
    `📌 <b>${article.title}</b>\n\n` +
    `${category.emoji} <b>Kategori:</b> ${category.name}\n` +
    `📅 <b>Tanggal:</b> ${today}\n` +
    `🎥 <b>Video:</b> ${videoIndex}/${totalVideos}\n\n` +
    `🔗 <b>Tonton di YouTube:</b>\n${youtubeResult.youtubeUrl}\n\n` +
    `📰 <b>Artikel Sumber:</b>\n${article.articleUrl || `https://www.meteorit.my.id/blog/${article.id}`}\n\n` +
    `✅ <i>Transit R2 sudah dihapus otomatis</i>`;

  return sendTelegramMessage(CHAT_ID(), message);
}

/**
 * Notifikasi gagal upload
 */
export async function notifyError({ article, category, error, videoIndex, totalVideos }) {
  const message =
    `⚠️ <b>YouTube Shorts GAGAL Upload</b>\n\n` +
    `📌 Artikel: ${article?.title || 'Unknown'}\n` +
    `${category?.emoji || '❓'} Kategori: ${category?.name || 'Unknown'}\n` +
    `🎥 Video: ${videoIndex}/${totalVideos}\n\n` +
    `❌ <b>Error:</b>\n<code>${String(error).substring(0, 300)}</code>\n\n` +
    `🛠 <i>File transit di R2 mungkin masih tersisa, cek manual.</i>`;

  return sendTelegramMessage(CHAT_ID(), message);
}

/**
 * Laporan harian ringkasan
 */
export async function notifyDailyReport({ category, successCount, failCount, videos }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const videoLinks = videos.map((v, i) =>
    `   ${i + 1}. <a href="${v.youtubeUrl}">${v.title?.substring(0, 50)}...</a>`
  ).join('\n');

  const message =
    `📊 <b>LAPORAN HARIAN — YouTube Shorts</b>\n` +
    `${'─'.repeat(30)}\n` +
    `📅 <b>Tanggal:</b> ${today}\n` +
    `${category.emoji} <b>Kategori Hari Ini:</b> ${category.name}\n\n` +
    `<b>Hasil Upload:</b>\n` +
    `   ✅ Sukses : ${successCount} video\n` +
    `   ❌ Gagal  : ${failCount} video\n\n` +
    (videoLinks ? `<b>Video Baru:</b>\n${videoLinks}\n\n` : '') +
    `🌐 <b>Channel:</b> <a href="https://www.youtube.com/@Meteorit-h7d">@Meteorit-h7d</a>\n` +
    `🌍 <b>Website:</b> <a href="https://www.meteorit.my.id">meteorit.my.id</a>\n\n` +
    `🤖 <i>Sistem berjalan otomatis via GitHub Actions</i>`;

  return sendTelegramMessage(CHAT_ID(), message);
}

/**
 * Notifikasi ketika tidak ada artikel yang ditemukan
 */
export async function notifyNoArticles({ category }) {
  const message =
    `ℹ️ <b>Info: Tidak Ada Artikel Baru</b>\n\n` +
    `${category.emoji} Kategori: <b>${category.name}</b>\n\n` +
    `📭 Tidak ada artikel baru yang ditemukan untuk kategori ini hari ini.\n` +
    `🔄 Sistem akan mencoba kategori lain besok.\n\n` +
    `🌐 <a href="https://www.meteorit.my.id">meteorit.my.id</a>`;

  return sendTelegramMessage(CHAT_ID(), message);
}
