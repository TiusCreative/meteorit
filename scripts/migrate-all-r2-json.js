const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
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

async function listAllJsonKeys() {
  let continuationToken;
  const keys = [];
  do {
    const res = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    }));
    (res.Contents || []).forEach(item => {
      if (item.Key && (item.Key.endsWith('.json') || item.Key.endsWith('.xml'))) {
        keys.push(item.Key);
      }
    });
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

async function processKey(key) {
  try {
    const getRes = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    if (!getRes.Body) return 0;
    const content = await getRes.Body.transformToString();
    if (!content.includes('pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev')) {
      return 0;
    }

    const matches = (content.match(/pub-a60a40fd84104aa089d4cd04cdb98d19\.r2\.dev/g) || []).length;
    const updated = content.replaceAll('pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev', 'cdn.meteorit.my.id');

    const contentType = key.endsWith('.xml') ? 'application/xml' : 'application/json';

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: updated,
      ContentType: contentType,
    }));

    console.log(`✅ [Migrasi] ${key} -> ${matches} URL diperbarui.`);
    return matches;
  } catch (err) {
    console.error(`❌ [Migrasi Error] ${key}:`, err.message);
    return 0;
  }
}

async function run() {
  console.log('=== Memindai semua file JSON & XML di Cloudflare R2 ===');
  const allKeys = await listAllJsonKeys();
  console.log(`Ditemukan total ${allKeys.length} file.`);

  let totalUpdated = 0;
  let filesModified = 0;

  // Process in batches of 15 concurrent requests
  const BATCH_SIZE = 15;
  for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
    const batch = allKeys.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(k => processKey(k)));
    for (const r of results) {
      if (r > 0) {
        totalUpdated += r;
        filesModified += 1;
      }
    }
  }

  console.log(`\n🎉 SELESAI: ${filesModified} file dimodifikasi, ${totalUpdated} URL diganti ke cdn.meteorit.my.id!`);
}

run();
