#!/usr/bin/env node
/**
 * scripts/fix-all-apod-history.js
 * 
 * Memperbaiki semua entri APOD yang tersimpan dengan placeholder "NASA Science" / logo NASA
 * dengan mengambil data asli dan foto resolusi tinggi dari NASA WordPress API,
 * menyimpannya ke Cloudflare R2, dan memperbarui D1 serta history.json di R2.
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { execSync } = require('child_process');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'cd3b2f027722b69c38f2f9ebf3663228';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'a0ed04760361869f55ebf6a109ddeda9d3de431cefa27faaaf05a2a0f8f5a5d7';
const BUCKET = process.env.R2_BUCKET_NAME || 'meteorit-indonesia';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const R2_PUBLIC_URL = 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

async function fetchRealApodData(date) {
  const [y, m, d] = date.split('-');
  const mName = MONTHS[parseInt(m, 10) - 1];
  const dayNum = parseInt(d, 10);

  const searchTerms = [
    `${y}-${mName}-${dayNum}`,
    `${y}-${mName}-${d}`,
    `apod-${y}-${mName}-${dayNum}`,
    `apod-${y}-${mName}-${d}`
  ];

  for (const term of searchTerms) {
    try {
      const res = await fetch(`https://science.nasa.gov/wp-json/wp/v2/image-article?search=${encodeURIComponent(term)}&per_page=10`, {
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) continue;

      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) continue;

      const matched = items.find(it => {
        const s = it.slug || '';
        const t = (it.title?.rendered || '').toLowerCase();
        const matchesDate = s.includes(`${y}-${mName}-${dayNum}`) || s.includes(`${y}-${mName}-${d}`);
        return matchesDate && !t.includes('nasa science');
      });

      if (matched) {
        const rawTitle = (matched.title?.rendered || '')
          .replace(/APOD:\s*\d{4}\s*\w+\s*\d+\s*[–—\-]\s*/i, '')
          .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').trim();

        const rawExcerpt = (matched.excerpt?.rendered || matched.caption || '')
          .replace(/<[^>]+>/g, '')
          .replace(/\[&hellip;\]/g, '...')
          .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8217;/g, "'").replace(/&#8211;/g, '-').trim();

        const imageUrl = matched.featured_image?.file || matched.featured_image_url || null;
        if (imageUrl && !imageUrl.includes('nasa-logo')) {
          return {
            title: rawTitle,
            explanation: rawExcerpt,
            imageUrl
          };
        }
      }
    } catch (err) {
      // Continue to next term
    }
  }

  return null;
}

async function uploadImageToR2(url, date) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const r2Key = `data/encyclopedia/images/${date}.${safeExt}`;
    const contentType = safeExt === 'png' ? 'image/png' : (safeExt === 'webp' ? 'image/webp' : 'image/jpeg');

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: buf,
      ContentType: contentType
    }));

    // Simpan juga salinan .png jika bukan png agar kompatibel dengan URL lama
    if (safeExt !== 'png') {
      try {
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `data/encyclopedia/images/${date}.png`,
          Body: buf,
          ContentType: contentType
        }));
      } catch {}
    }

    return `${R2_PUBLIC_URL}/${r2Key}`;
  } catch (err) {
    console.warn(`  ⚠️ Gagal cache gambar ke R2 untuk ${date}:`, err.message);
    return url;
  }
}

async function run() {
  console.log('🔍 Mengambil daftar entri APOD dari Cloudflare D1...');
  let records = [];
  try {
    const out = execSync(`npx wrangler d1 execute meteorit-db --remote --json --command "SELECT id, date, title, explanation, image_url, translations FROM apod_history ORDER BY id DESC LIMIT 60;"`, {
      env: { ...process.env, CLOUDFLARE_API_TOKEN: CF_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID },
      encoding: 'utf8'
    });
    const parsed = JSON.parse(out);
    records = parsed[0]?.results || [];
  } catch (d1Err) {
    console.error('Gagal baca D1:', d1Err.message);
    process.exit(1);
  }

  console.log(`📋 Memeriksa ${records.length} entri APOD...`);

  const needFix = records.filter(r => {
    const titleStr = typeof r.title === 'string' ? r.title : JSON.stringify(r.title);
    const imgStr = r.image_url || '';
    return titleStr.includes('NASA Science') || titleStr.includes('Ilmu Pengetahuan NASA') || imgStr.includes('nasa-logo');
  });

  console.log(`🎯 Ditemukan ${needFix.length} entri APOD yang membutuhkan perbaikan gambar asli NASA.`);

  let fixedCount = 0;

  for (const item of needFix) {
    const date = item.id;
    console.log(`\n🔭 [${date}] Mencari gambar & data asli NASA...`);

    const realData = await fetchRealApodData(date);
    if (!realData) {
      console.log(`  ❌ Tidak ditemukan artikel spesifik di NASA WP untuk ${date}`);
      continue;
    }

    console.log(`  ✨ Ditemukan: "${realData.title}"`);
    console.log(`  📸 Mengunduh foto asli: ${realData.imageUrl}`);

    const r2ImageUrl = await uploadImageToR2(realData.imageUrl, date);
    console.log(`  ✅ Disimpan ke R2: ${r2ImageUrl}`);

    // Update objek title dan explanation
    const titleObj = { en: realData.title, id: realData.title };
    const expObj = { en: realData.explanation, id: realData.explanation };

    // Update ke Cloudflare D1
    const updateSql = `UPDATE apod_history SET 
      title = '${JSON.stringify(titleObj).replace(/'/g, "''")}',
      explanation = '${JSON.stringify(expObj).replace(/'/g, "''")}',
      image_url = '${r2ImageUrl}'
      WHERE id = '${date}';`;

    try {
      execSync(`npx wrangler d1 execute meteorit-db --remote --command "${updateSql.replace(/"/g, '\\"')}"`, {
        env: { ...process.env, CLOUDFLARE_API_TOKEN: CF_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID },
        stdio: 'ignore'
      });
      console.log(`  💾 D1 berhasil diperbarui untuk ${date}!`);
      fixedCount++;
    } catch (sqlErr) {
      console.warn(`  ⚠️ Gagal update D1:`, sqlErr.message);
    }

    // Jeda 600ms
    await new Promise(r => setTimeout(r, 600));
  }

  // Rebuild R2 cache history.json dan latest.json
  console.log('\n📦 Membangun ulang cache data/encyclopedia/history.json di R2...');
  try {
    const snapOut = execSync(`npx wrangler d1 execute meteorit-db --remote --json --command "SELECT id, date, title, explanation, image_url, translations FROM apod_history ORDER BY id DESC LIMIT 150;"`, {
      env: { ...process.env, CLOUDFLARE_API_TOKEN: CF_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID },
      encoding: 'utf8'
    });
    const snapParsed = JSON.parse(snapOut);
    const historyList = (snapParsed[0]?.results || []).map(r => ({
      id: r.id,
      date: r.date || r.id,
      title: typeof r.title === 'string' ? (JSON.parse(r.title) || { en: r.title, id: r.title }) : r.title,
      explanation: typeof r.explanation === 'string' ? (JSON.parse(r.explanation) || { en: r.explanation, id: r.explanation }) : r.explanation,
      image_url: r.image_url,
      translations: typeof r.translations === 'string' ? JSON.parse(r.translations || '{}') : (r.translations || {}),
    }));

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'data/encyclopedia/history.json',
      Body: Buffer.from(JSON.stringify(historyList, null, 2)),
      ContentType: 'application/json',
    }));

    if (historyList[0]) {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: 'data/encyclopedia/latest.json',
        Body: Buffer.from(JSON.stringify(historyList[0], null, 2)),
        ContentType: 'application/json',
      }));
    }
    console.log(`✅ R2 history.json (${historyList.length} entri) dan latest.json berhasil diperbarui!`);
  } catch (cacheErr) {
    console.error('Gagal update R2 cache:', cacheErr.message);
  }

  console.log(`\n🎉 SELESAI: ${fixedCount} entri APOD berhasil dipulihkan dengan foto asli NASA!`);
}

run().catch(console.error);

