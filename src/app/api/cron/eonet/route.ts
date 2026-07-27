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

// Kategori EONET yang relevan dengan tema astronomi & sains alam
const RELEVANT_CATEGORIES = ['Wildfires', 'Volcanoes', 'Dust and Haze', 'Severe Storms', 'Sea and Lake Ice', 'Snow'];

type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  provider: string;
};



import { fetchAndCacheWeather } from '@/lib/openweather';

async function getWeatherContext(lat: number, lon: number): Promise<string> {
  try {
    const w = await fetchAndCacheWeather(lat, lon);
    if (!w) return '';
    return `Kondisi cuaca di lokasi kejadian: ${w.description}, suhu ${w.temp}°C, tutupan awan ${w.clouds}%, angin ${w.wind_speed} m/s.`;
  } catch {
    return '';
  }
}

async function generateArticleWithFallback(prompt: string): Promise<GeneratedArticle> {
  const messages = [
    { role: 'system', content: 'Anda adalah penulis sains populer bertema fenomena alam dan astronomi berbahasa Indonesia yang profesional. Anda wajib memberikan output dalam format JSON murni.' },
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
          temperature: 0.72,
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
      console.warn(`[Cron EONET] ${provider.name} gagal, mencoba provider berikutnya:`, msg);
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
      const fetchGuard = await shouldSkipExternalFetch('nasa-eonet', 22 * 60 * 60 * 1000);
      if (fetchGuard.skip) {
        return NextResponse.json({
          success: true,
          created: false,
          message: 'Fetch NASA EONET dilewati karena cooldown anti-loop masih aktif.',
          nextAllowedAt: fetchGuard.nextAllowedAt
        });
      }
    }

    // 1. Fetch NASA EONET v3 (no API key needed)
    const eonetRes = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?limit=20&status=open',
      { next: { revalidate: 0 } }
    );

    if (!eonetRes.ok) {
      throw new Error(`NASA EONET API returned status ${eonetRes.status}`);
    }

    const eonetData = await eonetRes.json();
    const events: any[] = eonetData.events || [];

    if (events.length === 0) {
      return NextResponse.json({ success: true, created: false, message: 'Tidak ada peristiwa aktif dari NASA EONET.' });
    }

    // 2. Filter kategori relevan
    const relevantEvents = events.filter((e: any) => {
      const cats: string[] = (e.categories || []).map((c: any) => c.title);
      return cats.some(cat => RELEVANT_CATEGORIES.includes(cat));
    });

    const candidateEvents = relevantEvents.length > 0 ? relevantEvents : events;

    // 3. Cari event yang belum ada artikelnya
    let selectedEvent: any | null = null;
    let docId = '';

    for (const event of candidateEvents) {
      const candidateId = `eonet-${event.id}`;
      // Check R2 posts.json instead of Firestore
      const existingPosts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
      const alreadyExists = existingPosts.some((p: any) => p.id === candidateId);
      if (!alreadyExists) {
        selectedEvent = event;
        docId = candidateId;
        break;
      }
    }

    if (!selectedEvent) {
      return NextResponse.json({
        success: true,
        created: false,
        message: 'Semua peristiwa EONET aktif sudah memiliki artikel.'
      });
    }

    // 4. Ambil detail event
    const eventTitle = selectedEvent.title || 'Peristiwa Alam Aktif';
    const eventCategories: string[] = (selectedEvent.categories || []).map((c: any) => c.title);
    const categoryStr = eventCategories.join(', ') || 'Peristiwa Alam';
    const sources: string[] = (selectedEvent.sources || []).map((s: any) => s.url);

    // Ambil koordinat pertama
    const geometries: any[] = selectedEvent.geometry || [];
    let lat: number | null = null;
    let lon: number | null = null;
    if (geometries.length > 0) {
      const coords = geometries[0].coordinates;
      if (Array.isArray(coords) && coords.length >= 2) {
        lon = coords[0];
        lat = coords[1];
      }
    }

    const locationStr = lat !== null && lon !== null
      ? `koordinat ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
      : 'lokasi tidak spesifik';

    // 5. Konteks cuaca OpenWeather (jika ada koordinat)
    const weatherContext = lat !== null && lon !== null
      ? await getWeatherContext(lat, lon)
      : '';

    // Ambil tanggal kejadian
    const eventDate = geometries.length > 0 ? geometries[0].date : new Date().toISOString();

    // 6. Generate artikel AI
    const prompt = `Tulis artikel edukasi sains populer berbahasa Indonesia tentang peristiwa alam yang sedang aktif berdasarkan data NASA EONET (Earth Observatory Natural Event Tracker).

Data Peristiwa:
- Nama Kejadian: ${eventTitle}
- Tipe/Kategori: ${categoryStr}
- Lokasi: ${locationStr}
- Tanggal Terdeteksi: ${eventDate}
- Status: Masih Aktif (Open)
${sources.length > 0 ? `- Sumber Data: ${sources.slice(0, 2).join(', ')}` : ''}
${weatherContext ? `\nKonteks Cuaca di Lokasi:\n${weatherContext}` : ''}

Ketentuan Artikel:
1. Judul menarik dan ramah SEO yang menyebut nama atau tipe kejadian (maksimal 10 kata).
2. Jelaskan apa yang terjadi dari sisi ilmiah secara santai — bagaimana NASA mendeteksi dengan satelit, apa dampaknya terhadap lingkungan dan atmosfer.
3. Jelaskan relevansinya terhadap pemantauan bumi dari luar angkasa dan kaitannya dengan penelitian astronomi.
4. Berikan konteks global — seberapa sering kejadian tipe ini terjadi di Bumi.
5. Panjang artikel 400-500 kata, format Markdown dengan beberapa subjudul.
6. Output JSON murni:
   - "title": judul SEO menarik
   - "excerpt": ringkasan 1-2 kalimat
   - "content": artikel Markdown lengkap

Kembalikan HANYA JSON murni tanpa pembungkus markdown.`;

    const articleJson = await generateArticleWithFallback(prompt);

    // 7. Generate ilustrasi berdasarkan kategori
    let illustrationPrompt = `dramatic natural disaster event from space satellite view, NASA Earth Observatory, realistic digital art`;
    if (categoryStr.toLowerCase().includes('volcano')) {
      illustrationPrompt = `volcanic eruption from space, ash cloud plume, satellite view, NASA Earth Observatory, dramatic realistic digital art`;
    } else if (categoryStr.toLowerCase().includes('wildfire')) {
      illustrationPrompt = `wildfire burning forest from satellite view, smoke plume, NASA Earth Observatory, dramatic realistic digital art`;
    } else if (categoryStr.toLowerCase().includes('storm')) {
      illustrationPrompt = `tropical storm cyclone hurricane from space satellite view, swirling clouds, NASA Earth Observatory, dramatic realistic digital art`;
    } else if (categoryStr.toLowerCase().includes('dust')) {
      illustrationPrompt = `massive dust storm sandstorm from satellite view, brown haze over desert, NASA Earth Observatory, realistic digital art`;
    }

    const imagePath = `data/eonet/images/${docId}.jpg`;
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
    console.log(`[Cron EONET] Memulai auto-translate untuk: ${articleJson.title}`);
    let translations = {};
    try {
      translations = await buildArticleTranslations({
        title: articleJson.title,
        excerpt: articleJson.excerpt,
        content: articleContent,
      });
      console.log(`[Cron EONET] \u2705 Auto-translate selesai: ${Object.keys(translations).join(', ')}`);
    } catch (translateErr) {
      console.warn('[Cron EONET] \u26a0\ufe0f Auto-translate gagal, artikel tetap disimpan tanpa terjemahan:', translateErr);
    }

    const newArticle = {
      id: docId,
      title: articleJson.title,
      excerpt: articleJson.excerpt,
      content: articleContent,
      translations,
      category: 'Peristiwa Alam',
      date: dateFormatted,
      image: imageUrl,
      views: 0,
      status: 'Published',
      review_status: 'Otomatis',
      ai_provider: articleJson.provider,
      createdAt: new Date().toISOString(),
      eonet_data: {
        event_id: selectedEvent.id,
        event_title: eventTitle,
        categories: eventCategories,
        lat,
        lon,
        event_date: eventDate,
        status: 'open',
        source: 'NASA EONET v3'
      }
    };

    // 8. Save article directly to R2 (no Firestore)
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
          'eonet,peristiwa,alam,nasa',
          newArticle.image,
          newArticle.excerpt,
          newArticle.date,
          newArticle.views,
          newArticle.status,
          newArticle.review_status,
          newArticle.ai_provider
        ]
      );
      console.log(`[Cron EONET] Metadata successfully stored in Cloudflare D1 for: ${docId}`);
    } catch (d1Err) {
      console.error('[Cron EONET] Gagal menyimpan metadata ke Cloudflare D1:', d1Err);
    }


    // 9. Update posts.json index in R2
    const existingPostsFinal = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
    const updatedPosts = [newArticle, ...existingPostsFinal.filter((p: any) => p.id !== docId)];
    updatedPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    await uploadToR2('data/blog/posts.json', JSON.stringify(updatedPosts, null, 2), 'application/json');

    // Rebuild RSS
    await rebuildRSSFeedHelper();

    // 10. Kirim notifikasi Telegram
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

    const articleUrl = getAbsoluteUrl(`/eonet/${docId}`);
    const categoryEmoji = categoryStr.toLowerCase().includes('volcano') ? '🌋' :
      categoryStr.toLowerCase().includes('wildfire') ? '🔥' :
      categoryStr.toLowerCase().includes('storm') ? '🌪️' :
      categoryStr.toLowerCase().includes('dust') ? '🌫️' : '🌍';

    const channelMsg = `${categoryEmoji} <b>Peristiwa Alam Aktif Terdeteksi NASA!</b>\n\n` +
      `📌 <b>${newArticle.title}</b>\n` +
      `<i>${newArticle.excerpt}</i>\n\n` +
      `📊 <b>Data NASA EONET:</b>\n` +
      `   • Kejadian: ${eventTitle}\n` +
      `   • Kategori: ${categoryStr}\n` +
      `   • Lokasi: ${locationStr}\n` +
      `   • Status: Masih Aktif\n` +
      (weatherContext ? `   • Cuaca Lokasi: ${weatherContext}\n` : '') + '\n' +
      `🔗 Baca analisis sains selengkapnya:\n${articleUrl}`;
    
    await sendBroadcastNotification({
      title: `${categoryEmoji} Peristiwa Alam: ${newArticle.title}`,
      body: `Peristiwa Alam Aktif Terdeteksi NASA:\n${newArticle.title}\n${newArticle.excerpt}`,
      telegramHtml: channelMsg,
      link: `/eonet/${docId}`,
      imageUrl: newArticle.image
    });

    const totalArticles = updatedPosts.length;
    const successMsg = `📢 <b>LAPORAN CRON EONET OTOMATIS</b>\n\n` +
      `🟢 <b>Status:</b> Sukses Rilis\n` +
      `📝 <b>Artikel Baru:</b> "${newArticle.title}"\n` +
      `🌍 <b>Event EONET:</b> ${eventTitle}\n` +
      `📂 <b>Kategori:</b> ${categoryStr}\n` +
      `🤖 <b>Provider AI:</b> ${articleJson.provider}\n` +
      `🗂 <b>Total Artikel:</b> ${totalArticles}\n\n` +
      `🛠 <i>Rilis otomatis berhasil, cache R2 diperbarui.</i>`;
    await sendTelegramMessage(TELEGRAM_CHAT_ID, successMsg);

    return NextResponse.json({
      success: true,
      created: true,
      message: `Artikel EONET "${eventTitle}" berhasil dirilis.`,
      article: {
        id: docId,
        title: newArticle.title,
        status: newArticle.status,
        review_status: newArticle.review_status
      }
    });

  } catch (error) {
    console.error('[Cron EONET] Error:', error);

    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const failMsg = `⚠️ <b>LAPORAN CRON EONET GAGAL</b>\n\n` +
      `❌ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}\n` +
      `🛠 <b>Status:</b> Failed`;
    try { await sendTelegramMessage(TELEGRAM_CHAT_ID, failMsg); } catch {}

    return NextResponse.json(
      { error: 'Failed to process EONET article generation', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
