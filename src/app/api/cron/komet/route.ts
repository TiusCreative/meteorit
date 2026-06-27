import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { getAbsoluteUrl, getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const NASA_API_KEY = process.env.NASA_API_KEY || 'hlogNogFWGEANcJcPnYwlxYJh3auqScaH75m8ktN';

type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  provider: string;
};

async function rebuildR2BlogCache() {
  const allArticlesSnapshot = await adminDb.collection('articles').get();
  const articlesList: any[] = [];
  allArticlesSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.status === 'Published') {
      articlesList.push({ id: doc.id, ...data });
    }
  });

  // Sort in-memory by createdAt descending
  articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Save JSON array index list to Cloudflare R2
  await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
}

async function generateArticleWithFallback(prompt: string): Promise<GeneratedArticle> {
  const messages = [
    { role: 'system', content: 'Anda adalah penulis sains profesional ahli astronomi berbahasa Indonesia. Anda wajib memberikan output dalam format JSON murni.' },
    { role: 'user', content: prompt }
  ];

  const providers = [
    {
      name: 'Groq Utama',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant'
    },
    {
      name: 'Groq Backup',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_BACKUP_API_KEY,
      model: 'llama-3.1-8b-instant'
    },
    {
      name: 'OpenRouter Utama',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.1-8b-instruct:free'
    },
    {
      name: 'OpenRouter Backup',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_BACKUP_API_KEY,
      model: 'meta-llama/llama-3.1-8b-instruct:free'
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

      const articleJson = JSON.parse(rawContent);
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
      console.warn(`[Cron Komet] ${provider.name} gagal, mencoba provider berikutnya:`, msg);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`Semua provider AI gagal. ${errors.join(' | ') || 'Tidak ada API key AI yang tersedia.'}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');

  // Verify secret
  if (
    secret !== (process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=') &&
    authHeader !== `Bearer ${process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU='}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch data NeoWs (Near Earth Objects) NASA
    const today = new Date();
    const weekLater = new Date();
    weekLater.setDate(today.getDate() + 7);
    
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const todayStr = fmt(today);
    const weekLaterStr = fmt(weekLater);

    const neoRes = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${todayStr}&end_date=${weekLaterStr}&api_key=${NASA_API_KEY}`
    );

    if (!neoRes.ok) {
      throw new Error(`NASA NeoWs API returned status ${neoRes.status}`);
    }

    const neoData = await neoRes.json();
    const objectsByDate = neoData.near_earth_objects || {};
    
    // Flatten all objects
    const allObjects: any[] = [];
    Object.keys(objectsByDate).forEach((date) => {
      if (Array.isArray(objectsByDate[date])) {
        allObjects.push(...objectsByDate[date]);
      }
    });

    if (allObjects.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada objek melintas dekat Bumi minggu ini.' });
    }

    // Sort objects: Prioritize hazardous, then by max estimated diameter descending
    const sortedObjects = allObjects.sort((a, b) => {
      const aHazard = a.is_potentially_hazardous_asteroid ? 1 : 0;
      const bHazard = b.is_potentially_hazardous_asteroid ? 1 : 0;
      if (aHazard !== bHazard) return bHazard - aHazard;
      
      const aSize = a.estimated_diameter?.meters?.estimated_diameter_max || 0;
      const bSize = b.estimated_diameter?.meters?.estimated_diameter_max || 0;
      return bSize - aSize;
    });

    let selectedObj: any | null = null;
    let docId = '';

    for (const obj of sortedObjects) {
      const candidateId = `asteroid-${obj.id}`;
      const candidateSnap = await adminDb.collection('articles').doc(candidateId).get();
      if (!candidateSnap.exists) {
        selectedObj = obj;
        docId = candidateId;
        break;
      }
    }

    if (!selectedObj) {
      return NextResponse.json({
        success: true,
        created: false,
        message: 'Semua objek NeoWs prioritas minggu ini sudah memiliki artikel komet.'
      });
    }

    const asteroidId = selectedObj.id;
    const docRef = adminDb.collection('articles').doc(docId);

    // Extract details
    const name = selectedObj.name || 'Unknown Asteroid';
    const closeApproachData = selectedObj.close_approach_data?.[0] || {};
    const closeApproachDate = closeApproachData.close_approach_date || todayStr;
    
    const minDiameter = selectedObj.estimated_diameter?.meters?.estimated_diameter_min || 0;
    const maxDiameter = selectedObj.estimated_diameter?.meters?.estimated_diameter_max || 0;
    const velocityKms = parseFloat(closeApproachData.relative_velocity?.kilometers_per_second || '0');
    const velocityRibu = (velocityKms * 3600).toFixed(1); // converted to km/h in thousands
    
    const isHazardous = selectedObj.is_potentially_hazardous_asteroid || false;
    const missDistanceKm = parseFloat(closeApproachData.miss_distance?.kilometers || '0').toLocaleString('id-ID');

    // 2. Generate AI Article with provider fallback
    const prompt = `Tuliskan artikel edukasi sains populer bertema komet/asteroid dalam Bahasa Indonesia mengenai objek luar angkasa bernama "${name}" yang akan melintas dekat Bumi minggu ini pada tanggal "${closeApproachDate}".
Data teknis objek:
- Nama Objek: ${name}
- Tanggal Melintas: ${closeApproachDate}
- Ukuran Estimasi: ${minDiameter.toFixed(0)}-${maxDiameter.toFixed(0)} meter
- Kecepatan: ${velocityRibu} ribu km/jam
- Status Bahaya: ${isHazardous ? 'Berpotensi Berbahaya bagi Bumi' : 'Aman (Tidak Berbahaya)'}
- Jarak Terdekat: ${missDistanceKm} km

Ketentuan Artikel:
1. Buat judul yang sangat menarik dan ramah SEO (Contoh: "Mengenal Asteroid ${name} yang Melintas Dekat Bumi Minggu Ini").
2. Jelaskan secara santai dan ramah kepada orang awam apakah jarak melintas tersebut aman atau tidak bagi Bumi. Jauhkan dari kepanikan, berikan penjelasan logis.
3. Berikan edukasi singkat tentang batuan luar angkasa ini atau asal-usul penamaannya.
4. Panjang artikel 300-400 kata, terbagi dalam beberapa paragraf pendek agar mudah dibaca di mobile.
5. Output harus berupa JSON murni dengan properti berikut:
   - "title": Judul artikel ramah SEO
   - "excerpt": Ringkasan pendek (1-2 kalimat)
   - "content": Isi artikel lengkap dalam format Markdown

Kembalikan HANYA string JSON murni tanpa pembungkus markdown json.`;

    const articleJson = await generateArticleWithFallback(prompt);

    // Image Illustration via Pollinations AI
    const illustrationPrompt = encodeURIComponent(`high-res professional photos space background giant asteroid flying close to Earth realistic digital art scientific render`);
    const imageUrl = `https://image.pollinations.ai/prompt/${illustrationPrompt}?width=800&height=500&nologo=true&seed=${asteroidId}`;

    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const newArticle = {
      id: docId,
      title: articleJson.title,
      excerpt: articleJson.excerpt,
      content: articleJson.content,
      category: 'Komet & Asteroid',
      date: dateFormatted,
      image: imageUrl,
      views: 0,
      status: 'Published',
      review_status: 'Otomatis', // status review otomatis sebelum dimoderasi
      ai_provider: articleJson.provider,
      createdAt: new Date().toISOString(),
      asteroid_data: {
        name,
        close_approach_date: closeApproachDate,
        estimated_diameter: `${minDiameter.toFixed(0)}-${maxDiameter.toFixed(0)} meter`,
        velocity: `${parseFloat(velocityRibu).toLocaleString('id-ID')} km/jam`,
        is_potentially_hazardous: isHazardous
      }
    };

    // 3. Save to Firestore
    await docRef.set(newArticle);

    // 4. Rebuild Blog index cache in R2
    await rebuildR2BlogCache();

    // 5. Send Telegram Notifications
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

    // Telegram Channel Post
    const articleUrl = getAbsoluteUrl(`/blog/${docId}`);
    const channelMsg = `☄️ <b>Kabar Batuan Luar Angkasa Terbaru!</b>\n\n` +
      `📌 <b>${newArticle.title}</b>\n` +
      `<i>${newArticle.excerpt}</i>\n\n` +
      `📊 <b>Data Teknis Asteroid:</b>\n` +
      `   • Nama: ${name}\n` +
      `   • Tanggal Melintas: ${closeApproachDate}\n` +
      `   • Ukuran: ${newArticle.asteroid_data.estimated_diameter}\n` +
      `   • Kecepatan: ${newArticle.asteroid_data.velocity}\n` +
      `   • Status Bahaya: ${isHazardous ? '⚠️ Berpotensi Berbahaya' : '✅ Aman'}\n\n` +
      `🔗 Baca ulasan ilmiah sains selengkapnya di sini:\n${articleUrl}`;
    await sendTelegramMessage(TELEGRAM_CHANNEL_ID, channelMsg);

    // Telegram Success Report to Admin
    const totalArticles = await adminDb.collection('articles').get().then((snap: any) => snap.size);
    const successMsg = `📢 <b>LAPORAN CRON KOMET OTOMATIS</b>\n\n` +
      `🟢 <b>Status:</b> Sukses Rilis\n` +
      `📝 <b>Artikel Baru:</b> "${newArticle.title}"\n` +
      `🛸 <b>Asteroid:</b> ${name}\n` +
      `🤖 <b>Provider AI:</b> ${articleJson.provider}\n` +
      `📊 <b>Review Status:</b> Otomatis (Belum Direview)\n` +
      `🗂 <b>Total Artikel:</b> ${totalArticles}\n\n` +
      `🛠 <i>Rilis otomatis berhasil, notifikasi Telegram dan R2 cache telah diperbarui.</i>`;
    await sendTelegramMessage(TELEGRAM_CHAT_ID, successMsg);

    return NextResponse.json({
      success: true,
      created: true,
      message: `Artikel komet ${name} berhasil dirilis secara otomatis.`,
      article: {
        id: docId,
        title: newArticle.title,
        status: newArticle.status,
        review_status: newArticle.review_status
      }
    });

  } catch (error) {
    console.error('[Cron Komet] Error:', error);
    
    // Telegram Fail Report to Admin
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const failMsg = `⚠️ <b>LAPORAN CRON KOMET GAGAL</b>\n\n` +
      `❌ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}\n` +
      `🛠 <b>Status:</b> Failed`;
    try {
      await sendTelegramMessage(TELEGRAM_CHAT_ID, failMsg);
    } catch {}

    return NextResponse.json(
      { error: 'Failed to process comet article generation', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
