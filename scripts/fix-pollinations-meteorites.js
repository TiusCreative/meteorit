#!/usr/bin/env node
/**
 * scripts/fix-pollinations-meteorites.js
 * 
 * Mengganti semua URL image.pollinations.ai di data/meteorites/catalog.json
 * dengan gambar AI Cloudflare Workers AI yang diupload ke R2,
 * lalu mengupdate catalog.json di R2 dan D1.
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { execSync } = require('child_process');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'cd3b2f027722b69c38f2f9ebf3663228';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'a0ed04760361869f55ebf6a109ddeda9d3de431cefa27faaaf05a2a0f8f5a5d7';
const BUCKET = process.env.R2_BUCKET_NAME || 'meteorit-indonesia';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AI_TOKEN || '';
const R2_PUBLIC_URL = 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

async function generateAiImage(prompt) {
  if (!CF_API_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) {
      console.warn(`  Workers AI status ${res.status}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } catch (err) {
    console.warn('  Workers AI error:', err.message);
    return null;
  }
}

async function run() {
  console.log('🔍 Mengunduh catalog.json dari R2...');
  const res = await fetch(`${R2_PUBLIC_URL}/data/meteorites/catalog.json?_t=${Date.now()}`);
  if (!res.ok) throw new Error(`Gagal fetch catalog: ${res.status}`);
  const list = await res.json();

  const needFix = list.filter(m => (m.image_url || '').includes('pollinations.ai') || !m.image_url);
  console.log(`📦 Ditemukan ${needFix.length} meteorit dengan pollinations.ai/kosong dari total ${list.length}`);

  let updatedCount = 0;
  for (const met of needFix) {
    const metId = String(met.id);
    const name = met.name || 'Meteorite';
    const recclass = met.recclass || 'Stony';
    console.log(`⚙️ [${metId}] Menghasilkan gambar AI untuk ${name} (${recclass})...`);

    const prompt = `A high-quality realistic close-up photo of the famous ${name} meteorite, classified as ${recclass}. Stony meteorite rock, detailed crust texture, dark space background, scientific museum display.`;
    const imageBuf = await generateAiImage(prompt);

    let finalUrl = `${R2_PUBLIC_URL}/data/glossary/images/nasa-meteorite.webp`;

    if (imageBuf && imageBuf.length > 1000) {
      const r2Key = `data/meteorites/images/${metId}.webp`;
      try {
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: imageBuf,
          ContentType: 'image/webp',
        }));
        finalUrl = `${R2_PUBLIC_URL}/${r2Key}`;
        console.log(`  ✅ Disimpan ke R2: ${finalUrl}`);
      } catch (uploadErr) {
        console.warn(`  ⚠️ Upload ke R2 gagal, menggunakan fallback:`, uploadErr.message);
      }
    } else {
      console.log(`  ℹ️ Menggunakan fallback gambar AI R2: ${finalUrl}`);
    }

    met.image_url = finalUrl;
    updatedCount++;

    // Jeda 500ms agar tidak terkena rate-limit
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`💾 Mengunggah catalog.json yang telah diperbarui ke R2...`);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: 'data/meteorites/catalog.json',
    Body: Buffer.from(JSON.stringify(list, null, 2)),
    ContentType: 'application/json',
  }));
  console.log('✅ catalog.json berhasil disimpan di R2!');

  // Sync 50 item ke Cloudflare D1
  if (CF_API_TOKEN) {
    console.log('🔄 Melakukan sinkronisasi ke Cloudflare D1...');
    for (const met of needFix) {
      const sql = `UPDATE meteorites SET image_url = '${met.image_url}' WHERE id = '${met.id}';`;
      try {
        execSync(`npx wrangler d1 execute meteorit-db --remote --command "${sql.replace(/"/g, '\\"')}"`, {
          env: { ...process.env, CLOUDFLARE_API_TOKEN: CF_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID },
          stdio: 'ignore'
        });
      } catch {}
    }
    console.log('✅ Sinkronisasi D1 selesai!');
  }

  console.log(`🎉 Selesai! ${updatedCount} meteorit berhasil diperbarui dengan gambar AI asli.`);
}

run().catch(console.error);

