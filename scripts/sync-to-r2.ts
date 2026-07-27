import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    }
  });
}

async function run() {
  try {
    const { adminDb } = await import('../src/lib/firebaseAdmin');
    const { uploadToR2 } = await import('../src/lib/r2Client');
    const { rebuildRSSFeedHelper } = await import('../src/lib/rss');

    console.log('[Sync Script] Memulai sinkronisasi artikel lama dari Firestore ke R2...');

    const snap = await adminDb.collection('articles').get();
    console.log(`[Sync Script] Ditemukan ${snap.size} artikel di Firestore.`);

    const articlesList: any[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const article = {
        id: doc.id,
        title: data.title || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        translations: data.translations || {},
        category: data.category || 'Trivia',
        date: data.date || new Date(data.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        image: data.image || data.imageUrl || '',
        views: data.views || 0,
        status: data.status || 'Published',
        ai_provider: data.ai_provider || 'Unknown',
        createdAt: data.createdAt || new Date().toISOString(),
        asteroid_data: data.asteroid_data || undefined
      };

      if (article.status === 'Published') {
        articlesList.push(article);
      }

      // Upload individual article JSON to R2
      const articleKey = `data/blog/articles/${doc.id}.json`;
      await uploadToR2(articleKey, JSON.stringify(article, null, 2), 'application/json');
      console.log(`[Sync Script] ✅ Berhasil mengunggah detail: ${articleKey}`);
    }

    // Sort by createdAt descending
    articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Upload consolidated list to R2
    await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
    console.log('[Sync Script] ✅ Berhasil memperbarui data/blog/posts.json di R2.');

    // Rebuild RSS Feed
    console.log('[Sync Script] Membangun ulang RSS feed...');
    // We will build RSS feed using the existing helper for now, but we will upgrade it in the next step.
    const rssSuccess = await rebuildRSSFeedHelper();
    if (rssSuccess) {
      console.log('[Sync Script] ✅ RSS Feed berhasil dibangun ulang.');
    } else {
      console.log('[Sync Script] ❌ Gagal membangun ulang RSS Feed.');
    }

    console.log('[Sync Script] 🎉 Semua artikel lama berhasil disinkronkan ke Cloudflare R2.');
    process.exit(0);
  } catch (err) {
    console.error('[Sync Script] ❌ Fatal error:', err);
    process.exit(1);
  }
}

run();
