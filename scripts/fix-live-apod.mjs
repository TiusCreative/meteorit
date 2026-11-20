import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.join(__dirname, '../.env');
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#') && t.includes('=')) {
      const idx = t.indexOf('=');
      let val = t.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[t.slice(0, idx).trim()] = val;
    }
  }
}

const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = env.R2_BUCKET_NAME || 'meteorit-indonesia';
const OPENROUTER_KEY = env.OPENROUTER_API_KEY;
const CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
const D1_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadToR2(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  console.log(`[R2] Uploaded: ${key}`);
  return `https://cdn.meteorit.my.id/${key}`;
}

async function getFromR2(key) {
  try {
    const res = await s3.send(new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }));
    const str = await res.Body.transformToString();
    return JSON.parse(str);
  } catch {
    return null;
  }
}

async function translateText(text, prompt) {
  if (!text) return '';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${err}`);
  }
  const data = await res.json();
  let content = data.choices[0].message.content.trim();
  if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith('“') && content.endsWith('”'))) {
    content = content.slice(1, -1).trim();
  }
  return content;
}

const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december'
];

async function fetchFromWordPress(dateStr) {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = MONTH_NAMES[parseInt(monthStr, 10) - 1];
  const day = parseInt(dayStr, 10);
  const paddedDay = String(day).padStart(2, '0');

  const terms = [
    `apod-${year}-${month}-${day}`,
    `apod-${year}-${month}-${paddedDay}`,
  ];

  for (const term of terms) {
    const wpUrl = `https://science.nasa.gov/wp-json/wp/v2/image-article?search=${encodeURIComponent(term)}&per_page=5`;
    const res = await fetch(wpUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) continue;
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) continue;

    const matched = items.find(it => {
      const slug = it.slug || '';
      return slug.startsWith(`apod-${year}-${month}-${day}`) || slug.startsWith(`apod-${year}-${month}-${paddedDay}`);
    }) || items[0];

    if (matched) {
      const rawTitle = (matched.title?.rendered || '')
        .replace(/^APOD:\s*\d{4}\s*\w+\s*\d+\s*[–—\-]\s*/i, '')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').trim();

      const content = matched.content?.rendered || '';
      let explanation = '';
      const expMatch = content.match(/<strong>Explanation:<\/strong>\s*([\s\S]*?)(?:<div|Tomorrow's picture:|$)/i);
      if (expMatch && expMatch[1]) {
        explanation = expMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').trim();
      } else {
        explanation = (matched.excerpt?.rendered || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
      }

      let imageUrl = '';
      const fi = matched.featured_image;
      if (fi?.file && !fi.file.includes('nasa-logo')) {
        imageUrl = fi.file;
      } else if (matched.featured_image_url && !matched.featured_image_url.includes('nasa-logo')) {
        imageUrl = matched.featured_image_url;
      }

      return {
        date: dateStr,
        title: rawTitle,
        explanation,
        imageUrl,
      };
    }
  }
  return null;
}

async function queryD1(sql, params = []) {
  if (!CLOUDFLARE_API_TOKEN || !D1_DATABASE_ID) return;
  const url = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  if (res.ok) {
    console.log(`[D1] Executed query successfully`);
  } else {
    console.warn(`[D1] Query failed:`, await res.text());
  }
}

async function main() {
  console.log('=== FIXING LIVE NASA APOD DATA IN CLOUDFLARE R2 & D1 ===');

  const datesToFix = ['2026-11-16', '2026-11-15', '2026-11-14'];
  const fixedEntries = [];

  for (const date of datesToFix) {
    console.log(`\nFetching real APOD for ${date}...`);
    const wp = await fetchFromWordPress(date);
    if (!wp) {
      console.warn(`Could not find WordPress article for ${date}`);
      continue;
    }

    console.log(`Found: "${wp.title}"`);
    console.log(`Image: ${wp.imageUrl}`);

    // Download true image
    const imgRes = await fetch(wp.imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const ext = wp.imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';

    // Upload to R2 with proper extension and also .png fallback
    const r2ImgUrl = await uploadToR2(`data/encyclopedia/images/${date}.${safeExt}`, imgBuffer, contentType);
    await uploadToR2(`data/encyclopedia/images/${date}.png`, imgBuffer, contentType);

    // Translate Title and Explanation
    console.log(`Translating title...`);
    const titleId = await translateText(
      wp.title,
      'Terjemahkan judul astronomi NASA APOD berikut ke Bahasa Indonesia secara singkat, akurat, dan ilmiah. Kembalikan HANYA teks judul terjemahan saja tanpa tanda kutip.'
    );
    console.log(`-> ${titleId}`);

    console.log(`Translating explanation...`);
    const explanationId = await translateText(
      wp.explanation,
      'Terjemahkan penjelasan ilmiah astronomi NASA APOD berikut ke Bahasa Indonesia yang akurat, mudah dipahami, mempertahankan seluruh paragraf, nama objek kosmik, misi antariksa, dan istilah teknis ilmiah. Jangan memotong penjelasan.'
    );

    const attribution = '\n\nSource: NASA Open Data APIs\nSumber Data: Pusat Data Publik Antariksa';
    const formatted = {
      id: date,
      title: {
        en: wp.title,
        id: titleId,
      },
      explanation: {
        en: wp.explanation + attribution,
        id: explanationId + attribution,
      },
      image_url: r2ImgUrl,
      copyright: 'NASA Public Domain',
      media_type: 'image',
      processedAt: new Date().toISOString(),
      source: 'wordpress-api',
    };

    fixedEntries.push(formatted);

    // Save to D1
    const titleStr = JSON.stringify(formatted.title);
    const expStr = JSON.stringify(formatted.explanation);
    await queryD1(
      'INSERT OR REPLACE INTO apod_history (id, date, title, explanation, image_url, translations, processedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, date, titleStr, expStr, r2ImgUrl, JSON.stringify({}), formatted.processedAt]
    );
  }

  // Update R2 history.json and latest.json
  console.log('\nUpdating R2 history.json & latest.json...');
  let history = await getFromR2('data/encyclopedia/history.json') || [];
  for (const entry of fixedEntries) {
    const idx = history.findIndex(h => h.id === entry.id);
    if (idx >= 0) {
      history[idx] = entry;
    } else {
      history.unshift(entry);
    }
  }

  // Sort history by id descending
  history.sort((a, b) => b.id.localeCompare(a.id));

  await uploadToR2('data/encyclopedia/history.json', JSON.stringify(history, null, 2), 'application/json');
  await uploadToR2('data/encyclopedia/latest.json', JSON.stringify(history[0], null, 2), 'application/json');

  console.log('\n=== FIX COMPLETED SUCCESSFULLY! ===');
  console.log('Latest APOD on landing page will now be:', history[0].title.id, history[0].image_url);
}

main().catch(console.error);

