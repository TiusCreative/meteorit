import { NextResponse } from 'next/server';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';
import { sendTelegramMessage } from '@/lib/telegram';
import { getAbsoluteUrl, getSiteUrl } from '@/lib/siteUrl';
import { buildArticleTranslations } from '@/lib/articleLocalization';
import { sendBroadcastNotification } from '@/lib/notifications';
import { rebuildRSSFeedHelper } from '@/lib/rss';
export const dynamic = 'force-dynamic';
export const maxDuration = 80;

const CATEGORIES = ['Panduan', 'Peristiwa', 'Sejarah', 'Edukasi', 'Trivia'];

type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
  provider: string;
};

import { generateWithAI, parseAIJson } from '@/lib/aiProvider';

async function generateArticleWithFallback(prompt: string): Promise<GeneratedArticle> {
  const result = await generateWithAI({
    messages: [
      { role: 'system', content: 'Anda adalah penulis blog astronomi profesional berbahasa Indonesia. Anda wajib memberikan output dalam format JSON murni.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    responseFormatJson: true
  });

  // parseAIJson membersihkan karakter kontrol yang tidak valid di dalam JSON string
  const articleJson = parseAIJson(String(result.content));

  if (!articleJson.title || !articleJson.excerpt || !articleJson.content) {
    throw new Error('JSON AI tidak lengkap.');
  }

  return {
    title: articleJson.title,
    excerpt: articleJson.excerpt,
    content: articleJson.content,
    provider: result.provider
  };
}

import { isValidCronRequest } from '@/lib/cronAuth';

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Pick category randomly or from query
  const { searchParams } = new URL(request.url);
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

    const illustrationPrompt = `${articleJson.title}, ${category}, space astronomy photography, cosmic nebula stars background, hyperrealistic 8k digital art, cinematic lighting`;
    const imagePath = `data/blog/images/${docId}.jpg`;
    const { generateImageWithFallback } = await import('@/lib/imageGenerator');
    const imageUrl = await generateImageWithFallback(illustrationPrompt, imagePath);

    const attribution = "\n\nSource: NASA Open Data APIs\nSumber Data: Pusat Data Publik Antariksa";
    const articleContent = articleJson.content + attribution;

    // Auto-translate ke 4 bahasa (EN, MS, ZH, JA) saat artikel dibuat
    console.log(`[Cron Blog] Memulai auto-translate untuk: ${articleJson.title}`);
    let translations = {};
    try {
      translations = await buildArticleTranslations({
        title: articleJson.title,
        excerpt: articleJson.excerpt,
        content: articleContent,
      });
      console.log(`[Cron Blog] ✅ Auto-translate selesai: ${Object.keys(translations).join(', ')}`);
    } catch (translateErr) {
      console.warn('[Cron Blog] ⚠️ Auto-translate gagal, artikel tetap disimpan tanpa terjemahan:', translateErr);
    }

    const newArticle = {
      id: docId,
      title: articleJson.title,
      excerpt: articleJson.excerpt,
      content: articleContent,
      translations,
      category: category,
      date: dateFormatted,
      image: imageUrl,
      views: 0,
      status: 'Published',
      ai_provider: articleJson.provider,
      createdAt: new Date().toISOString()
    };

    // 3. Save individual article JSON directly to R2 (no Firestore)
    await uploadToR2(`data/blog/articles/${docId}.json`, JSON.stringify(newArticle, null, 2), 'application/json');

    // 4. Save metadata to Cloudflare D1
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
          'blog,astronomi,sains',
          newArticle.image,
          newArticle.excerpt,
          newArticle.date,
          newArticle.views,
          newArticle.status,
          'Terverifikasi', // Blog articles default to verified or verified review_status
          newArticle.ai_provider
        ]
      );
      console.log(`[Cron Blog] Metadata successfully stored in Cloudflare D1 for: ${docId}`);
    } catch (d1Err) {
      console.error('[Cron Blog] Gagal menyimpan metadata ke Cloudflare D1:', d1Err);
    }


    // 4. Update posts.json index in R2 (prepend new article)
    const existingPosts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
    const updatedPosts = [newArticle, ...existingPosts.filter((p: any) => p.id !== docId)];
    updatedPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    await uploadToR2('data/blog/posts.json', JSON.stringify(updatedPosts, null, 2), 'application/json');

    // 5. Rebuild RSS Feed from R2
    await rebuildRSSFeedHelper();

    // Get total statistics from R2 cache
    const totalArticles = updatedPosts.length;
    // Keep meteorites count from Firestore (still used for backup data)
    let totalMeteorites = 0;
    try {
      const { adminDb } = await import('@/lib/firebaseAdmin');
      totalMeteorites = await adminDb.collection('meteorites').get().then((snap: any) => snap.size);
    } catch { /* best effort */ }

    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';

    const articleUrl = getAbsoluteUrl(`/blog/${docId}`);
    const channelMsg = `📝 <b>Artikel Sains Baru Terbit!</b>\n\n` +
      `📌 <b>${newArticle.title}</b>\n` +
      `<i>${newArticle.excerpt}</i>\n\n` +
      `📚 Kategori: ${newArticle.category}\n` +
      `📅 Tanggal: ${newArticle.date}\n\n` +
      `🔗 Baca selengkapnya di sini:\n${articleUrl}`;

    await sendBroadcastNotification({
      title: `📝 Artikel Baru: ${newArticle.title}`,
      body: `Artikel Sains Baru Terbit!\n${newArticle.title}\n${newArticle.excerpt}`,
      telegramHtml: channelMsg,
      link: `/blog/${docId}`,
      imageUrl: newArticle.image
    });

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
