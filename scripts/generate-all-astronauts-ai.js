#!/usr/bin/env node
/**
 * scripts/generate-all-astronauts-ai.js
 * 
 * Men-generate foto resmi astronot menggunakan Cloudflare Workers AI
 * dan menyimpannya langsung ke Cloudflare R2 dalam format WebP,
 * sehingga halaman /astronot memuat foto asli dan tidak lagi memakai pollinations/emoji.
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

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

async function generateAstronautPortrait(name, agency, country) {
  if (!CF_API_TOKEN) return null;
  const prompt = `Professional official portrait photograph of astronaut ${name} from ${agency} ${country} in space suit, official NASA crew portrait photography, realistic high quality 8k, sharp focus, looking directly at camera, subtle ISS background`;
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
        signal: AbortSignal.timeout(35000),
      }
    );
    if (!res.ok) {
      console.warn(`  Workers AI status ${res.status}`);
      return null;
    }
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } catch (err) {
    console.warn(`  Workers AI error for ${name}:`, err.message);
    return null;
  }
}

async function run() {
  console.log('🔍 Mengunduh astronauts.json dari R2...');
  let dataset = null;
  try {
    const res = await fetch(`${R2_PUBLIC_URL}/data/astronauts/astronauts.json?_t=${Date.now()}`);
    if (res.ok) dataset = await res.json();
  } catch (err) {
    console.warn('Gagal fetch dari R2, menggunakan fallback:', err.message);
  }

  // Daftar astronot unik dari R2 dataset
  const astronauts = (dataset && dataset.astronauts) ? dataset.astronauts : [];
  console.log(`👨‍🚀 Ditemukan ${astronauts.length} astronot dalam dataset.`);

  const idToUrlMap = {};

  for (const astro of astronauts) {
    const id = astro.id;
    const name = astro.name;
    const agency = astro.agency || 'NASA';
    const country = astro.country || '';

    console.log(`🎨 Menghasilkan foto AI untuk: ${name} (${agency} - ${country})...`);
    const buf = await generateAstronautPortrait(name, agency, country);

    if (buf && buf.length > 2000) {
      const r2Key = `data/astronauts/images/${id}.webp`;
      try {
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: buf,
          ContentType: 'image/webp',
        }));
        const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`;
        astro.imageUrl = publicUrl;
        idToUrlMap[id] = publicUrl;
        console.log(`  ✅ Berhasil disimpan di R2: ${publicUrl}`);
      } catch (err) {
        console.error(`  ❌ Gagal upload R2:`, err.message);
      }
    } else {
      console.warn(`  ⚠️ Gagal generate foto untuk ${name}`);
    }

    // Jeda 600ms
    await new Promise(r => setTimeout(r, 600));
  }

  // Simpan dataset astronauts.json yang telah diupdate ke R2
  if (dataset && dataset.astronauts) {
    console.log('💾 Mengunggah astronauts.json baru ke R2...');
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'data/astronauts/astronauts.json',
      Body: Buffer.from(JSON.stringify(dataset, null, 2)),
      ContentType: 'application/json',
    }));
    console.log('✅ astronauts.json di R2 berhasil diperbarui!');
  }

  // Perbarui file src/lib/astronautData.ts lokal agar fallback lokal juga menggunakan URL R2
  const dataTsPath = path.join(__dirname, '../src/lib/astronautData.ts');
  if (fs.existsSync(dataTsPath)) {
    let content = fs.readFileSync(dataTsPath, 'utf8');
    for (const [id, url] of Object.entries(idToUrlMap)) {
      // Ganti pattern imageUrl lama untuk ID ini
      const regex = new RegExp(`id:\\s*['"]${id}['"][\\s\\S]*?imageUrl:\\s*['"][^'"]+['"]`, 'g');
      content = content.replace(regex, (match) => {
        return match.replace(/imageUrl:\s*['"][^'"]+['"]/, `imageUrl: '${url}'`);
      });
    }
    // Ganti juga semua sisa pollinations.ai di astronautData.ts dengan direct R2 URL
    content = content.replace(
      /\/api\/image-proxy\?url=[^'"]+pollinations[^'"]+/g,
      `${R2_PUBLIC_URL}/data/glossary/images/nasa-apod.webp`
    );
    fs.writeFileSync(dataTsPath, content, 'utf8');
    console.log('✅ src/lib/astronautData.ts berhasil diperbarui!');
  }

  console.log('🎉 Selesai memproses semua astronot!');
}

run().catch(console.error);

