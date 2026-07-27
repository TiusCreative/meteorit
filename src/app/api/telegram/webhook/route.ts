import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { getAbsoluteUrl, getSiteUrl } from '@/lib/siteUrl';
import { buildArticleTranslations } from '@/lib/articleLocalization';
import { generateImageWithFallback } from '@/lib/imageGenerator';

export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8837048940:AAG5mGq0anX_EDJZgprmOJhwJIQWH02j2V4';
const DEFAULT_CRON_SECRET = 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';

type AIProvider = {
  name: string;
  url: string;
  key: string | undefined;
  model: string;
};

// Rebuild index JSON of blog posts in Cloudflare R2 from D1
async function rebuildR2BlogCache() {
  try {
    const { queryD1 } = await import('@/lib/d1Client');
    const res = await queryD1(`SELECT * FROM articles WHERE status = 'Published' ORDER BY createdAt DESC`);
    const articlesList = res.results || [];
    await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
    console.log(`[Webhook Telegram] R2 posts.json cache rebuilt with ${articlesList.length} articles.`);
  } catch (err) {
    console.error('[Webhook Telegram] Failed to rebuild R2 cache from D1:', err);
  }
}


// Helper to query LLM with fallbacks
async function askAIWithFallback(prompt: string, isJson: boolean = true): Promise<string> {
  const messages = [
    { role: 'system', content: 'Anda adalah pakar astronomi dan penulis sains profesional dari Indonesia. Berikan output yang akurat dan bersih.' },
    { role: 'user', content: prompt }
  ];

  const providers: AIProvider[] = [
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
      const res = await fetch(provider.url, {
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
          ...(isJson ? { response_format: { type: 'json_object' } } : {})
        })
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
      }

      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error('Respons AI kosong.');

      return rawContent;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[Webhook Telegram AI] ${provider.name} gagal:`, msg);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`Semua provider AI gagal. ${errors.join(' | ')}`);
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET method: Webhook setup/registration
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const action = searchParams.get('action');

  const correctSecret = process.env.CRON_SECRET || DEFAULT_CRON_SECRET;

  if (secret !== correctSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (action === 'setup') {
    try {
      const host = request.headers.get('host') || 'meteorit.my.id';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const webhookUrl = `${protocol}://${host}/api/telegram/webhook?secret=${correctSecret}`;

      console.log(`[Webhook Telegram] Mendaftarkan URL webhook: ${webhookUrl}`);

      const telegramRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: correctSecret,
          allowed_updates: ['message', 'channel_post']
        })
      });

      const telegramData = await telegramRes.json();

      if (!telegramRes.ok || !telegramData.ok) {
        throw new Error(telegramData.description || 'Gagal mendaftarkan webhook ke Telegram.');
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook Telegram berhasil didaftarkan.',
        webhookUrl,
        telegramResponse: telegramData
      });
    } catch (err) {
      console.error('[Webhook Telegram] Gagal setup webhook:', err);
      return NextResponse.json({
        success: false,
        error: 'Gagal melakukan konfigurasi webhook.',
        details: err instanceof Error ? err.message : String(err)
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    message: 'Endpoint Webhook Telegram aktif. Gunakan action=setup untuk mendaftarkan URL webhook.'
  });
}

// POST method: Webhook update receiver
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secretQuery = searchParams.get('secret');
  const secretHeader = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

  const correctSecret = process.env.CRON_SECRET || DEFAULT_CRON_SECRET;

  // Verify secret from query parameter OR header token
  if (secretQuery !== correctSecret && secretHeader !== correctSecret) {
    console.warn('[Webhook Telegram] Percobaan akses webhook ilegal/unauthorized.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await request.json();
    const message = update.message || update.channel_post;
    
    if (!message || !message.text) {
      // Return 200 OK agar Telegram tidak mengirim ulang update
      return NextResponse.json({ success: true, message: 'Bukan pesan teks atau payload kosong.' });
    }

    const text = message.text;

    // 1. Parse text using LLM to extract asteroid parameters
    const parsePrompt = `Analisis teks pesan berikut untuk mendeteksi apakah ini adalah laporan mengenai asteroid / objek dekat Bumi yang melintas dekat Bumi.
Pesan Teks:
"${text}"

Kembalikan HANYA objek JSON murni dengan format struktur berikut:
{
  "is_asteroid_report": true / false,
  "asteroid": {
    "name": "string (Nama asteroid, misal: '2024 MK')",
    "close_approach_date": "YYYY-MM-DD (Tanggal melintas dekat Bumi)",
    "estimated_diameter_min": number (diameter minimum dalam meter),
    "estimated_diameter_max": number (diameter maksimum dalam meter),
    "velocity_kmh": number (kecepatan lintasan dalam km/jam, angka bulat tanpa titik/koma/spasi/satuan),
    "is_potentially_hazardous": true / false,
    "miss_distance_km": number (jarak lintasan terdekat dalam km, angka bulat tanpa titik/koma/spasi/satuan)
  }
}
Jika pesan tersebut bukan laporan mengenai asteroid melintas dekat bumi, maka "is_asteroid_report" diisi false dan "asteroid" diisi null.
Kembalikan HANYA JSON murni tanpa ada formatting markdown \`\`\`json atau penjelasan tambahan lainnya.`;

    const parseResultStr = await askAIWithFallback(parsePrompt, true);
    const parsedData = JSON.parse(parseResultStr.replace(/```json|```/g, '').trim());

    if (!parsedData.is_asteroid_report || !parsedData.asteroid || !parsedData.asteroid.name) {
      return NextResponse.json({
        success: true,
        message: 'Pesan berhasil dianalisis: Tidak terdeteksi adanya informasi asteroid baru.'
      });
    }

    const ast = parsedData.asteroid;
    const name = ast.name;
    const closeApproachDate = ast.close_approach_date;
    const minDiameter = Number(ast.estimated_diameter_min) || 0;
    const maxDiameter = Number(ast.estimated_diameter_max) || 0;
    const velocityKmh = Number(ast.velocity_kmh) || 0;
    const isHazardous = !!ast.is_potentially_hazardous;
    const missDistanceKm = Number(ast.miss_distance_km) || 0;

    const docId = `asteroid-${slugify(name)}`;
    const docRef = adminDb.collection('articles').doc(docId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      console.log(`[Webhook Telegram] Artikel asteroid ${name} sudah pernah diterbitkan.`);
      return NextResponse.json({
        success: true,
        message: `Artikel untuk asteroid ${name} sudah terbit sebelumnya.`
      });
    }

    console.log(`[Webhook Telegram] Asteroid baru terdeteksi: ${name}. Memulai proses pembuatan artikel...`);

    // 2. Generate science article using LLM
    const articlePrompt = `Tuliskan artikel edukasi sains populer bertema komet/asteroid dalam Bahasa Indonesia mengenai objek luar angkasa bernama "${name}" yang melintas dekat Bumi pada tanggal "${closeApproachDate}".
Data teknis objek:
- Nama Objek: ${name}
- Tanggal Melintas: ${closeApproachDate}
- Ukuran Estimasi: ${minDiameter.toFixed(0)}-${maxDiameter.toFixed(0)} meter
- Kecepatan: ${velocityKmh.toLocaleString('id-ID')} km/jam
- Status Bahaya: ${isHazardous ? 'Berpotensi Berbahaya bagi Bumi' : 'Aman (Tidak Berbahaya)'}
- Jarak Terdekat: ${missDistanceKm.toLocaleString('id-ID')} km

Ketentuan Artikel:
1. Buat judul yang sangat menarik dan ramah SEO (Contoh: "Mengenal Asteroid ${name} yang Melintas Dekat Bumi").
2. Jelaskan secara santai dan ramah kepada orang awam apakah jarak melintas tersebut aman atau tidak bagi Bumi. Jauhkan dari kepanikan, berikan penjelasan logis.
3. Berikan edukasi singkat tentang batuan luar angkasa ini atau asal-usul penamaannya.
4. Panjang artikel 300-400 kata, terbagi dalam beberapa paragraf pendek agar mudah dibaca di mobile.
5. Output harus berupa JSON murni dengan properti berikut:
   - "title": Judul artikel ramah SEO
   - "excerpt": Ringkasan pendek (1-2 kalimat)
   - "content": Isi artikel lengkap dalam format Markdown

Kembalikan HANYA string JSON murni tanpa pembungkus markdown json.`;

    const articleResultStr = await askAIWithFallback(articlePrompt, true);
    const articleJson = JSON.parse(articleResultStr.replace(/```json|```/g, '').trim());

    // 3. Generate image using Pollinations with Cloudflare AI backup
    const illustrationPrompt = `high-res professional photos space background giant asteroid flying close to Earth realistic digital art scientific render`;
    const imagePath = `data/komet/images/${docId}.jpg`;
    const imageUrl = await generateImageWithFallback(illustrationPrompt, imagePath);

    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // 4. Set placeholder translations (to be processed asynchronously by Python translation worker)
    const translations = {};

    const newArticle = {
      id: docId,
      title: articleJson.title,
      excerpt: articleJson.excerpt,
      content: articleJson.content,
      translations,
      category: 'Komet & Asteroid',
      date: dateFormatted,
      image: imageUrl,
      views: 0,
      status: 'Published',
      review_status: 'Otomatis',
      createdAt: new Date().toISOString(),
      asteroid_data: {
        name,
        close_approach_date: closeApproachDate,
        estimated_diameter: `${minDiameter.toFixed(0)}-${maxDiameter.toFixed(0)} meter`,
        velocity: `${velocityKmh.toLocaleString('id-ID')} km/jam`,
        is_potentially_hazardous: isHazardous
      }
    };

    // 5. Save to Firestore
    await docRef.set(newArticle);

    // Save individual JSON directly to R2
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
          'komet,asteroid,telegram,laporan',
          newArticle.image,
          newArticle.excerpt,
          newArticle.date,
          newArticle.views,
          newArticle.status,
          newArticle.review_status,
          'Groq'
        ]
      );
      console.log(`[Webhook Telegram] Metadata successfully stored in Cloudflare D1 for: ${docId}`);
    } catch (d1Err) {
      console.error('[Webhook Telegram] Gagal menyimpan metadata ke Cloudflare D1:', d1Err);
    }

    // 6. Rebuild R2 cache index
    await rebuildR2BlogCache();


    // 7. Send notification message back to Telegram
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

    const articleUrl = getAbsoluteUrl(`/blog/${docId}`);
    
    // Send to Telegram Channel
    const channelMsg = `☄️ <b>Info Asteroid Melintas Dekat Bumi Terbaru!</b>\n\n` +
      `📌 <b>${newArticle.title}</b>\n` +
      `<i>${newArticle.excerpt}</i>\n\n` +
      `📊 <b>Detail Batuan Luar Angkasa:</b>\n` +
      `   • Nama: ${name}\n` +
      `   • Tanggal Melintas: ${closeApproachDate}\n` +
      `   • Ukuran: ${newArticle.asteroid_data.estimated_diameter}\n` +
      `   • Kecepatan: ${newArticle.asteroid_data.velocity}\n` +
      `   • Status Bahaya: ${isHazardous ? '⚠️ Berpotensi Berbahaya' : '✅ Aman'}\n\n` +
      `🔗 Baca ulasan sains ilmiah selengkapnya di:\n${articleUrl}`;
    
    await sendTelegramMessage(TELEGRAM_CHANNEL_ID, channelMsg);

    // Send success notification to Admin Chat
    const totalArticles = await adminDb.collection('articles').get().then((snap: any) => snap.size);
    const adminMsg = `📢 <b>LAPORAN TANGKAP ASTEROID TELEGRAM</b>\n\n` +
      `🟢 <b>Status:</b> Sukses Rilis\n` +
      `📝 <b>Artikel Baru:</b> "${newArticle.title}"\n` +
      `🛸 <b>Asteroid:</b> ${name}\n` +
      `📊 <b>Review Status:</b> Otomatis (Belum Direview)\n` +
      `🗂 <b>Total Artikel:</b> ${totalArticles}\n\n` +
      `🛠 <i>Penangkapan pesan Telegram sukses, artikel dipublikasikan di kategori Komet & Asteroid.</i>`;
    
    await sendTelegramMessage(TELEGRAM_CHAT_ID, adminMsg);

    return NextResponse.json({
      success: true,
      message: `Artikel komet ${name} berhasil dirilis secara otomatis dari Telegram update.`,
      articleId: docId
    });

  } catch (error) {
    console.error('[Webhook Telegram] Error:', error);

    // Alert admin if anything fails
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const failMsg = `⚠️ <b>LAPORAN TANGKAP ASTEROID TELEGRAM GAGAL</b>\n\n` +
      `❌ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}\n` +
      `🛠 <b>Status:</b> Failed`;
    try {
      await sendTelegramMessage(TELEGRAM_CHAT_ID, failMsg);
    } catch {}

    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan saat memproses laporan asteroid dari Telegram.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
