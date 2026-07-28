// src/lib/r2Client.js
// ============================================================
// Mengambil artikel dan gambar dari Cloudflare R2
// Bucket utama: meteorit-indonesia (milik meteorit.my.id)
// ============================================================
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const R2_ACCOUNT_ID   = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY   = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY   = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME  = process.env.R2_BUCKET_NAME || 'meteorit-indonesia';
const R2_PUBLIC_URL   = process.env.R2_PUBLIC_URL || 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// ─── Helper: Stream to Buffer ─────────────────────────────
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ─── Helper: Stream to String ─────────────────────────────
async function streamToString(stream) {
  const buf = await streamToBuffer(stream);
  return buf.toString('utf-8');
}

// ─── Fetch JSON dari R2 ───────────────────────────────────
export async function fetchJsonFromR2(key) {
  try {
    const cmd = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
    const res = await s3.send(cmd);
    const text = await streamToString(res.Body);
    return JSON.parse(text);
  } catch (err) {
    if (err.name === 'NoSuchKey') return null;
    console.error(`[R2] Gagal fetch JSON: ${key}`, err.message);
    return null;
  }
}

// ─── Upload Buffer ke R2 ──────────────────────────────────
export async function uploadToR2(key, body, contentType = 'application/octet-stream') {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await s3.send(cmd);
  return `${R2_PUBLIC_URL}/${key}`;
}

// ─── Upload File dari Path ────────────────────────────────
export async function uploadFileToR2(key, filePath, contentType = 'video/mp4') {
  const fileBuffer = fs.readFileSync(filePath);
  return uploadToR2(key, fileBuffer, contentType);
}

// ─── Hapus File dari R2 ───────────────────────────────────
export async function deleteFromR2(key) {
  try {
    const cmd = new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
    await s3.send(cmd);
    console.log(`[R2] Dihapus: ${key}`);
    return true;
  } catch (err) {
    console.error(`[R2] Gagal hapus: ${key}`, err.message);
    return false;
  }
}

// ─── Download gambar dari URL ke file lokal ───────────────
export async function downloadImageFromUrl(imageUrl, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = imageUrl.startsWith('https') ? https : http;

    protocol.get(imageUrl, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ─── Download gambar dari R2 ke file lokal ───────────────
export async function downloadImageFromR2(key, destPath) {
  try {
    const cmd = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
    const res = await s3.send(cmd);
    const buf = await streamToBuffer(res.Body);
    fs.writeFileSync(destPath, buf);
    return destPath;
  } catch (err) {
    console.error(`[R2] Gagal download gambar: ${key}`, err.message);
    return null;
  }
}

/**
 * Ambil daftar artikel dari R2 berdasarkan kategori
 * @param {Object} category - Kategori dari categoryRotation.js
 * @param {number} limit - Jumlah artikel yang diinginkan
 * @returns {Array} Daftar artikel yang difilter
 */
export async function getArticlesByCategory(category, limit = 5) {
  // Ambil daftar posts dari R2
  const posts = await fetchJsonFromR2('data/blog/posts.json');
  if (!posts || !Array.isArray(posts)) {
    console.warn('[R2] posts.json tidak ditemukan atau kosong');
    return [];
  }

  // Filter berdasarkan kategori
  let filtered = posts.filter(post => {
    // Cek apakah ID artikel cocok dengan prefix kategori
    const matchesPrefix = category.r2Prefix.some(prefix =>
      post.id && post.id.startsWith(prefix)
    );

    // Atau cek berdasarkan kategori artikel
    const matchesCategory = category.r2Categories.some(cat =>
      post.category && post.category.toLowerCase().includes(cat.toLowerCase())
    );

    return matchesPrefix || matchesCategory;
  });

  // Urutkan dari terbaru
  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Jika kategori APOD, coba juga ambil dari encyclopedia
  if (category.id === 'apod' && filtered.length === 0) {
    const apodLatest = await fetchJsonFromR2('data/encyclopedia/latest.json');
    if (apodLatest) {
      filtered = [{
        id: `apod-${apodLatest.id}`,
        title: apodLatest.title?.id || apodLatest.title?.en || 'NASA APOD',
        excerpt: apodLatest.explanation?.id?.substring(0, 200) || '',
        content: apodLatest.explanation?.id || apodLatest.explanation?.en || '',
        image: apodLatest.image_url,
        category: 'APOD',
        createdAt: apodLatest.processedAt,
        date: apodLatest.id,
        articleUrl: `https://www.meteorit.my.id/apod/${apodLatest.id}`,
      }];
    }
  }

  // Fallback: ambil artikel umum jika kategori kosong
  if (filtered.length === 0) {
    console.warn(`[R2] Tidak ada artikel untuk kategori "${category.name}", pakai fallback artikel umum`);
    filtered = posts.filter(p => p.status === 'Published')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  // Deduplikasi berdasarkan ID dan Judul (Title)
  const uniqueFiltered = [];
  const seenIds = new Set();
  const seenTitles = new Set();
  for (const post of filtered) {
    if (!post.id) continue;
    const cleanTitle = (post.title || '').trim().toLowerCase();
    if (seenIds.has(post.id) || seenTitles.has(cleanTitle)) {
      continue;
    }
    seenIds.add(post.id);
    seenTitles.add(cleanTitle);
    uniqueFiltered.push(post);
  }
  filtered = uniqueFiltered;

  return filtered.slice(0, limit);
}

/**
 * Ambil detail artikel dari R2 berdasarkan ID
 */
export async function getArticleDetail(articleId) {
  // Coba path yang berbeda-beda
  const paths = [
    `data/blog/articles/${articleId}.json`,
    `data/komet/articles/${articleId}.json`,
    `data/fireball/articles/${articleId}.json`,
  ];

  for (const p of paths) {
    const article = await fetchJsonFromR2(p);
    if (article) return article;
  }

  return null;
}

/**
 * Ambil URL publik file R2
 */
export function getPublicUrl(key) {
  return `${R2_PUBLIC_URL}/${key}`;
}
