/**
 * scripts/copy-glossary-jpg-webp-fetch.mjs
 * Copy semua .jpg glosarium di R2 ke .webp menggunakan CF R2 REST API + AWS Signature v4
 * 
 * Jalankan: node scripts/copy-glossary-jpg-webp-fetch.mjs
 */

import { createHmac, createHash } from 'node:crypto';

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET = process.env.R2_BUCKET_NAME || 'meteorit-indonesia';
const ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const PREFIX = 'data/glossary/images/';

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('❌ Set R2_ACCESS_KEY_ID dan R2_SECRET_ACCESS_KEY!');
  process.exit(1);
}

function hmac(key, data, encoding = undefined) {
  return createHmac('sha256', key).update(data, 'utf8').digest(encoding || undefined);
}
function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = hmac('AWS4' + key, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  const kSigning = hmac(kService, 'aws4_request');
  return kSigning;
}

function buildHeaders(method, path, extraHeaders = {}, payload = '') {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const payloadHash = sha256(payload);

  const allHeaders = {
    host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    ...extraHeaders,
  };

  const sortedKeys = Object.keys(allHeaders).sort();
  const canonicalHeaders = sortedKeys.map(k => `${k}:${allHeaders[k]}\n`).join('');
  const signedHeaders = sortedKeys.join(';');

  const canonicalRequest = [
    method,
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join('\n');

  const signingKey = getSignatureKey(SECRET_KEY, dateStamp, region, service);
  const signature = hmac(signingKey, stringToSign, 'hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    Authorization: authHeader,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    host,
    ...extraHeaders,
  };
}

async function listObjects(prefix) {
  const path = `/${BUCKET}?list-type=2&prefix=${encodeURIComponent(prefix)}`;
  const headers = buildHeaders('GET', path.split('?')[0], {}, '');
  const url = `${ENDPOINT}${path}`;
  
  const res = await fetch(url, { 
    method: 'GET', 
    headers: { ...headers, 'User-Agent': 'meteorit-script/1.0' }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`List failed ${res.status}: ${txt.slice(0, 300)}`);
  }
  const xml = await res.text();
  // Parse keys from XML
  const keys = [];
  const regex = /<Key>([^<]+)<\/Key>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

async function getObject(key) {
  const path = `/${BUCKET}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  const headers = buildHeaders('GET', path, {}, '');
  const url = `${ENDPOINT}${path}`;
  const res = await fetch(url, { method: 'GET', headers: { ...headers, 'User-Agent': 'meteorit-script/1.0' } });
  if (!res.ok) {
    throw new Error(`GET ${key} failed: ${res.status}`);
  }
  return res.arrayBuffer();
}

async function putObject(key, body, contentType) {
  const path = `/${BUCKET}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  const bodyBytes = Buffer.from(body);
  const headers = buildHeaders('PUT', path, {
    'content-type': contentType,
    'content-length': String(bodyBytes.byteLength),
  }, '');
  const url = `${ENDPOINT}${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'User-Agent': 'meteorit-script/1.0' },
    body: bodyBytes,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PUT ${key} failed ${res.status}: ${txt.slice(0, 300)}`);
  }
  return true;
}

async function main() {
  console.log('🔍 Listing semua file di data/glossary/images/ ...');
  const allKeys = await listObjects(PREFIX);
  const jpgKeys = allKeys.filter(k => k.endsWith('.jpg'));
  console.log(`📦 Ditemukan ${jpgKeys.length} file .jpg`);

  let copied = 0, skipped = 0, errors = 0;

  for (const srcKey of jpgKeys) {
    const destKey = srcKey.replace(/\.jpg$/, '.webp');
    // Skip jika sudah ada webp
    const alreadyExists = allKeys.includes(destKey);
    if (alreadyExists) {
      console.log(`  ⏭️  Skip (sudah ada): ${destKey}`);
      skipped++;
      continue;
    }

    try {
      // Download JPG
      const buffer = await getObject(srcKey);
      // Upload sebagai webp (dengan content-type image/webp — CF R2 serve berdasarkan content-type)
      await putObject(destKey, buffer, 'image/webp');
      console.log(`  ✅ ${srcKey} → ${destKey} (${Math.round(buffer.byteLength / 1024)}KB)`);
      copied++;
    } catch (err) {
      console.error(`  ❌ Gagal: ${srcKey}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Selesai: ${copied} copied, ${skipped} skipped, ${errors} errors`);
  console.log(`\n🌐 Contoh URL WebP:`);
  if (jpgKeys[0]) {
    const ex = jpgKeys[0].replace('.jpg', '.webp');
    console.log(`   https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev/${ex}`);
  }
}

main().catch(console.error);

