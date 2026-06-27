import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { getAbsoluteUrl, getSiteUrl } from '@/lib/siteUrl';

const CATEGORIES = ['Panduan', 'Peristiwa', 'Sejarah', 'Edukasi', 'Trivia'];

type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  provider: string;
};

async function generateArticleWithFallback(prompt: string): Promise<GeneratedArticle> {
  const messages = [
    { role: 'system', content: 'Anda adalah penulis blog astronomi profesional berbahasa Indonesia. Anda wajib memberikan output dalam format JSON murni.' },
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
      console.warn(`[Cron Blog] ${provider.name} gagal, mencoba provider berikutnya:`, msg);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`Semua provider AI gagal. ${errors.join(' | ') || 'Tidak ada API key AI yang tersedia.'}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');

  // Verify the cron secret (supports query param or Vercel authorization header)
  if (
    secret !== (process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=') &&
    authHeader !== `Bearer ${process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU='}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Pick category randomly or from query
  const categoryParam = searchParams.get('category');
  const category = categoryParam && CATEGORIES.includes(categoryParam) 
    ? categoryParam 
    : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  try {
    // Generate AI Article with provider fallback
    const prompt = `Buatkan artikel edukatif yang sangat menarik bertema astronomi, luar angkasa, atau meteorit dalam Bahasa Indonesia.
Kategori artikel: "${category}".
Format output harus berupa JSON murni dengan properti berikut:
- "title": Judul artikel yang menarik dan bombastis (maksimal 10 kata).
- "excerpt": Ringkasan pendek (sekitar 20 kata) untuk cuplikan kartu.
- "content": Isi artikel lengkap dalam format Markdown (minimal 300 kata) yang terbagi dalam beberapa sub-heading menarik.

Kembalikan HANYA string JSON murni tanpa membungkus dengan tag markdown json.`;

    const articleJson = await generateArticleWithFallback(prompt);

    const docId = `article-${Date.now()}`;
    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const illustrationPrompt = encodeURIComponent(`astrophotography stars space background nebula meteorite deep space style for article ${articleJson.title}`);
    const imageUrl = `https://image.pollinations.ai/prompt/${illustrationPrompt}?width=800&height=500&nologo=true`;

    const newArticle = {
      id: docId,
      title: articleJson.title,
      excerpt: articleJson.excerpt,
      content: articleJson.content,
      category: category,
      date: dateFormatted,
      image: imageUrl,
      views: 0,
      status: 'Published',
      ai_provider: articleJson.provider,
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    await adminDb.collection('articles').doc(docId).set(newArticle);

    // Rebuild Blog index cache in R2
    const allArticlesSnapshot = await adminDb.collection('articles').get();

    const articlesList: any[] = [];
    allArticlesSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === 'Published') {
        articlesList.push(data);
      }
    });

    // Sort in-memory by createdAt descending
    articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Save JSON array index list to Cloudflare R2
    await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');

    // Get total statistics for report
    const totalArticles = articlesList.length;
    const totalMeteorites = await adminDb.collection('meteorites').get().then((snap: any) => snap.size);

    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

    // 1. Send link otomatis ke channel
    const articleUrl = getAbsoluteUrl(`/blog/${docId}`);
    const channelMsg = `📝 <b>Artikel Sains Baru Terbit!</b>\n\n` +
      `📌 <b>${newArticle.title}</b>\n` +
      `<i>${newArticle.excerpt}</i>\n\n` +
      `📚 Kategori: ${newArticle.category}\n` +
      `📅 Tanggal: ${newArticle.date}\n\n` +
      `🔗 Baca selengkapnya di sini:\n${articleUrl}`;
    await sendTelegramMessage(TELEGRAM_CHANNEL_ID, channelMsg);

    // 2. Send report harian ke Chat ID Admin
    const successMsg = `📢 <b>LAPORAN CRON JOB BLOG ARTIKEL AI</b>\n\n` +
      `🟢 <b>Status:</b> Sukses (Success)\n` +
      `📊 <b>Statistik Sistem:</b>\n` +
      `   • Total Artikel: ${totalArticles}\n` +
      `   • Total Ensiklopedia: ${totalMeteorites}\n` +
      `   • Artikel Baru Terbit: "${newArticle.title}"\n` +
      `   • Kategori: ${newArticle.category}\n\n` +
      `🤖 <b>Provider AI:</b> ${articleJson.provider}\n\n` +
      `🛠 <i>Sistem berjalan otomatis, cache R2 dan Firestore berhasil diperbarui.</i>`;
    await sendTelegramMessage(TELEGRAM_CHAT_ID, successMsg);

    return NextResponse.json({
      success: true,
      message: 'New article generated by AI and updated on R2 cache.',
      article: {
        id: docId,
        title: newArticle.title,
        category: newArticle.category
      }
    });

  } catch (error) {
    console.error('Error generating AI article:', error);

    // Send fail report to Admin Chat
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const failMsg = `⚠️ <b>LAPORAN CRON JOB GAGAL (Blog Artikel)</b>\n\n` +
      `❌ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}\n` +
      `🛠 <b>Status:</b> Failed (Notifikasi artikel gagal dibuat)`;
    try {
      await sendTelegramMessage(TELEGRAM_CHAT_ID, failMsg);
    } catch {}

    return NextResponse.json(
      { error: 'Failed to generate AI blog article', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
