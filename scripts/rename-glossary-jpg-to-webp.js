#!/usr/bin/env node
/**
 * scripts/rename-glossary-jpg-to-webp.js
 * 
 * Script untuk menyalin semua gambar glossary dari .jpg ke .webp di R2.
 * Ini memastikan getTermPhoto() yang sekarang mengembalikan .webp URL bisa berfungsi.
 * 
 * Jalankan: node scripts/rename-glossary-jpg-to-webp.js
 */

const { S3Client, CopyObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET = process.env.R2_BUCKET_NAME || 'meteorit-indonesia';

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error('❌ Set R2_ACCESS_KEY_ID dan R2_SECRET_ACCESS_KEY di environment!');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

async function copyJpgToWebp() {
  console.log('🔍 Listing semua file di data/glossary/images/ ...');

  const list = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: 'data/glossary/images/',
  }));

  const jpgFiles = (list.Contents || []).filter(obj => obj.Key?.endsWith('.jpg'));
  console.log(`📦 Ditemukan ${jpgFiles.length} file .jpg`);

  let copied = 0, skipped = 0, errors = 0;

  for (const obj of jpgFiles) {
    const srcKey = obj.Key;
    const destKey = srcKey.replace(/\.jpg$/, '.webp');

    try {
      await s3.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${srcKey}`,
        Key: destKey,
        ContentType: 'image/webp', // Set content-type ke webp agar browser baca sebagai webp
        MetadataDirective: 'REPLACE',
      }));
      console.log(`  ✅ ${srcKey} → ${destKey}`);
      copied++;
    } catch (err) {
      console.error(`  ❌ Gagal copy ${srcKey}:`, err.message);
      errors++;
    }
  }

  console.log(`\n✅ Selesai: ${copied} copied, ${skipped} skipped, ${errors} errors`);
}

copyJpgToWebp().catch(console.error);

