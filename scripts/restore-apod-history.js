const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// 1. Read environment variables from .env.local and .env
const envLocal = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';

function getEnv(key) {
  let m = envLocal.match(new RegExp(`^${key}=(.*)`, 'm'));
  if (!m) m = envFile.match(new RegExp(`^${key}=(.*)`, 'm'));
  if (!m) return '';
  let v = m[1].trim();
  while (v.startsWith('"') || v.startsWith("'")) v = v.slice(1);
  while (v.endsWith('"') || v.endsWith("'")) v = v.slice(0, -1);
  return v;
}

const projectId = getEnv('FIREBASE_ADMIN_PROJECT_ID');
const clientEmail = getEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
let privateKey = getEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n');
if (!privateKey.includes('-----END PRIVATE KEY-----')) {
  privateKey = privateKey.trim() + '\n-----END PRIVATE KEY-----\n';
}

const r2AccountId = getEnv('R2_ACCOUNT_ID') || '5f29e48300ae379ebe15c20185d15ac8';
const r2AccessKeyId = getEnv('R2_ACCESS_KEY_ID');
const r2SecretAccessKey = getEnv('R2_SECRET_ACCESS_KEY');
const r2BucketName = getEnv('R2_BUCKET_NAME') || 'meteorit-indonesia';

const cfApiToken = getEnv('CLOUDFLARE_API_TOKEN');
const d1DatabaseId = getEnv('CLOUDFLARE_D1_DATABASE_ID') || 'c0ad9039-d1e4-4c01-856d-5d5971514255';

async function main() {
  console.log('[Restore APOD] Inisialisasi Firebase Admin...');
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });

  const db = admin.firestore();
  console.log('[Restore APOD] Mengambil data apod_history dari Firestore...');
  const snap = await db.collection('apod_history').get();
  console.log(`[Restore APOD] Ditemukan ${snap.size} dokumen di Firestore.`);

  const apodMap = new Map();

  snap.docs.forEach(doc => {
    const data = doc.data();
    apodMap.set(doc.id, {
      id: doc.id,
      title: data.title || { en: '', id: '' },
      explanation: data.explanation || { en: '', id: '' },
      image_url: data.image_url || '',
      copyright: data.copyright || 'NASA Public Domain',
      media_type: data.media_type || 'image',
      processedAt: data.processedAt || new Date().toISOString(),
      source: data.source || 'nasa-api'
    });
  });

  // Fetch latest.json from CDN to include 2026-11-07 if exists
  try {
    const res = await fetch('https://cdn.meteorit.my.id/data/encyclopedia/latest.json');
    if (res.ok) {
      const latest = await res.json();
      if (latest && latest.id) {
        console.log(`[Restore APOD] Menambahkan item latest dari CDN: ${latest.id}`);
        apodMap.set(latest.id, latest);
      }
    }
  } catch (err) {
    console.warn('[Restore APOD] Gagal fetch latest.json:', err.message);
  }

  // Convert to array and sort descending by id (date)
  const allApods = Array.from(apodMap.values());
  allApods.sort((a, b) => b.id.localeCompare(a.id));
  console.log(`[Restore APOD] Total artikel APOD setelah digabung: ${allApods.length}`);

  // 1. Simpan ke file lokal untuk backup
  fs.mkdirSync('data/encyclopedia', { recursive: true });
  fs.writeFileSync('data/encyclopedia/history.json', JSON.stringify(allApods, null, 2), 'utf8');
  fs.writeFileSync('data/encyclopedia/latest.json', JSON.stringify(allApods[0], null, 2), 'utf8');
  console.log('[Restore APOD] Berhasil simpan backup lokal data/encyclopedia/history.json');

  // 2. Upload ke Cloudflare R2
  console.log('[Restore APOD] Mengunggah ke Cloudflare R2...');
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  await s3.send(new PutObjectCommand({
    Bucket: r2BucketName,
    Key: 'data/encyclopedia/history.json',
    Body: JSON.stringify(allApods, null, 2),
    ContentType: 'application/json'
  }));

  await s3.send(new PutObjectCommand({
    Bucket: r2BucketName,
    Key: 'data/encyclopedia/latest.json',
    Body: JSON.stringify(allApods[0], null, 2),
    ContentType: 'application/json'
  }));
  console.log('[Restore APOD] Berhasil upload data/encyclopedia/history.json & latest.json ke R2!');

  // 3. Simpan ke Cloudflare D1
  console.log('[Restore APOD] Menyinkronkan ke Cloudflare D1 table apod_history...');
  const d1Url = `https://api.cloudflare.com/client/v4/accounts/${r2AccountId}/d1/database/${d1DatabaseId}/query`;

  let syncedD1 = 0;
  for (const item of allApods) {
    const titleStr = typeof item.title === 'object' ? JSON.stringify(item.title) : String(item.title || '');
    const expStr = typeof item.explanation === 'object' ? JSON.stringify(item.explanation) : String(item.explanation || '');
    const transStr = JSON.stringify(item.translations || {});

    try {
      const d1Res = await fetch(d1Url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: `INSERT OR REPLACE INTO apod_history (id, date, title, explanation, image_url, translations, processedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          params: [item.id, item.id, titleStr, expStr, item.image_url || '', transStr, item.processedAt || new Date().toISOString()]
        })
      });

      if (d1Res.ok) {
        syncedD1++;
      } else {
        const errText = await d1Res.text();
        console.warn(`[Restore APOD] D1 gagal item ${item.id}:`, errText);
      }
    } catch (e) {
      console.warn(`[Restore APOD] D1 request error item ${item.id}:`, e.message);
    }
  }

  console.log(`[Restore APOD] Selesai menyinkronkan ke D1: ${syncedD1}/${allApods.length} baris.`);
  console.log('[Restore APOD] Selesai dengan sukses!');
  process.exit(0);
}

main().catch(err => {
  console.error('[Restore APOD] Fatal error:', err);
  process.exit(1);
});
