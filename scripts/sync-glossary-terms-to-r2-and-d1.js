const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { execSync } = require('child_process');

// Read env variables
const envContent = fs.readFileSync('.env', 'utf8') + '\n' + (fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '');
function getEnv(k) {
  const m = envContent.match(new RegExp(`^${k}=(.*)`, 'm'));
  if (!m) return '';
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  return v;
}

const accountId = getEnv('R2_ACCOUNT_ID') || '5f29e48300ae379ebe15c20185d15ac8';
const accessKeyId = getEnv('R2_ACCESS_KEY_ID') || 'cd3b2f027722b69c38f2f9ebf3663228';
const secretAccessKey = getEnv('R2_SECRET_ACCESS_KEY') || 'a0ed04760361869f55ebf6a109ddeda9d3de431cefa27faaaf05a2a0f8f5a5d7';
const bucketName = getEnv('R2_BUCKET_NAME') || 'meteorit-indonesia';
const d1DatabaseId = getEnv('CLOUDFLARE_D1_DATABASE_ID') || 'c0ad9039-d1e4-4c01-856d-5d5971514255';
const cfApiToken = getEnv('CLOUDFLARE_API_TOKEN');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey }
});

async function queryD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${d1DatabaseId}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfApiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });
  return res.json();
}

async function main() {
  console.log('Extracting glossarySeed from src/lib/glossaryData.ts...');
  
  const runner = `
    const { getGlossarySeed } = require('./src/lib/glossaryData');
    console.log(JSON.stringify(getGlossarySeed()));
  `;
  
  // Use ts-node via command line
  const cmd = `node --loader ts-node/esm --no-warnings -e "import { getGlossarySeed } from './src/lib/glossaryData.ts'; console.log(JSON.stringify(getGlossarySeed()));"`;
  let termsJson;
  try {
    termsJson = execSync('npx tsx -e "import { getGlossarySeed } from \'./src/lib/glossaryData\'; console.log(JSON.stringify(getGlossarySeed()));"').toString();
  } catch (err) {
    termsJson = execSync(cmd).toString();
  }

  const terms = JSON.parse(termsJson.trim());
  console.log(`Successfully extracted ${terms.length} terms.`);
  console.log(`Sample image URL for ${terms[0].id}: ${terms[0].image}`);

  // 1. Upload to R2: data/glossary/terms.json
  console.log('Uploading terms.json to R2 (data/glossary/terms.json)...');
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'data/glossary/terms.json',
    Body: JSON.stringify(terms, null, 2),
    ContentType: 'application/json',
    CacheControl: 'public, max-age=3600, s-maxage=86400'
  }));
  console.log('Uploaded data/glossary/terms.json to R2 successfully.');

  // 2. Sync to Cloudflare D1
  console.log('Syncing terms to Cloudflare D1...');
  for (const t of terms) {
    await queryD1(
      'INSERT OR REPLACE INTO glossary_terms (id, term, definition, translations) VALUES (?, ?, ?, ?)',
      [t.id, t.term.id || t.term.en, t.definition.id || t.definition.en, JSON.stringify(t)]
    );
  }
  console.log('All terms synced to Cloudflare D1 successfully!');
}

main().catch(console.error);
