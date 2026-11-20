export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';
import { queryD1 } from '@/lib/d1Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendBroadcastNotification } from '@/lib/notifications';
import { getAbsoluteUrl } from '@/lib/siteUrl';
import { isValidCronRequest } from '@/lib/cronAuth';
import { translateText } from '@/lib/translator';
import { ensureImageUrl } from '@/lib/imageSafeguard';
import { fetchRawApod, isNasaLogoPlaceholder } from '@/lib/nasaApodHelper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';

/**
 * Rebuild and cache APOD history in Cloudflare R2 & D1
 */
async function rebuildR2ApodHistoryCache(newEntry?: any) {
  try {
    let historyList: any[] = [];
    try {
      const existing = await fetchJsonFromR2<any[]>('data/encyclopedia/history.json');
      if (Array.isArray(existing) && existing.length > 0) {
        historyList = existing;
      }
    } catch {}

    // Fallback to D1 if R2 history was empty
    if (historyList.length === 0) {
      try {
        const d1Res = await queryD1('SELECT id, date, title, explanation, image_url, copyright FROM apod_history ORDER BY id DESC LIMIT 150');
        if (d1Res?.results?.length) {
          historyList = d1Res.results.map((r: any) => ({
            id: r.id,
            title: typeof r.title === 'string' && r.title.startsWith('{') ? JSON.parse(r.title) : { en: r.title, id: r.title },
            explanation: typeof r.explanation === 'string' && r.explanation.startsWith('{') ? JSON.parse(r.explanation) : { en: r.explanation, id: r.explanation },
            image_url: r.image_url,
            copyright: r.copyright || 'NASA Public Domain',
            media_type: 'image'
          }));
        }
      } catch (d1Err) {
        console.warn('[APOD Cron] D1 fallback failed:', d1Err);
      }
    }

    if (newEntry) {
      const idx = historyList.findIndex(item => item.id === newEntry.id);
      if (idx >= 0) {
        historyList[idx] = newEntry;
      } else {
        historyList.unshift(newEntry);
      }

      // Also persist newEntry into D1
      try {
        const titleStr = typeof newEntry.title === 'object' ? JSON.stringify(newEntry.title) : String(newEntry.title || '');
        const expStr = typeof newEntry.explanation === 'object' ? JSON.stringify(newEntry.explanation) : String(newEntry.explanation || '');
        await queryD1(
          'INSERT OR REPLACE INTO apod_history (id, date, title, explanation, image_url, translations, processedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newEntry.id, newEntry.id, titleStr, expStr, newEntry.image_url || '', JSON.stringify(newEntry.translations || {}), newEntry.processedAt || new Date().toISOString()]
        );
      } catch (d1SaveErr) {
        console.warn('[APOD Cron] Failed to save newEntry to D1:', d1SaveErr);
      }
    }

    if (historyList.length > 0) {
      await uploadToR2('data/encyclopedia/history.json', JSON.stringify(historyList, null, 2), 'application/json');
      console.log('[APOD Cron] Updated APOD history cache in R2. Total:', historyList.length);
    }
  } catch (err) {
    console.error('[APOD Cron] Failed to update APOD history cache:', err);
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
    // ─── STEP 1: Cek cache D1 & Firestore dulu jika tidak force ────────────
    let existing: any = null;
    try {
      const d1Res = await queryD1('SELECT id, date, title, explanation, image_url, copyright FROM apod_history WHERE id = ? LIMIT 1', [targetDate]);
      if (d1Res?.results?.length) {
        const row = d1Res.results[0];
        existing = {
          id: row.id,
          title: typeof row.title === 'string' && row.title.startsWith('{') ? JSON.parse(row.title) : { en: row.title, id: row.title },
          explanation: typeof row.explanation === 'string' && row.explanation.startsWith('{') ? JSON.parse(row.explanation) : { en: row.explanation, id: row.explanation },
          image_url: row.image_url,
          copyright: row.copyright || 'NASA Public Domain',
        };
      }
    } catch (d1Err) {
      console.warn('[APOD Cron] D1 check error:', d1Err);
    }

    if (!existing) {
      const docRef = adminDb.collection('apod_history').doc(targetDate);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        existing = docSnap.data();
      }
    }

    // Periksa apakah data lama valid (bukan placeholder logo dan judul bukan "NASA Science")
    const isBadExisting = existing && (
      isNasaLogoPlaceholder(existing.image_url) ||
      (existing.title?.id && existing.title.id.toLowerCase() === 'nasa science') ||
      (existing.title?.en && existing.title.en.toLowerCase() === 'nasa science') ||
      !existing.explanation?.id ||
      existing.explanation?.id === existing.explanation?.en
    );

    if (existing && !force && !isBadExisting) {
      console.log(`[APOD Cron] APOD ${targetDate} sudah ada & valid. Rebuilding R2 history cache.`);
      await rebuildR2ApodHistoryCache(existing);
      return NextResponse.json({
        success: true,
        skipped: true,
        message: `APOD tanggal ${targetDate} sudah ada. Cache R2 history telah diperbarui.`,
        apod: existing.title?.id || existing.title?.en,
        date: targetDate,
      });
    }

    if (isBadExisting) {
      console.warn(`[APOD Cron] APOD ${targetDate} ada tapi data/gambar tidak valid (placeholder/untranslated). Memproses ulang...`);
    }

    // ─── STEP 2: Ambil data APOD asli menggunakan nasaApodHelper ──────────────
    console.log(`[APOD Cron] Fetching authentic NASA APOD for date: ${targetDate}`);
    const rawApod = await fetchRawApod(targetDate);

    // ─── STEP 3: Terjemahkan judul & penjelasan ke Bahasa Indonesia ──────────
    const [translatedTitle, translatedExplanation] = await Promise.all([
      translateText(
        rawApod.title,
        'Terjemahkan judul astronomi NASA APOD berikut ke Bahasa Indonesia secara singkat, akurat, dan ilmiah. Kembalikan HANYA teks judul terjemahan saja tanpa tanda kutip.',
        'id'
      ),
      translateText(
        rawApod.explanation,
        'Terjemahkan penjelasan ilmiah astronomi NASA APOD berikut ke Bahasa Indonesia yang akurat, mudah dipahami, mempertahankan seluruh paragraf, nama objek kosmik, misi antariksa, dan istilah teknis ilmiah. Jangan memotong teks.',
        'id'
      ),
    ]);

    let safeTitle = (translatedTitle || rawApod.title).trim().replace(/^["']+|["']+$/g, '');
    if (safeTitle.length > 80 && (safeTitle.toLowerCase().includes('tidak dapat diterjemahkan') || safeTitle.toLowerCase().includes('konteks'))) {
      safeTitle = rawApod.title;
    }

    // ─── STEP 4: Cache gambar ke Cloudflare R2 jika format gambar ───────────
    let finalImageUrl = rawApod.imageUrl;
    if (rawApod.mediaType !== 'video' && rawApod.imageUrl && !rawApod.imageUrl.includes('cdn.meteorit.my.id')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const imgFetch = await fetch(rawApod.imageUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeteoritIndonesia/1.0)' },
        });
        clearTimeout(timeoutId);

        if (imgFetch.ok) {
          const rawBuffer = Buffer.from(await imgFetch.arrayBuffer());
          const { convertToWebp } = await import('@/lib/imageConverter');
          const converted = await convertToWebp(rawBuffer, 80);
          const imgKey = `data/encyclopedia/images/${rawApod.date}.${converted.ext}`;
          finalImageUrl = await uploadToR2(imgKey, converted.buffer, converted.contentType);
          console.log(`[APOD Cron] Image cached to R2 (WebP 80%): ${finalImageUrl}`);
        }
      } catch (imgErr) {
        console.error('[APOD Cron] Gagal cache gambar ke R2, menggunakan URL asli:', imgErr);
        finalImageUrl = rawApod.imageUrl;
      }
    }

    // Pastikan URL gambar akhir valid dan bukan logo NASA
    finalImageUrl = await ensureImageUrl(finalImageUrl, 'apod');

    // ─── STEP 5: Simpan ke Firestore, D1, & R2 ────────────────────────────────
    const attribution = '\n\nSource: NASA Open Data APIs\nSumber Data: Pusat Data Publik Antariksa';
    const formattedApod = {
      id: rawApod.date,
      title: {
        en: rawApod.title,
        id: safeTitle,
      },
      explanation: {
        en: rawApod.explanation + attribution,
        id: (translatedExplanation || rawApod.explanation) + attribution,
      },
      image_url: finalImageUrl,
      copyright: rawApod.copyright || 'NASA Public Domain',
      media_type: rawApod.mediaType,
      videoEmbedUrl: rawApod.videoEmbedUrl,
      videoThumbnailUrl: rawApod.videoThumbnailUrl,
      processedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      date: rawApod.date,
      source: rawApod.source,
    };

    const docRefFinal = adminDb.collection('apod_history').doc(rawApod.date);
    await Promise.all([
      docRefFinal.set(formattedApod),
      uploadToR2('data/encyclopedia/latest.json', JSON.stringify(formattedApod, null, 2), 'application/json'),
      rebuildR2ApodHistoryCache(formattedApod),
    ]);

    // ─── STEP 6: Kirim notifikasi Telegram ───────────────────────────────────
    const apodUrl = getAbsoluteUrl(`/apod/${rawApod.date}`);
    const channelMsg =
      `🌌 <b>NASA APOD Hari Ini — ${rawApod.date}</b>\n\n` +
      `📸 <b>${formattedApod.title.id}</b>\n\n` +
      `${formattedApod.explanation.id.substring(0, 280)}...\n\n` +
      (rawApod.copyright !== 'NASA Public Domain' ? `📷 Foto: © ${rawApod.copyright}\n\n` : '') +
      `🔗 Baca selengkapnya:\n${apodUrl}`;

    const adminMsg =
      `✅ <b>APOD Cron Berhasil (${rawApod.source})</b>\n\n` +
      `📅 Tanggal: ${rawApod.date}\n` +
      `🌠 Judul: ${formattedApod.title.id}\n` +
      `🖼 Media: ${rawApod.mediaType}\n` +
      `${force ? '⚡ Mode: Force Update\n' : ''}` +
      `🛠 Cache R2 & Firestore diperbarui.`;

    await Promise.allSettled([
      sendBroadcastNotification({
        title: `🌌 NASA APOD Hari Ini: ${formattedApod.title.id}`,
        body: `NASA Astronomy Picture of the Day (${rawApod.date}):\n${formattedApod.title.id}`,
        telegramHtml: channelMsg,
        link: `/apod/${rawApod.date}`,
        imageUrl: formattedApod.image_url,
      }),
      sendTelegramMessage(TELEGRAM_CHAT_ID, adminMsg),
    ]);

    return NextResponse.json({
      success: true,
      message: `APOD ${rawApod.date} berhasil diproses dan disimpan.`,
      apod: formattedApod.title.id,
      date: rawApod.date,
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
