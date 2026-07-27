import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendBroadcastNotification } from '@/lib/notifications';
import { getAbsoluteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

// NASA API Configuration
const NASA_API_KEY = process.env.NASA_API_KEY || 'hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN';
const CRON_SECRET = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

async function translateWithGroq(text: string, systemPrompt: string): Promise<string> {
  const providers = [
    {
      name: 'Groq Utama',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant',
    },
    {
      name: 'Groq Backup',
      key: process.env.GROQ_BACKUP_API_KEY,
      model: 'llama-3.1-8b-instant',
    },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
        }),
      });
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      if (content) return content.trim();
    } catch (err) {
      console.warn(`[APOD Cron] ${provider.name} failed:`, err);
    }
  }
  return text;
}

/**
 * GET /api/cron/apod
 *
 * Dijadwalkan otomatis oleh Vercel Cron setiap hari pukul 06:00 UTC (13:00 WIB).
 * Dapat juga dipicu manual dari halaman Admin dengan autentikasi secret.
 *
 * Query params:
 *   ?secret=CRON_SECRET   (untuk trigger manual)
 *   ?force=true           (paksa re-fetch & re-translate meski sudah ada hari ini)
 */
import { isValidCronRequest } from '@/lib/cronAuth';

async function rebuildR2ApodHistoryCache() {
  try {
    const snapApods = await adminDb.collection('apod_history')
      .orderBy('id', 'desc')
      .limit(20)
      .get();
    
    const historyList: any[] = [];
    snapApods.forEach((doc: any) => {
      historyList.push({ id: doc.id, ...doc.data() });
    });
    
    await uploadToR2('data/encyclopedia/history.json', JSON.stringify(historyList, null, 2), 'application/json');
    console.log('[APOD Cron] Successfully rebuilt APOD history cache in R2. Total:', historyList.length);
  } catch (err) {
    console.error('[APOD Cron] Failed to rebuild APOD history cache:', err);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // === Fetch APOD dari NASA ===
    const apodRes = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`,
      { cache: 'no-store' }
    );

    if (!apodRes.ok) {
      throw new Error(`NASA APOD API error: HTTP ${apodRes.status}`);
    }

    const apodData = await apodRes.json();
    const apodDate: string = apodData.date || today;
    const docRef = adminDb.collection('apod_history').doc(apodDate);
    const docSnap = await docRef.get();

    // === Cek apakah sudah ada hari ini (kecuali force=true) ===
    if (docSnap.exists && !force) {
      const existing = docSnap.data() as any;
      console.log(`[APOD Cron] APOD ${apodDate} sudah ada di Firestore. Lewati re-translate.`);

      return NextResponse.json({
        success: true,
        skipped: true,
        message: `APOD tanggal ${apodDate} sudah ada. Gunakan ?force=true untuk paksa update.`,
        apod: existing.title?.id || existing.title?.en,
        date: apodDate,
      });
    }

    // === Terjemahkan Judul & Penjelasan via Groq AI ===
    const translatedTitle = await translateWithGroq(
      apodData.title,
      'Terjemahkan judul astronomi berikut ke Bahasa Indonesia secara singkat dan menarik. Hasil terjemahan harus berupa teks terjemahan langsung saja, TANPA penjelasan, pengantar, tanda kutip, atau kalimat pembuka.'
    );

    const translatedExplanation = await translateWithGroq(
      apodData.explanation,
      'Terjemahkan deskripsi ilmiah astronomi berikut ke Bahasa Indonesia yang mudah dipahami oleh pembaca umum. Hasil terjemahan harus berupa teks terjemahan langsung saja, TANPA pengantar atau kalimat pembuka.'
    );

    // === Cache gambar ke Cloudflare R2 (hindari rate limit NASA langsung) ===
    let finalImageUrl: string = apodData.hdurl || apodData.url;
    try {
      if (apodData.media_type === 'video') {
        finalImageUrl = apodData.url; // Tetap gunakan URL embed video
      } else {
        const imgFetch = await fetch(finalImageUrl);
        if (imgFetch.ok) {
          const buffer = Buffer.from(await imgFetch.arrayBuffer());
          const ext = finalImageUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const imgKey = `data/encyclopedia/images/${apodDate}.${ext}`;
          const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
          finalImageUrl = await uploadToR2(imgKey, buffer, contentType);
        }
      }
    } catch (imgErr) {
      console.error('[APOD Cron] Gagal cache gambar ke R2:', imgErr);
      // Lanjutkan dengan URL NASA asli sebagai fallback
    }

    const attribution = "\n\nSource: NASA Open Data APIs\nSumber Data: Pusat Data Publik Antariksa";
    const formattedApod = {
      id: apodDate,
      title: {
        en: apodData.title,
        id: translatedTitle,
      },
      explanation: {
        en: apodData.explanation + attribution,
        id: translatedExplanation + attribution,
      },
      image_url: finalImageUrl,
      copyright: apodData.copyright || 'NASA Public Domain',
      media_type: apodData.media_type || 'image',
      processedAt: new Date().toISOString(),
    };

    // === Simpan ke Firestore & R2 ===
    await Promise.all([
      // Simpan sebagai entri historis harian
      docRef.set(formattedApod),
      // Simpan sebagai "latest" untuk halaman utama
      uploadToR2(
        'data/encyclopedia/latest.json',
        JSON.stringify(formattedApod, null, 2),
        'application/json'
      ),
      rebuildR2ApodHistoryCache()
    ]);

    // === Kirim notifikasi ke Telegram ===
    const apodUrl = getAbsoluteUrl(`/apod/${apodDate}`);
    const channelMsg =
      `🌌 <b>NASA APOD Hari Ini — ${apodDate}</b>\n\n` +
      `📸 <b>${formattedApod.title.id}</b>\n\n` +
      `${formattedApod.explanation.id.substring(0, 280)}...\n\n` +
      (formattedApod.copyright !== 'NASA Public Domain'
        ? `📷 Foto: © ${formattedApod.copyright}\n\n`
        : '') +
      `🔗 Baca selengkapnya:\n${apodUrl}`;

    const adminMsg =
      `✅ <b>APOD Cron Berhasil</b>\n\n` +
      `📅 Tanggal: ${apodDate}\n` +
      `🌠 Judul: ${formattedApod.title.id}\n` +
      `🖼 Media: ${formattedApod.media_type}\n` +
      `${force ? '⚡ Mode: Force Update\n' : ''}` +
      `🛠 Cache R2 & Firestore diperbarui.`;

    await Promise.allSettled([
      sendBroadcastNotification({
        title: `🌌 NASA APOD Hari Ini: ${formattedApod.title.id}`,
        body: `NASA Astronomy Picture of the Day (${apodDate}):\n${formattedApod.title.id}`,
        telegramHtml: channelMsg,
        link: `/apod/${apodDate}`,
        imageUrl: formattedApod.image_url
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
    });
  } catch (error) {
    console.error('[APOD Cron] Error:', error);

    const errMsg =
      `⚠️ <b>APOD Cron GAGAL</b>\n\n` +
      `❌ Error: ${error instanceof Error ? error.message : String(error)}\n` +
      `📅 Tanggal: ${today}`;

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
