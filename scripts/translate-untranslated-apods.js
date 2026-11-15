const fs = require('fs');
const path = require('path');
const https = require('https');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
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
  credentials: { accessKeyId, secretAccessKey },
});

function translateTextGoogle(text, targetLang = 'id') {
  return new Promise((resolve) => {
    if (!text || text.trim() === '') return resolve('');
    const cleanText = text.replace(/^Explanation:\s*/i, '').trim();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanText)}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const sentences = json[0];
          if (Array.isArray(sentences)) {
            const translated = sentences.map(s => s[0]).join('').trim();
            if (translated) return resolve('Penjelasan: ' + translated);
          }
        } catch {}
        resolve(text);
      });
    }).on('error', () => resolve(text));
  });
}

function translateTitleGoogle(title, targetLang = 'id') {
  return new Promise((resolve) => {
    if (!title || title.trim() === '') return resolve('');
    const cleanTitle = title.replace(/^APOD:\s*\d{4}\s*\w+\s*\d+\s*[–—\-]\s*/i, '').trim();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanTitle)}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const sentences = json[0];
          if (Array.isArray(sentences)) {
            const translated = sentences.map(s => s[0]).join('').trim();
            if (translated) return resolve(translated);
          }
        } catch {}
        resolve(title);
      });
    }).on('error', () => resolve(title));
  });
}

async function run() {
  console.log('=== Memulai Auto-Translate APOD ke Bahasa Indonesia ===');
  
  const getRes = await s3Client.send(new GetObjectCommand({
    Bucket: bucketName,
    Key: 'data/encyclopedia/history.json',
  }));
  const rawJson = await getRes.Body.transformToString();
  const historyList = JSON.parse(rawJson);

  let updatedCount = 0;

  for (const item of historyList) {
    const enExpl = item.explanation?.en || '';
    const idExpl = item.explanation?.id || '';

    // Cek jika teks Indonesia sama dengan bahasa Inggris atau masih berbahasa Inggris
    const needsTranslation = !idExpl || idExpl.trim().slice(0, 50) === enExpl.trim().slice(0, 50) || idExpl.startsWith('Explanation:');

    if (needsTranslation && enExpl) {
      console.log(`\n⏳ Menerjemahkan APOD ${item.id}: "${item.title?.en}"...`);
      const transTitle = await translateTitleGoogle(item.title?.en || item.title?.id || '');
      const transExpl = await translateTextGoogle(enExpl);

      item.title = item.title || {};
      item.title.id = transTitle;
      item.explanation = item.explanation || {};
      item.explanation.id = transExpl;

      updatedCount++;
      console.log(`   ✅ Judul ID: ${transTitle}`);
      console.log(`   ✅ Cuplikan: ${transExpl.slice(0, 100)}...`);

      // Jeda kecil agar tidak terkena rate-limit
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n🎉 Selesai menerjemahkan ${updatedCount} artikel APOD! Menyimpan ke Cloudflare R2...`);

  // Simpan history.json
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'data/encyclopedia/history.json',
    Body: JSON.stringify(historyList, null, 2),
    ContentType: 'application/json',
  }));
  console.log('✅ data/encyclopedia/history.json berhasil diperbarui di R2.');

  // Update latest.json dengan item paling baru
  if (historyList.length > 0) {
    const latest = historyList[0];
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: 'data/encyclopedia/latest.json',
      Body: JSON.stringify(latest, null, 2),
      ContentType: 'application/json',
    }));
    console.log(`✅ data/encyclopedia/latest.json berhasil diperbarui di R2 (${latest.id}: ${latest.title?.id}).`);
  }
}

run();

