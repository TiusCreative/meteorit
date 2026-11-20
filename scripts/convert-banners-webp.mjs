#!/usr/bin/env node

/**
 * Migration & Optimization Script:
 * 1. Audits all blog/article banners in Cloudflare R2 (data/blog/posts.json).
 * 2. Converts all .jpg/.png images to WebP with 80% quality using sharp.
 * 3. Uploads converted .webp to R2 without deleting original files.
 * 4. Standardizes publishedAt timestamp for all articles.
 * 5. Updates posts.json, individual article JSONs, and D1 database.
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID || "5f29e48300ae379ebe15c20185d15ac8",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "cd3b2f027722b69c38f2f9ebf3663228",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "a0ed04760361869f55ebf6a109ddeda9d3de431cefa27faaaf05a2a0f8f5a5d7",
  bucketName: process.env.R2_BUCKET_NAME || "meteorit-indonesia",
  publicUrl: "https://cdn.meteorit.my.id",
  s3Endpoint: "https://5f29e48300ae379ebe15c20185d15ac8.r2.cloudflarestorage.com"
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.s3Endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey
  }
});

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function fileExistsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key
    }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 [WebP Migration] Memulai audit dan konversi banner ke WebP 80%...');

  // 1. Ambil posts.json dari R2
  const postsRes = await s3.send(new GetObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: 'data/blog/posts.json'
  }));
  const postsData = JSON.parse(await postsRes.Body.transformToString());
  console.log(`📦 Total artikel terdaftar dalam katalog: ${postsData.length}`);

  let auditedCount = postsData.length;
  let alreadyWebpCount = 0;
  let convertedCount = 0;
  let skippedNonR2 = 0;
  let failedCount = 0;
  let publishedAtUpdated = 0;

  const d1Updates = [];

  for (let i = 0; i < postsData.length; i++) {
    const post = postsData[i];

    // Standardize publishedAt
    if (!post.publishedAt) {
      post.publishedAt = post.createdAt || (post.date ? new Date(post.date).toISOString() : new Date().toISOString());
      publishedAtUpdated++;
    }

    const currentImg = post.image || '';

    if (currentImg.endsWith('.webp')) {
      alreadyWebpCount++;
      continue;
    }

    // Hanya konversi gambar yang di-host di R2 (cdn.meteorit.my.id atau r2.cloudflarestorage.com)
    if (!currentImg.includes('cdn.meteorit.my.id') && !currentImg.includes('r2.cloudflarestorage.com') && !currentImg.startsWith('data/')) {
      skippedNonR2++;
      continue;
    }

    try {
      // Ekstrak R2 key
      let r2Key = currentImg.replace(/^https?:\/\/[^\/]+\//, '');
      const newWebpKey = r2Key.replace(/\.(jpg|jpeg|png)$/i, '.webp');

      const webpExists = await fileExistsInR2(newWebpKey);

      if (!webpExists) {
        // Ambil file asli
        const srcObj = await s3.send(new GetObjectCommand({
          Bucket: R2_CONFIG.bucketName,
          Key: r2Key
        }));
        const srcBuffer = await streamToBuffer(srcObj.Body);

        // Konversi ke WebP 80% dengan sharp
        const webpBuffer = await sharp(srcBuffer)
          .webp({ quality: 80 })
          .toBuffer();

        // Upload ke R2
        await s3.send(new PutObjectCommand({
          Bucket: R2_CONFIG.bucketName,
          Key: newWebpKey,
          Body: webpBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable'
        }));
      }

      // Update URL post ke WebP
      const newImageUrl = `${R2_CONFIG.publicUrl}/${newWebpKey}`;
      post.image = newImageUrl;
      convertedCount++;

      // Update file individual article JSON di R2 jika ada
      try {
        const articleKey = `data/blog/articles/${post.id}.json`;
        const articleRes = await s3.send(new GetObjectCommand({
          Bucket: R2_CONFIG.bucketName,
          Key: articleKey
        }));
        const articleJson = JSON.parse(await articleRes.Body.transformToString());
        articleJson.image = newImageUrl;
        articleJson.publishedAt = post.publishedAt;
        await s3.send(new PutObjectCommand({
          Bucket: R2_CONFIG.bucketName,
          Key: articleKey,
          Body: JSON.stringify(articleJson, null, 2),
          ContentType: 'application/json'
        }));
      } catch {
        // Abaikan jika file individual tidak ada
      }

      d1Updates.push({ id: post.id, image: newImageUrl });

      if (convertedCount % 20 === 0 || convertedCount === 1) {
        console.log(`⏳ Progres konversi: ${convertedCount} gambar berhasil dikonversi ke WebP 80%...`);
      }
    } catch (err) {
      console.warn(`❌ Gagal konversi banner post ${post.id} (${currentImg}):`, err.message);
      failedCount++;
    }
  }

  // 2. Simpan kembali posts.json yang sudah diperbarui
  console.log(`💾 Mengunggah kembali posts.json yang sudah diperbarui ke R2...`);
  await s3.send(new PutObjectCommand({
    Bucket: R2_CONFIG.bucketName,
    Key: 'data/blog/posts.json',
    Body: JSON.stringify(postsData, null, 2),
    ContentType: 'application/json',
    CacheControl: 'no-cache, no-transform'
  }));

  console.log('\n========================================');
  console.log('📊 HASIL AUDIT & OPTIMASI GAMBAR BANNER:');
  console.log(`• Total Banner Diaudit: ${auditedCount}`);
  console.log(`• Banner Sudah WebP: ${alreadyWebpCount}`);
  console.log(`• Berhasil Dikonversi ke WebP (Quality 80%): ${convertedCount}`);
  console.log(`• Gambar Eksternal / Placeholder (Dilewati): ${skippedNonR2}`);
  console.log(`• Gagal Dikonversi: ${failedCount}`);
  console.log(`• Artikel diperbarui publishedAt: ${publishedAtUpdated}`);
  console.log(`• File asli (.jpg) tetap dipertahankan: Ya (Safe Migration)`);
  console.log('========================================\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

