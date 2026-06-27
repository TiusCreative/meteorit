import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { getAbsoluteUrl, getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

type MarsImage = {
  id: number | string;
  img_src: string;
  earth_date: string;
  sol: number;
  camera_name: string;
  rover_name: string;
};

type GeneratedMarsArticle = {
  title: string;
  excerpt: string;
  contentHtml: string;
  provider: string;
};

const MARS_TOPICS = [
  'Fakta Unik Mars: warna merah, ukuran planet, Olympus Mons, dan Valles Marineris',
  'Kabar Penjelajahan Mars: Curiosity, Perseverance, Ingenuity, dan cara rover bekerja',
  'Cuaca dan Geologi Mars: badai debu, suhu ekstrem, batuan vulkanik, dan air es di kutub',
  'Masa Depan Manusia di Mars: tantangan astronot, habitat, radiasi, air, makanan, dan energi'
];

const FALLBACK_IMAGES: MarsImage[] = [
  {
    id: 'PIA19821',
    img_src: 'https://images-assets.nasa.gov/image/PIA19821/PIA19821~orig.jpg',
    earth_date: '2015-05-30',
    sol: 1000,
    camera_name: 'Mast Camera (MAST)',
    rover_name: 'Curiosity'
  },
  {
    id: 'PIA19819',
    img_src: 'https://images-assets.nasa.gov/image/PIA19819/PIA19819~orig.jpg',
    earth_date: '2015-05-30',
    sol: 1000,
    camera_name: 'Mast Camera (MAST)',
    rover_name: 'Curiosity'
  },
  {
    id: 'PIA16226',
    img_src: 'https://images-assets.nasa.gov/image/PIA16226/PIA16226~orig.jpg',
    earth_date: '2015-05-30',
    sol: 1000,
    camera_name: 'Front Hazard Avoidance Camera (FHAZ)',
    rover_name: 'Curiosity'
  }
];

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

async function rebuildR2BlogCache() {
  const allArticlesSnapshot = await adminDb.collection('articles').get();
  const articlesList: any[] = [];
  allArticlesSnapshot.forEach((doc: any) => {
    const data = doc.data();
    if (data.status === 'Published') {
      articlesList.push({ id: doc.id, ...data });
    }
  });

  articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
}

async function fetchMarsImage(): Promise<MarsImage> {
  try {
    const res = await fetch(
      `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_API_KEY}`,
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error(`NASA Mars Rover API status ${res.status}`);

    const data = await res.json();
    const photos = data.latest_photos || [];
    if (!Array.isArray(photos) || photos.length === 0) throw new Error('NASA Mars Rover API tidak mengirim foto.');

    const preferred = photos.find((photo: any) => ['MAST', 'NAVCAM', 'MAHLI'].includes(photo.camera?.name)) || photos[0];
    return {
      id: preferred.id,
      img_src: String(preferred.img_src || '').replace('http://', 'https://'),
      earth_date: preferred.earth_date,
      sol: preferred.sol,
      camera_name: preferred.camera?.full_name || preferred.camera?.name || 'Mars Rover Camera',
      rover_name: preferred.rover?.name || 'Curiosity'
    };
  } catch (error) {
    console.warn('[Cron Mars] Menggunakan fallback image NASA:', error);
    const index = dayOfYear(new Date()) % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[index];
  }
}

async function generateMarsArticle(prompt: string): Promise<GeneratedMarsArticle> {
  const messages = [
    {
      role: 'system',
      content: 'Anda adalah penulis edukasi sains antariksa untuk Meteorit Indonesia. Kembalikan JSON murni tanpa markdown.'
    },
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
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.key}`,
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

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 180)}`);
      }

      const json = await res.json();
      const raw = json.choices?.[0]?.message?.content;
      if (!raw) throw new Error('Respons AI kosong.');

      const parsed = JSON.parse(String(raw).replace(/```json|```/g, '').trim());
      if (!parsed.title || !parsed.excerpt || !parsed.contentHtml) {
        throw new Error('JSON artikel Mars tidak lengkap.');
      }

      return {
        title: parsed.title,
        excerpt: parsed.excerpt,
        contentHtml: parsed.contentHtml,
        provider: provider.name
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Cron Mars] ${provider.name} gagal:`, message);
      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(`Semua provider AI gagal untuk artikel Mars. ${errors.join(' | ')}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');

  if (secret !== CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const dayIndex = dayOfYear(now);
    const topic = MARS_TOPICS[Math.floor(Math.random() * MARS_TOPICS.length)];
    const marsImage = await fetchMarsImage();
    const dateKey = now.toISOString().split('T')[0];
    const docId = `mars-${dateKey}`;
    const docRef = adminDb.collection('articles').doc(docId);
    const existing = await docRef.get();

    if (existing.exists) {
      return NextResponse.json({
        success: true,
        created: false,
        message: `Artikel Planet Mars untuk ${dateKey} sudah pernah dibuat.`,
        articleId: docId
      });
    }

    const prompt = `Tugas Anda adalah menulis artikel edukasi sains tentang Planet Mars sebanyak 300-500 kata dalam Bahasa Indonesia yang santai tapi berbobot untuk web Meteorit Indonesia.

Topik hari ini: ${topic}

Konteks gambar resmi NASA Mars Rover API:
- Rover: ${marsImage.rover_name}
- Kamera: ${marsImage.camera_name}
- Sol: ${marsImage.sol}
- Tanggal Bumi: ${marsImage.earth_date}
- URL gambar: ${marsImage.img_src}

Aturan:
1. Artikel harus berbeda nuansa dari hari sebelumnya, paragraf rapi, santai, dan berbobot.
2. Jangan membuat klaim sensasional atau menakut-nakuti pembaca.
3. Gunakan format HTML rapi, hanya tag <h2>, <p>, <strong>, <em>, dan <ul><li> bila perlu.
4. Sertakan satu subjudul pembuka, dua sampai empat paragraf utama, dan penutup yang mengajak pembaca memahami Mars secara ilmiah.
5. Output wajib JSON murni:
{
  "title": "judul SEO maksimal 70 karakter",
  "excerpt": "ringkasan 1-2 kalimat untuk meta description",
  "contentHtml": "isi artikel HTML 300-500 kata"
}`;

    const article = await generateMarsArticle(prompt);
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const newArticle = {
      id: docId,
      title: article.title,
      excerpt: article.excerpt,
      content: article.contentHtml,
      content_format: 'html',
      category: 'Planet Mars',
      date: dateFormatted,
      image: marsImage.img_src,
      views: 0,
      status: 'Published',
      review_status: 'Otomatis',
      ai_provider: article.provider,
      createdAt: now.toISOString(),
      mars_data: {
        topic,
        day_index: dayIndex,
        rover: marsImage.rover_name,
        camera: marsImage.camera_name,
        sol: marsImage.sol,
        earth_date: marsImage.earth_date,
        image_source: 'NASA Mars Rover Photos API'
      }
    };

    await docRef.set(newArticle);
    await rebuildR2BlogCache();

    const articleUrl = getAbsoluteUrl(`/mars/${docId}`);
    const channelId = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';
    const adminChatId = process.env.TELEGRAM_CHAT_ID || '5429818332';

    const channelMsg =
      `🔴 <b>Artikel Planet Mars Terbaru</b>\n\n` +
      `📌 <b>${newArticle.title}</b>\n` +
      `<i>${newArticle.excerpt}</i>\n\n` +
      `🛰 <b>Gambar:</b> ${marsImage.rover_name} - ${marsImage.camera_name}\n` +
      `🔗 Baca selengkapnya:\n${articleUrl}`;
    await sendTelegramMessage(channelId, channelMsg);

    const totalMars = await adminDb.collection('articles').where('category', '==', 'Planet Mars').get().then((snap: any) => snap.size);
    const reportMsg =
      `📢 <b>LAPORAN CRON PLANET MARS</b>\n\n` +
      `🟢 <b>Status:</b> Sukses Terbit\n` +
      `📝 <b>Artikel:</b> "${newArticle.title}"\n` +
      `🔴 <b>Topik:</b> ${topic}\n` +
      `🤖 <b>Provider AI:</b> ${article.provider}\n` +
      `🖼 <b>NASA Image:</b> ${marsImage.rover_name}, Sol ${marsImage.sol}\n` +
      `🗂 <b>Total Artikel Mars:</b> ${totalMars}`;
    await sendTelegramMessage(adminChatId, reportMsg);

    return NextResponse.json({
      success: true,
      created: true,
      message: 'Artikel Planet Mars berhasil diterbitkan.',
      article: {
        id: docId,
        title: newArticle.title,
        category: newArticle.category,
        review_status: newArticle.review_status
      }
    });
  } catch (error) {
    console.error('[Cron Mars] Error:', error);
    const adminChatId = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const failMsg =
      `⚠️ <b>LAPORAN CRON PLANET MARS GAGAL</b>\n\n` +
      `❌ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}`;
    try {
      await sendTelegramMessage(adminChatId, failMsg);
    } catch {}

    return NextResponse.json(
      { error: 'Failed to generate Planet Mars article', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
