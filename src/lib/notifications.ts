import { sendTelegramMessage } from './telegram';
import { postToFacebookPage } from './facebook';
import { postToBluesky } from './bluesky';
import { postToMastodon } from './mastodon';
import { sendDiscordWebhook } from './discord';
import { sendPushNotificationToAll } from './pushNotifications';
import { getAbsoluteUrl } from './siteUrl';

export async function sendBroadcastNotification({
  title,
  body,
  telegramHtml,
  link,
  imageUrl,
}: {
  title: string;
  body: string;
  telegramHtml: string;
  link: string;
  imageUrl?: string;
}) {
  const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';
  const fullLink = link.startsWith('http') ? link : getAbsoluteUrl(link);
  const relativePath = link.startsWith('http') ? new URL(link).pathname : link;

  let finalImageUrl = imageUrl;

  // 1. Try to resolve the image from the R2 article JSON if it's an article but imageUrl is missing
  if (!finalImageUrl && link) {
    const articleIdMatch = link.match(/\/(blog|mars|eonet|fireball)\/(article-[a-zA-Z0-9-]+|mars-[a-zA-Z0-9-]+|eonet-[a-zA-Z0-9-]+|fireball-[a-zA-Z0-9-]+)/);
    if (articleIdMatch) {
      const id = articleIdMatch[2];
      try {
        const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';
        const res = await fetch(`${R2_PUBLIC_URL}/data/blog/articles/${encodeURIComponent(id)}.json`);
        if (res.ok) {
          const articleData = await res.json();
          if (articleData.image) {
            finalImageUrl = articleData.image;
            console.log(`[Broadcast Manager] Resolved image from R2 article ${id}: ${finalImageUrl}`);
          }
        }
      } catch (err) {
        console.warn(`[Broadcast Manager] Gagal mengambil image artikel dari R2 untuk fallback:`, err);
      }
    }
  }

  // 2. If still no image, use the category-specific or general fallback image
  if (!finalImageUrl) {
    if (link.includes('cuaca')) {
      finalImageUrl = getAbsoluteUrl('/logo-cuaca.png');
    } else if (link.includes('monitoring') || link.includes('langit') || link.includes('ensiklopedia')) {
      finalImageUrl = getAbsoluteUrl('/logo-meteor.png');
    } else {
      finalImageUrl = getAbsoluteUrl('/logo.jpg');
    }
    console.log(`[Broadcast Manager] Using global fallback image: ${finalImageUrl}`);
  }

  // 3. Make sure the finalImageUrl is absolute
  if (finalImageUrl && !finalImageUrl.startsWith('http')) {
    finalImageUrl = getAbsoluteUrl(finalImageUrl);
  }

  // 1. Send Telegram Message to Channel
  const tgSuccess = await sendTelegramMessage(TELEGRAM_CHANNEL_ID, telegramHtml);

  // 2. Post to other social media platforms in parallel (all-settled)
  let fbSuccess = false;
  let igSuccess: boolean | 'skipped' | 'disabled' = 'skipped';
  let bskySuccess = false;
  let mastodonSuccess = false;
  let discordSuccess = false;

  try {
    const results = await Promise.allSettled([
      postToFacebookPage(body, fullLink, title, finalImageUrl),
      postToBluesky(body, fullLink),
      postToMastodon(body, fullLink),
      sendDiscordWebhook(title, body, fullLink)
    ]);

    const fbMetaResult = results[0].status === 'fulfilled' ? results[0].value : { fbSuccess: false, igSuccess: 'disabled' as const };
    fbSuccess = fbMetaResult.fbSuccess;
    igSuccess = fbMetaResult.igSuccess;
    bskySuccess = results[1].status === 'fulfilled' ? results[1].value : false;
    mastodonSuccess = results[2].status === 'fulfilled' ? results[2].value : false;
    discordSuccess = results[3].status === 'fulfilled' ? results[3].value : false;

    console.log(`[Broadcast Manager] Social posting results: FB=${fbSuccess}, IG=${igSuccess}, Bluesky=${bskySuccess}, Mastodon=${mastodonSuccess}, Discord=${discordSuccess}`);
  } catch (err) {
    console.error('[Broadcast Manager] Error during social posting:', err);
  }

  // 3. Send Web Push to Browser/PWA
  let pushSuccess = false;
  try {
    pushSuccess = await sendPushNotificationToAll(title, body, relativePath);
  } catch (err) {
    console.error('[Broadcast Manager] Web Push error:', err);
  }

  // 4. Rebuild RSS Feed dynamically
  try {
    const { rebuildRSSFeedHelper } = await import('./rss');
    await rebuildRSSFeedHelper();
  } catch (err) {
    console.error('[Broadcast Manager] RSS rebuild error:', err);
  }

  // 5. Send report to personal Telegram ID (background)
  sendSystemReportToTelegram(title, fullLink, {
    tgSuccess,
    fbSuccess,
    igSuccess,
    bskySuccess,
    mastodonSuccess,
    discordSuccess,
    pushSuccess
  }).catch(err => console.error('[Broadcast Manager] Gagal kirim laporan sistem ke Telegram:', err));

  return { tgSuccess, fbSuccess, igSuccess, bskySuccess, mastodonSuccess, discordSuccess, pushSuccess };
}

/**
 * Mengirim laporan status distribusi artikel baru ke Telegram Chat ID personal (admin).
 * Menyimpan data pesan ke Firestore untuk pembersihan otomatis setelah 48 jam.
 */
async function sendSystemReportToTelegram(
  title: string,
  link: string,
  results: {
    tgSuccess: boolean;
    fbSuccess: boolean;
    igSuccess: boolean | 'skipped' | 'disabled';
    bskySuccess: boolean;
    mastodonSuccess: boolean;
    discordSuccess: boolean;
    pushSuccess: boolean;
  }
) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Share Report] Telegram Bot Token atau Chat ID belum dikonfigurasi.');
    return;
  }

  const now = new Date();
  const jakartaTime = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  const getStatusEmoji = (success: boolean | 'disabled' | 'skipped') => {
    if (success === 'disabled') return '🚫 Dinonaktifkan (Izin/Token)';
    if (success === 'skipped') return '⏭️ Dilewati (Tidak Ada Media)';
    return success ? '✅ Sukses' : '❌ Gagal';
  };

  const pinterestApiKey = process.env.NEXT_PUBLIC_PINTEREST_API_KEY || '916a7781bd006d5cea3ac39c5087513e3ae89adc';
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(link)}&description=${encodeURIComponent(title)}&app_id=${pinterestApiKey}`;

  const message = [
    `📊 *LAPORAN DISTRIBUSI ARTIKEL BARU*`,
    ``,
    `📰 *Judul:* ${title}`,
    `🔗 *Link:* ${link}`,
    `🕐 *Waktu:* ${jakartaTime} WIB`,
    ``,
    `📢 *Status Pengiriman:*`,
    `• Telegram Channel: ${getStatusEmoji(results.tgSuccess)}`,
    `• Facebook Page: ${getStatusEmoji(results.fbSuccess)}`,
    `• Instagram Feed: ${getStatusEmoji(results.igSuccess)}`,
    `• Bluesky Feed: ${getStatusEmoji(results.bskySuccess)}`,
    `• Mastodon Status: ${getStatusEmoji(results.mastodonSuccess)}`,
    `• Discord Webhook: ${getStatusEmoji(results.discordSuccess)}`,
    `• Web Push (PWA): ${getStatusEmoji(results.pushSuccess)}`,
    `• Pinterest Share: 📌 [Pin ke Pinterest](${pinterestUrl})`,
    ``,
    `_Laporan ini akan dihapus secara otomatis dalam 48 jam._`,
    `_— Sistem Meteorit Indonesia —_`
  ].join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        disable_notification: true, // Silent notification agar tidak berisik
      })
    });

    const data = await res.json();
    if (data.ok && data.result?.message_id) {
      const messageId = data.result.message_id;
      const deleteAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 jam

      const { adminDb } = await import('./firebaseAdmin');
      await adminDb.collection('telegram_share_reports').add({
        message_id: messageId,
        chat_id: TELEGRAM_CHAT_ID,
        sent_at: now.toISOString(),
        delete_at: deleteAt.toISOString(),
        deleted: false,
        type: 'system_broadcast',
        title: title,
        results: results
      });
      console.log(`[Share Report] Laporan sistem berhasil dikirim ke chat ${TELEGRAM_CHAT_ID}. ID Pesan: ${messageId}`);
    } else {
      console.error('[Share Report] Telegram API error:', data);
    }
  } catch (err) {
    console.error('[Share Report] Error sending system report to Telegram:', err);
  }
}
