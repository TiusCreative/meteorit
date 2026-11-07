#!/usr/bin/env node

/**
 * Script untuk memformat seluruh environment variables dari .env.local
 * ke format yang siap di-import/copy-paste ke Cloudflare Pages Dashboard.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const outputPath = path.resolve(process.cwd(), '.env.cloudflare');

if (!fs.existsSync(envPath)) {
  console.error("❌ Berkas .env.local tidak ditemukan!");
  process.exit(1);
}

const lines = fs.readFileSync(envPath, 'utf8').split('\n');
const envMap = {};

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const eqIdx = line.indexOf('=');
  if (eqIdx === -1) continue;
  
  const key = line.slice(0, eqIdx).trim();
  let val = line.slice(eqIdx + 1).trim();

  // Bersihkan quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }

  // Khusus NODE_VERSION dan COMPATIBILITY untuk Cloudflare
  envMap[key] = val;
}

// Tambahkan setting wajib untuk Cloudflare Pages
envMap['NODE_VERSION'] = '20.18.0';
envMap['NEXT_PUBLIC_SITE_URL'] = envMap['NEXT_PUBLIC_SITE_URL'] || 'https://meteorit.my.id';

const outputLines = Object.entries(envMap).map(([k, v]) => `${k}=${v}`);
fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf8');

console.log(`✅ Berhasil membuat berkas .env.cloudflare dengan ${outputLines.length} variables.`);
console.log(`📁 Lokasi berkas: ${outputPath}`);

