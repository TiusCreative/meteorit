import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendBroadcastNotification } from '@/lib/notifications';
import { getAbsoluteUrl } from '@/lib/siteUrl';
import { isValidCronRequest } from '@/lib/cronAuth';
import { translateText } from '@/lib/translator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// NASA API Configuration
const NASA_API_KEY = process.env.NASA_API_KEY || 'hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';

const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december'
];

/**
 * GET /api/cron/apod
 *
 * Dijadwalkan otomatis oleh Vercel Cron setiap hari pukul 06:00 UTC (13:00 WIB).
 * Dapat juga dipicu manual dari halaman Admin dengan autentikasi secret.
 *
 * Query params:
 *   ?secret=CRON_SECRET   (untuk trigger manual)
 *   ?force=true           (paksa re-fetch & re-translate meski sudah ada hari ini)
 *   ?date=YYYY-MM-DD      (opsional: fetch tanggal spesifik)
 */

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Deteksi apakah URL adalah logo placeholder NASA (bukan gambar astronomi asli) */
function isNasaLogoPlaceholder(url: string): boolean {
  if (!url) return true;
  return url.includes('nasa-logo') ||
    url.includes('/themes/nasa-child/assets/images/') ||
    url.includes('nasa-logo@2x') ||
    url.endsWith('nasa-child/assets/images/nasa-logo@2x.png');
}

/** Retry fetch dengan exponential backoff */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 2000
): Promise<Response> {
  let lastError: Error = new Error('Unknown fetch error');
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      // Jika 5xx (server error NASA), retry
      if (res.status >= 500 && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[APOD Cron] NASA API returned ${res.status}, retry ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[APOD Cron] Fetch attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/** Ambil data APOD dari NASA WordPress API (science.nasa.gov) */
async function fetchApodFromWordPress(date: string): Promise<{
  title: string;
  explanation: string;
  imageUrl: string | null;
  copyright: string;
  mediaType: string;
} | null> {
  try {
    const d = new Date(date + 'T00:00:00Z');
    const month = MONTH_NAMES[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const slugPrefix = `apod-${year}-${month}-${day}`;

    const wpUrl = `https://science.nasa.gov/wp-json/wp/v2/image-article?search=${slugPrefix}&per_page=3&orderby=date&order=desc`;
    const wpRes = await fetchWithRetry(wpUrl, { cache: 'no-store' }, 2, 1500);
    if (!wpRes.ok) return null;

    const wpData = await wpRes.json();
    if (!Array.isArray(wpData) || wpData.length === 0) return null;

    const matched = wpData.find((item: any) => item.slug?.startsWith(slugPrefix)) || wpData[0];
    if (!matched) return null;

    // Ambil judul bersih (tanpa HTML entities)
    const rawTitle = matched.title?.rendered || '';
    const title = rawTitle
      .replace(/APOD: \d{4} \w+ \d+ – /i, '')  // Hapus prefix "APOD: 2026 October 10 – "
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8217;/g, "'").trim();

    // Ambil excerpt/explanation
    const rawExcerpt = matched.excerpt?.rendered || '';
    const explanation = rawExcerpt
      .replace(/<[^>]+>/g, '')   // Strip HTML tags
      .replace(/\[&hellip;\]/g, '...')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').trim();

    // Ambil URL gambar: prioritas featured_image.file > featured_image_url
    let imageUrl: string | null = null;
    const fi = matched.featured_image;
    if (fi?.file && fi.file.startsWith('http') && !isNasaLogoPlaceholder(fi.file)) {
      imageUrl = fi.file;
    } else if (matched.featured_image_url && !isNasaLogoPlaceholder(matched.featured_image_url)) {
      imageUrl = matched.featured_image_url;
    }

    console.log(`[APOD Cron] WordPress API data for ${date}: title="${title}", imageUrl=${imageUrl}`);
    return { title, explanation, imageUrl, copyright: 'NASA Public Domain', mediaType: 'image' };
  } catch (err) {
    console.warn('[APOD Cron] WordPress API fetch failed:', err);
    return null;
  }
}

async function translateWithGroq(text: string, systemPrompt: string): Promise<string> {
  if (!text) return text;
  return await translateText(text, systemPrompt);
}

async function rebuildR2ApodHistoryCache() {
  try {
    const snapApods = await adminDb.collection('apod_history')
      .orderBy('id', 'desc')
      .limit(100)
      .get();
    
    const historyList: any[] = [];
    snapApods.forEach((doc: any) => {
      historyList.push({ id: doc.id, ...doc.data() });
    });
    
    await uploadToR2('data/encyclopedia/history.json', JSON.stringify(historyList, null, 2), 'application/json');
    console.log('[APOD Cron] Rebuilt APOD history cache in R2. Total:', historyList.length);
  } catch (err) {
    console.error('[APOD Cron] Failed to rebuild APOD history cache:', err);
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';
  const dateParam = searchParams.get('date') || null;

  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];
  const targetDate = dateParam || today;

  try {
    // ─── STEP 1: Cek cache Firestore dulu ─────────────────────────────────────
    const docRef = adminDb.collection('apod_history').doc(targetDate);
    const docSnap = await docRef.get();

    if (docSnap.exists && !force) {
      const existing = docSnap.data() as any;
      // Jika sudah ada tapi gambarnya masih placeholder, lanjut proses ulang
      if (!isNasaLogoPlaceholder(existing.image_url || '')) {
        console.log(`[APOD Cron] APOD ${targetDate} sudah ada & valid. Rebuilding R2 history cache.`);
        await rebuildR2ApodHistoryCache();
        return NextResponse.json({
          success: true,
          skipped: true,
          message: `APOD tanggal ${targetDate} sudah ada. Cache R2 history telah diperbarui.`,
          apod: existing.title?.id || existing.title?.en,
          date: targetDate,
        });
      }
      console.warn(`[APOD Cron] APOD ${targetDate} ada di Firestore tapi gambarnya placeholder. Memproses ulang...`);
    }

    // ─── STEP 2: Coba NASA API dulu (dengan retry) ────────────────────────────
    let apodTitle = '';
    let apodExplanation = '';
    let apodDate = targetDate;
    let rawImageUrl = '';
    let mediaType = 'image';
    let copyright = 'NASA Public Domain';
    let nasaApiFailed = false;

    try {
      const nasaUrl = dateParam
        ? `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${dateParam}`
        : `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

      console.log(`[APOD Cron] Fetching NASA API: ${nasaUrl.replace(NASA_API_KEY, 'API_KEY_HIDDEN')}`);
      const apodRes = await fetchWithRetry(nasaUrl, { cache: 'no-store' }, 3, 2000);

      if (apodRes.ok) {
        const apodData = await apodRes.json();
        apodTitle = apodData.title || '';
        apodExplanation = apodData.explanation || '';
        apodDate = apodData.date || targetDate;
        mediaType = apodData.media_type || 'image';
        copyright = apodData.copyright || 'NASA Public Domain';
        rawImageUrl = apodData.hdurl || apodData.url || '';

        // Cek apakah NASA mengembalikan placeholder logo
        if (mediaType !== 'video' && isNasaLogoPlaceholder(rawImageUrl)) {
          console.warn(`[APOD Cron] NASA returned placeholder logo for ${apodDate}. Will use WordPress fallback for image.`);
          rawImageUrl = ''; // Reset agar ambil dari WP
        }
        console.log(`[APOD Cron] NASA API OK: title="${apodTitle}", date=${apodDate}, imageUrl=${rawImageUrl || '(placeholder)'}`);
      } else {
        console.warn(`[APOD Cron] NASA API returned HTTP ${apodRes.status}. Falling back to WordPress API.`);
        nasaApiFailed = true;
      }
    } catch (nasaErr: any) {
      console.warn(`[APOD Cron] NASA API failed: ${nasaErr.message}. Falling back to WordPress API.`);
      nasaApiFailed = true;
    }

    // ─── STEP 3: Fallback ke WordPress API jika NASA gagal atau gambar placeholder ──
    let wpData: Awaited<ReturnType<typeof fetchApodFromWordPress>> = null;
    if (nasaApiFailed || !apodTitle || !rawImageUrl) {
      console.log(`[APOD Cron] Using WordPress API for ${targetDate}...`);
      wpData = await fetchApodFromWordPress(targetDate);

      if (wpData) {
        // Isi dari WP jika NASA gagal total
        if (!apodTitle) apodTitle = wpData.title;
        if (!apodExplanation) apodExplanation = wpData.explanation;
        if (!rawImageUrl && wpData.imageUrl) rawImageUrl = wpData.imageUrl;
        if (nasaApiFailed) {
          mediaType = wpData.mediaType;
          copyright = wpData.copyright;
        }
        console.log(`[APOD Cron] WordPress API data merged. title="${apodTitle}"`);
      } else if (nasaApiFailed && !apodTitle) {
        throw new Error('Baik NASA API maupun WordPress API tidak dapat mengambil data APOD untuk tanggal ini.');
      }
    }

    // Jika masih tidak ada gambar setelah semua upaya
    if (!rawImageUrl && wpData?.imageUrl) rawImageUrl = wpData.imageUrl;

    // ─── STEP 4: Terjemahkan ke Bahasa Indonesia ──────────────────────────────
    const [translatedTitle, translatedExplanation] = await Promise.all([
      translateWithGroq(
        apodTitle,
        'Terjemahkan judul astronomi berikut ke Bahasa Indonesia secara singkat dan menarik. Hasil terjemahan harus berupa teks terjemahan langsung saja, TANPA penjelasan, pengantar, tanda kutip, atau kalimat pembuka.'
      ),
      translateWithGroq(
        apodExplanation,
        'Terjemahkan deskripsi ilmiah astronomi berikut ke Bahasa Indonesia yang mudah dipahami oleh pembaca umum. Hasil terjemahan harus berupa teks terjemahan langsung saja, TANPA pengantar atau kalimat pembuka.'
      ),
    ]);

    // ─── STEP 5: Cache gambar ke Cloudflare R2 ────────────────────────────────
    let finalImageUrl = rawImageUrl;
    if (mediaType !== 'video' && rawImageUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const imgFetch = await fetch(rawImageUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (imgFetch.ok) {
          const buffer = Buffer.from(await imgFetch.arrayBuffer());
          const ext = rawImageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
          const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
          const imgKey = `data/encyclopedia/images/${apodDate}.${safeExt}`;
          const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
          finalImageUrl = await uploadToR2(imgKey, buffer, contentType);
          console.log(`[APOD Cron] Image cached to R2: ${finalImageUrl}`);
        }
      } catch (imgErr) {
        console.error('[APOD Cron] Gagal cache gambar ke R2, menggunakan URL asli:', imgErr);
        finalImageUrl = rawImageUrl; // Tetap gunakan URL asli jika R2 gagal
      }
    }

    // ─── STEP 6: Simpan ke Firestore & R2 ────────────────────────────────────
    const attribution = '\n\nSource: NASA Open Data APIs\nSumber Data: Pusat Data Publik Antariksa';
    const formattedApod = {
      id: apodDate,
      title: {
        en: apodTitle,
        id: translatedTitle,
      },
      explanation: {
        en: apodExplanation + attribution,
        id: translatedExplanation + attribution,
      },
      image_url: finalImageUrl,
      copyright,
      media_type: mediaType,
      processedAt: new Date().toISOString(),
      source: nasaApiFailed ? 'wordpress-fallback' : 'nasa-api',
    };

    const docRefFinal = adminDb.collection('apod_history').doc(apodDate);
    await Promise.all([
      docRefFinal.set(formattedApod),
      uploadToR2('data/encyclopedia/latest.json', JSON.stringify(formattedApod, null, 2), 'application/json'),
      rebuildR2ApodHistoryCache(),
    ]);

    // ─── STEP 7: Kirim notifikasi Telegram ───────────────────────────────────
    const apodUrl = getAbsoluteUrl(`/apod/${apodDate}`);
    const channelMsg =
      `🌌 <b>NASA APOD Hari Ini — ${apodDate}</b>\n\n` +
      `📸 <b>${formattedApod.title.id}</b>\n\n` +
      `${formattedApod.explanation.id.substring(0, 280)}...\n\n` +
      (copyright !== 'NASA Public Domain' ? `📷 Foto: © ${copyright}\n\n` : '') +
      `🔗 Baca selengkapnya:\n${apodUrl}`;

    const sourceLabel = nasaApiFailed ? ' (WP Fallback)' : '';
    const adminMsg =
      `✅ <b>APOD Cron Berhasil${sourceLabel}</b>\n\n` +
      `📅 Tanggal: ${apodDate}\n` +
      `🌠 Judul: ${formattedApod.title.id}\n` +
      `🖼 Media: ${mediaType}\n` +
      `${force ? '⚡ Mode: Force Update\n' : ''}` +
      `🛠 Cache R2 & Firestore diperbarui.`;

    await Promise.allSettled([
      sendBroadcastNotification({
        title: `🌌 NASA APOD Hari Ini: ${formattedApod.title.id}`,
        body: `NASA Astronomy Picture of the Day (${apodDate}):\n${formattedApod.title.id}`,
        telegramHtml: channelMsg,
        link: `/apod/${apodDate}`,
        imageUrl: formattedApod.image_url,
      }),
      sendTelegramMessage(TELEGRAM_CHAT_ID, adminMsg),
    ]);

    return NextResponse.json({
      success: true,
      message: `APOD ${apodDate} berhasil diproses dan disimpan.`,
      apod: formattedApod.title.id,
      date: apodDate,
      imageUrl: finalImageUrl,
      forced: force,
      source: formattedApod.source,
    });

  } catch (error) {
    console.error('[APOD Cron] Error:', error);

    const errMsg =
      `⚠️ <b>APOD Cron GAGAL</b>\n\n` +
      `❌ Error: ${error instanceof Error ? error.message : String(error)}\n` +
      `📅 Tanggal: ${targetDate}\n` +
      `🕐 Waktu: ${new Date().toISOString()}`;

    try {
      await sendTelegramMessage(TELEGRAM_CHAT_ID, errMsg);
    } catch {}

    return NextResponse.json(
      {
        error: 'Gagal memproses APOD NASA.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
