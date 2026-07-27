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
    const { buildArticleTranslations } = await import('../src/lib/articleLocalization');
    const { rebuildRSSFeedHelper } = await import('../src/lib/rss');

    const snap = await adminDb.collection('articles').get();
    console.log(`Found ${snap.size} total articles in Firestore.`);

    let translatedCount = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const translations = data.translations || {};
      const translationKeys = Object.keys(translations);
      let needsTranslation = translationKeys.length < 4;
      if (!needsTranslation) {
        for (const lang of translationKeys) {
          const content = translations[lang]?.content || '';
          if (content.includes('Catatan: terjemahan') || content.includes('automatic translation')) {
            needsTranslation = true;
            break;
          }
        }
      }

      if (needsTranslation) {
        console.log(`Waiting 3 seconds to avoid rate limits, then translating article: "${data.title}" (ID: ${doc.id})...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const newTranslations = await buildArticleTranslations({
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || ''
          });

          await doc.ref.update({
            translations: newTranslations,
            updatedAt: new Date().toISOString()
          });

          console.log(`✅ Successfully translated and updated article: "${data.title}"`);
          translatedCount++;
        } catch (err) {
          console.error(`❌ Failed to translate article "${data.title}":`, err);
        }
      } else {
        console.log(`✔ Article already has valid translations: "${data.title}"`);
      }
    }

    if (translatedCount > 0) {
      // Rebuild client-side posts cache in R2
      console.log('Rebuilding R2 blog cache...');
      const allArticlesSnapshot = await adminDb.collection('articles').get();
      const articlesList: any[] = [];
      allArticlesSnapshot.forEach((d: any) => {
        const dData = d.data();
        if (dData.status === 'Published') {
          articlesList.push({ id: d.id, ...dData });
        }
      });
      articlesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      const { uploadToR2 } = await import('../src/lib/r2Client');
      await uploadToR2('data/blog/posts.json', JSON.stringify(articlesList, null, 2), 'application/json');
      console.log('R2 blog cache successfully rebuilt.');

      // Rebuild RSS
      await rebuildRSSFeedHelper();
    }

    console.log(`Finished processing. Translated ${translatedCount} articles.`);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during batch translation:', err);
    process.exit(1);
  }
}

run();
