const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load environment variables from .env.local
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

const accountId = process.env.R2_ACCOUNT_ID || "5f29e48300ae379ebe15c20185d15ac8";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "cd3b2f027722b69c38f2f9ebf3663228";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "a0ed04760361869f55ebf6a109ddeda9d3de431cefa27faaaf05a2a0f8f5a5d7";
const bucketName = process.env.R2_BUCKET_NAME || "meteorit-indonesia";
const s3Endpoint = process.env.R2_S3_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: s3Endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const TARGET_FILES = [
  'data/meteorites/catalog.json',
  'data/encyclopedia/history.json',
  'data/blog/posts.json'
];

async function migrateFile(key) {
  console.log(`\n[Migrasi] Memproses ${key}...`);
  try {
    const getRes = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    if (!getRes.Body) {
      console.warn(`[Migrasi] Body kosong untuk ${key}`);
      return;
    }

    const content = await getRes.Body.transformToString();
    const count = (content.match(/pub-a60a40fd84104aa089d4cd04cdb98d19\.r2\.dev/g) || []).length;
    console.log(`[Migrasi] Ditemukan ${count} referensi r2.dev di ${key}`);

    if (count === 0) {
      console.log(`[Migrasi] Tidak ada referensi yang perlu diganti.`);
      return;
    }

    const updated = content.replaceAll('pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev', 'cdn.meteorit.my.id');

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: updated,
      ContentType: 'application/json',
    }));

    console.log(`✅ [Migrasi] Berhasil memperbarui ${key} (${count} URL diganti ke cdn.meteorit.my.id)!`);
  } catch (err) {
    console.error(`❌ [Migrasi] Gagal memproses ${key}:`, err);
  }
}

async function run() {
  console.log('=== Memulai Migrasi URL Gambar di R2 ===');
  for (const file of TARGET_FILES) {
    await migrateFile(file);
  }
  console.log('\n=== Migrasi Selesai! ===');
}

run();

