import { NextResponse } from 'next/server';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';
import { sendTelegramMessage } from '@/lib/telegram';
import { getAbsoluteUrl, getSiteUrl } from '@/lib/siteUrl';
import { shouldSkipExternalFetch } from '@/lib/cronSafety';
import { buildArticleTranslations } from '@/lib/articleLocalization';
import { sendBroadcastNotification } from '@/lib/notifications';
import { rebuildRSSFeedHelper } from '@/lib/rss';

export const dynamic = 'force-dynamic';
export const maxDuration = 80;

type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  provider: string;
};



import { fetchAndCacheWeather } from '@/lib/openweather';

async function getWeatherContext(lat: string | null, lon: string | null, latDir: string | null, lonDir: string | null): Promise<string> {
  if (!lat || !lon) return '';
  try {
    // Konversi arah ke signed decimal
    const latNum = parseFloat(lat) * (latDir === 'S' ? -1 : 1);
    const lonNum = parseFloat(lon) * (lonDir === 'W' ? -1 : 1);
    const w = await fetchAndCacheWeather(latNum, lonNum);
    if (!w) return '';
    return `Kondisi cuaca di lokasi kejadian saat ini: ${w.description}, suhu ${w.temp}°C, tutupan awan ${w.clouds}%, angin ${w.wind_speed} m/s.`;
  } catch {
    return '';
  }
}

async function generateArticleWithFallback(prompt: string): Promise<GeneratedArticle> {
  const messages = [
    { role: 'system', content: 'Anda adalah penulis sains populer bertema astronomi dan fenomena luar angkasa berbahasa Indonesia yang profesional. Anda wajib memberikan output dalam format JSON murni.' },
    { role: 'user', content: prompt }
  ];

  const providers = [
    {
      name: 'Groq Utama',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile'
    },
    {
      name: 'Groq Backup',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_BACKUP_API_KEY,
      model: 'llama-3.3-70b-versatile'
    },
    {
      name: 'OpenRouter Utama',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.3-70b-instruct:free'
    },
    {
      name: 'OpenRouter Backup',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_BACKUP_API_KEY,
      model: 'meta-llama/llama-3.3-70b-instruct:free'
    }

  ];

  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.key) continue;

    try {
      const aiResponse = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          ...(provider.url.includes('openrouter.ai') ? {
            'HTTP-Referer': getSiteUrl(),
            'X-Title': 'Meteorit Indonesia'
          } : {})
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (!aiResponse.ok) {
        const body = await aiResponse.text();
        throw new Error(`${aiResponse.status} ${aiResponse.statusText}: ${body.slice(0, 200)}`);
      }

      const aiData = await aiResponse.json();
      const rawContent = aiData.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error('Respons AI kosong.');

      const cleanedContent = String(rawContent).replace(/```json|```/g, '').trim();
      const articleJson = JSON.parse(cleanedContent);

      if (!articleJson.title || !articleJson.excerpt || !articleJson.content) {
        throw new Error('JSON AI tidak lengkap.');
      }


      return {
        title: articleJson.title,
        excerpt: articleJson.excerpt,
        content: articleJson.content,
        provider: provider.name
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[Cron Fireball] ${provider.name} gagal, mencoba provider berikutnya:`, msg);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`Semua provider AI gagal. ${errors.join(' | ') || 'Tidak ada API key AI yang tersedia.'}`);
}

import { isValidCronRequest } from '@/lib/cronAuth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bypass = searchParams.get('bypass') === 'true';
    if (!bypass) {
      const fetchGuard = await shouldSkipExternalFetch('jpl-fireball', 22 * 60 * 60 * 1000);
      if (fetchGuard.skip) {
        return NextResponse.json({
          success: true,
          created: false,
          message: 'Fetch JPL Fireball dilewati karena cooldown anti-loop masih aktif.',
          nextAllowedAt: fetchGuard.nextAllowedAt
        });
      }
    }

    // 1. Fetch data JPL Fireball API (no API key needed)
    const firestoreRes = await fetch(
      'https://ssd-api.jpl.nasa.gov/fireball.api?limit=30&sort=-date',
      { next: { revalidate: 0 } }
    );

    if (!firestoreRes.ok) {
      throw new Error(`JPL Fireball API returned status ${firestoreRes.status}`);
    }

    const raw = await firestoreRes.json();
    const fields: string[] = raw.fields || [];
    const dataRows: (string | null)[][] = raw.data || [];

    if (dataRows.length === 0) {
      return NextResponse.json({ success: true, created: false, message: 'Tidak ada data Fireball dari JPL.' });
    }

    // Map rows to objects
    const events = dataRows.map((row) => {
      const obj: Record<string, string | null> = {};
      fields.forEach((field, i) => { obj[field] = row[i] ?? null; });
      return {
        date: obj['date'] || '',
        energy: obj['energy'],
        impact_e: obj['impact-e'],
        lat: obj['lat'],
        lon: obj['lon'],
        lat_dir: obj['lat-dir'],
        lon_dir: obj['lon-dir'],
        alt: obj['alt'],
        vel: obj['vel'],
      };
    });

    // 2. Filter kejadian dalam 30 hari terakhir yang belum ada artikelnya
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let selectedEvent: typeof events[0] | null = null;
    let docId = '';

    // Prioritas: energy tinggi, lokasi ada, belum ada artikel
    const sorted = [...events].sort((a, b) => {
      const ea = parseFloat(a.energy || '0');
      const eb = parseFloat(b.energy || '0');
      return eb - ea;
    });

    for (const event of sorted) {
      const eventDate = new Date(event.date);
      if (eventDate < thirtyDaysAgo) continue;

      const candidateId = `fireball-${event.date.replace(/[: ]/g, '-').substring(0, 10)}`;
      // Check R2 posts.json (no Firestore needed)
      const existingPosts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
      const alreadyExists = existingPosts.some((p: any) => p.id === candidateId);
      if (!alreadyExists) {
        selectedEvent = event;
        docId = candidateId;
        break;
      }
    }

    if (!selectedEvent) {
      // Jika semua kejadian 30 hari sudah ada artikelnya, buat artikel edukatif tentang fireball
      const eduDocId = `fireball-edu-${new Date().toISOString().split('T')[0]}`;
      const existingPostsEdu = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
      if (existingPostsEdu.some((p: any) => p.id === eduDocId)) {
        return NextResponse.json({
          success: true,
          created: false,
          message: 'Semua kejadian Fireball terbaru sudah memiliki artikel.'
        });
      }
      selectedEvent = sorted[0] || events[0];
      docId = eduDocId;
    }

    // 3. Dapatkan konteks cuaca di lokasi (jika ada koordinat)
    const weatherContext = await getWeatherContext(
      selectedEvent.lat,
      selectedEvent.lon,
      selectedEvent.lat_dir,
      selectedEvent.lon_dir
    );

    // Hitung lokasi dalam format readable
    const latStr = selectedEvent.lat && selectedEvent.lat_dir
      ? `${selectedEvent.lat}° ${selectedEvent.lat_dir}`
      : 'tidak diketahui';
    const lonStr = selectedEvent.lon && selectedEvent.lon_dir
      ? `${selectedEvent.lon}° ${selectedEvent.lon_dir}`
      : 'tidak diketahui';

    // Konversi energi ke kiloton TNT
    const energyGJ = parseFloat(selectedEvent.energy || '0');
    const energyKt = (energyGJ / 4.184).toFixed(2);

    const impactE = parseFloat(selectedEvent.impact_e || '0');

    // 4. Generate artikel AI
    const prompt = `Tulis artikel edukasi sains populer berbahasa Indonesia tentang peristiwa Fireball (bola api meteor) yang terdeteksi masuk ke atmosfer Bumi.

Data Teknis Kejadian:
- Tanggal & Waktu: ${selectedEvent.date} UTC
- Lokasi (Lintang): ${latStr}
- Lokasi (Bujur): ${lonStr}
- Energi Ledakan: ${energyGJ} GJ (setara ${energyKt} kiloton TNT)
- Energi Tumbukan: ${impactE} kt
- Ketinggian: ${selectedEvent.alt ? selectedEvent.alt + ' km' : 'tidak terdeteksi'}
- Kecepatan: ${selectedEvent.vel ? selectedEvent.vel + ' km/s' : 'tidak terdeteksi'}
${weatherContext ? `\nKonteks Lokasi:\n${weatherContext}` : ''}

Ketentuan Artikel:
1. Judul yang menarik dan ramah SEO (maksimal 10 kata).
2. Jelaskan dengan bahasa santai apa itu fireball/bola api meteor, seberapa sering terjadi, dan apakah berbahaya bagi penduduk.
3. Berikan konteks ukuran energi ledakan (bandingkan dengan bom atom Hiroshima = 63 TJ atau 15 kiloton, dll).
4. Jelaskan bagaimana NASA/JPL mendeteksi kejadian ini dari sensor inframerah global.
5. Panjang artikel 400-500 kata, format Markdown dengan beberapa subjudul.
6. Output JSON murni:
   - "title": judul SEO menarik
   - "excerpt": ringkasan 1-2 kalimat
   - "content": artikel Markdown lengkap

Kembalikan HANYA JSON murni tanpa pembungkus markdown.`;

    const articleJson = await generateArticleWithFallback(prompt);

    // 5. Generate ilustrasi
    const illustrationPrompt = `dramatic fireball meteor blazing through Earth's atmosphere, glowing orange trail, night sky, scientific visualization, realistic digital art`;
    const imagePath = `data/fireball/images/${docId}.jpg`;
    const { generateImageWithFallback } = await import('@/lib/imageGenerator');
    const imageUrl = await generateImageWithFallback(illustrationPrompt, imagePath);

    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const attribution = "\n\nSource: NASA Open Data APIs\nSumber Data: Pusat Data Publik Antariksa";
    const articleContent = articleJson.content + attribution;

    // Auto-translate ke 4 bahasa (EN, MS, ZH, JA) saat artikel dibuat
    console.log(`[Cron Fireball] Memulai auto-translate untuk: ${articleJson.title}`);
    let translations = {};
    try {
      translations = await buildArticleTranslations({
        title: articleJson.title,
        excerpt: articleJson.excerpt,
        content: articleContent,
      });
      console.log(`[Cron Fireball] ✅ Auto-translate selesai: ${Object.keys(translations).join(', ')}`);
    } catch (translateErr) {
      console.warn('[Cron Fireball] ⚠️ Auto-translate gagal, artikel tetap disimpan tanpa terjemahan:', translateErr);
    }

    const newArticle = {
      id: docId,
      title: articleJson.title,
      excerpt: articleJson.excerpt,
      content: articleContent,
      translations,
      category: 'Bola Api & Fireball',
      date: dateFormatted,
      image: imageUrl,
      views: 0,
      status: 'Published',
      review_status: 'Otomatis',
      ai_provider: articleJson.provider,
      createdAt: new Date().toISOString(),
      fireball_data: {
        event_date: selectedEvent.date,
        lat: selectedEvent.lat,
        lon: selectedEvent.lon,
        lat_dir: selectedEvent.lat_dir,
        lon_dir: selectedEvent.lon_dir,
        energy_gj: energyGJ,
        energy_kt: parseFloat(energyKt),
        impact_e: impactE,
        alt: selectedEvent.alt,
        vel: selectedEvent.vel,
        source: 'NASA/JPL Fireball Data API'
      }
    };

    // 6. Save article directly to R2 (no Firestore)
    await uploadToR2(`data/blog/articles/${docId}.json`, JSON.stringify(newArticle, null, 2), 'application/json');

    // Save metadata to Cloudflare D1
    try {
      const { queryD1 } = await import('@/lib/d1Client');
      await queryD1(
        `INSERT OR REPLACE INTO articles (
          id, title, category, r2_path, createdAt, tags, image, excerpt, date, views, status, review_status, ai_provider
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newArticle.id,
          newArticle.title,
          newArticle.category,
          `data/blog/articles/${newArticle.id}.json`,
          newArticle.createdAt,
          'fireball,meteor,bolaapi,nasa',
          newArticle.image,
          newArticle.excerpt,
          newArticle.date,
          newArticle.views,
          newArticle.status,
          newArticle.review_status,
          newArticle.ai_provider
        ]
      );
      console.log(`[Cron Fireball] Metadata successfully stored in Cloudflare D1 for: ${docId}`);
    } catch (d1Err) {
      console.error('[Cron Fireball] Gagal menyimpan metadata ke Cloudflare D1:', d1Err);
    }


    // 7. Update posts.json index in R2
    const existingPostsFinal = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
    const updatedPosts = [newArticle, ...existingPostsFinal.filter((p: any) => p.id !== docId)];
    updatedPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    await uploadToR2('data/blog/posts.json', JSON.stringify(updatedPosts, null, 2), 'application/json');

    // Rebuild RSS
    await rebuildRSSFeedHelper();

    // 8. Kirim notifikasi Telegram
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

    const articleUrl = getAbsoluteUrl(`/fireball/${docId}`);
    const channelMsg = `🔥 <b>Laporan Bola Api (Fireball) Terbaru!</b>\n\n` +
      `📌 <b>${newArticle.title}</b>\n` +
      `<i>${newArticle.excerpt}</i>\n\n` +
      `📊 <b>Data Teknis JPL:</b>\n` +
      `   • Tanggal: ${selectedEvent.date} UTC\n` +
      `   • Lokasi: ${latStr}, ${lonStr}\n` +
      `   • Energi: ${energyGJ} GJ (≈ ${energyKt} kt TNT)\n` +
      `   • Kecepatan: ${selectedEvent.vel ? selectedEvent.vel + ' km/s' : 'N/A'}\n` +
      (weatherContext ? `   • Cuaca Lokasi: ${weatherContext}\n` : '') + '\n' +
      `🔗 Baca analisis sains selengkapnya:\n${articleUrl}`;
    
    await sendBroadcastNotification({
      title: `🔥 Bola Api (Fireball) Baru: ${newArticle.title}`,
      body: `Laporan Bola Api Terbaru:\n${newArticle.title}\n${newArticle.excerpt}`,
      telegramHtml: channelMsg,
      link: `/fireball/${docId}`,
      imageUrl: newArticle.image
    });

    const totalArticles = updatedPosts.length;
    const successMsg = `📢 <b>LAPORAN CRON FIREBALL OTOMATIS</b>\n\n` +
      `🟢 <b>Status:</b> Sukses Rilis\n` +
      `📝 <b>Artikel Baru:</b> "${newArticle.title}"\n` +
      `🔥 <b>Event:</b> ${selectedEvent.date} UTC\n` +
      `⚡ <b>Energi:</b> ${energyGJ} GJ\n` +
      `🤖 <b>Provider AI:</b> ${articleJson.provider}\n` +
      `🗂 <b>Total Artikel:</b> ${totalArticles}\n\n` +
      `🛠 <i>Rilis otomatis berhasil, cache R2 diperbarui.</i>`;
    await sendTelegramMessage(TELEGRAM_CHAT_ID, successMsg);

    return NextResponse.json({
      success: true,
      created: true,
      message: `Artikel Fireball ${selectedEvent.date} berhasil dirilis.`,
      article: {
        id: docId,
        title: newArticle.title,
        status: newArticle.status,
        review_status: newArticle.review_status
      }
    });

  } catch (error) {
    console.error('[Cron Fireball] Error:', error);

    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const failMsg = `⚠️ <b>LAPORAN CRON FIREBALL GAGAL</b>\n\n` +
      `❌ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}\n` +
      `🛠 <b>Status:</b> Failed`;
    try { await sendTelegramMessage(TELEGRAM_CHAT_ID, failMsg); } catch {}

    return NextResponse.json(
      { error: 'Failed to process fireball article generation', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
