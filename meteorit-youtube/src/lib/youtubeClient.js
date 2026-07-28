// src/lib/youtubeClient.js
// ============================================================
// YouTube Data API v3 Client
// - Refresh OAuth token otomatis
// - Upload video ke YouTube
// - Set thumbnail kustom
// - Update YOUTUBE_TOKEN_JSON di GitHub Actions (opsional)
// ============================================================
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI  = 'http://localhost:3030/callback';

/**
 * Buat OAuth2 client dengan token yang tersimpan
 */
function createOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  // Ambil token dari environment variable (GitHub Secrets)
  const tokenJson = process.env.YOUTUBE_TOKEN_JSON;
  if (!tokenJson) {
    throw new Error('YOUTUBE_TOKEN_JSON tidak ditemukan. Jalankan: node scripts/youtube-auth.js');
  }

  let tokens;
  try {
    tokens = JSON.parse(tokenJson);
  } catch {
    throw new Error('YOUTUBE_TOKEN_JSON tidak valid (bukan JSON). Jalankan ulang: node scripts/youtube-auth.js');
  }

  oauth2Client.setCredentials(tokens);

  // Auto-refresh token jika expired
  oauth2Client.on('tokens', (newTokens) => {
    if (newTokens.refresh_token) {
      console.log('[YouTube] ♻️ Refresh token baru diterima');
    }
    // Simpan token baru untuk run berikutnya (via env atau file lokal)
    const updatedTokens = { ...tokens, ...newTokens };
    console.log('[YouTube] 🔑 Token diperbarui, expiry:', new Date(updatedTokens.expiry_date).toISOString());

    // Di GitHub Actions, token baru disimpan sebagai output untuk next run
    if (process.env.GITHUB_OUTPUT) {
      const output = `YOUTUBE_TOKEN_JSON=${JSON.stringify(updatedTokens)}\n`;
      fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
    }
  });

  return oauth2Client;
}

/**
 * Upload video ke YouTube
 * @param {Object} options
 * @param {string} options.videoPath - Path file video .mp4
 * @param {string} options.title - Judul YouTube (max 100 karakter)
 * @param {string} options.description - Deskripsi lengkap
 * @param {string[]} options.tags - Array tag/keyword
 * @param {string} options.categoryId - ID kategori YouTube (28 = Science & Technology)
 * @param {boolean} options.isShorts - Apakah ini YouTube Shorts (default: true)
 * @returns {Object} { videoId, youtubeUrl, thumbnailUrl }
 */
export async function uploadToYouTube({ videoPath, title, description, tags = [], categoryId = '28', isShorts = true }) {
  const auth = createOAuth2Client();
  const youtube = google.youtube({ version: 'v3', auth });

  // Validasi file
  if (!fs.existsSync(videoPath)) {
    throw new Error(`File video tidak ditemukan: ${videoPath}`);
  }

  const stat = fs.statSync(videoPath);
  const fileSizeMB = (stat.size / 1024 / 1024).toFixed(1);
  console.log(`[YouTube] Upload video: ${path.basename(videoPath)} (${fileSizeMB} MB)`);

  // Batasi judul max 100 karakter
  const safeTitle = title.substring(0, 100);

  // Tag standar + tag kustom
  const allTags = [
    ...tags,
    'astronomi', 'nasa', 'luarangkasa', 'meteorit', 'sains',
    'indonesiaastromi', 'faktaluarangkasa', 'shorts',
  ].slice(0, 30); // YouTube max 30 tag

  try {
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: safeTitle,
          description: description,
          tags: allTags,
          categoryId: categoryId,
          defaultAudioLanguage: 'id',
          defaultLanguage: 'id',
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          madeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    }, {
      // Monitoring progress upload
      onUploadProgress: (evt) => {
        const progress = Math.round((evt.bytesRead / stat.size) * 100);
        if (progress % 20 === 0) {
          console.log(`[YouTube] Upload progress: ${progress}% (${(evt.bytesRead / 1024 / 1024).toFixed(1)} MB)`);
        }
      },
    });

    const videoId = response.data.id;
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const shortsUrl = `https://www.youtube.com/shorts/${videoId}`;

    console.log(`[YouTube] ✅ Upload berhasil!`);
    console.log(`[YouTube] Video ID: ${videoId}`);
    console.log(`[YouTube] URL: ${isShorts ? shortsUrl : youtubeUrl}`);

    return {
      videoId,
      youtubeUrl: isShorts ? shortsUrl : youtubeUrl,
      watchUrl: youtubeUrl,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    };
  } catch (err) {
    if (err.code === 403) {
      console.error('[YouTube] ❌ Quota habis atau akses ditolak. Cek quota di Google Cloud Console.');
    } else if (err.code === 401) {
      console.error('[YouTube] ❌ Token tidak valid. Jalankan ulang: node scripts/youtube-auth.js');
    }
    throw new Error(`YouTube upload gagal: ${err.message}`);
  }
}

/**
 * Set thumbnail kustom untuk video
 * @param {string} videoId - ID video YouTube
 * @param {string} thumbnailPath - Path gambar thumbnail
 */
export async function setThumbnail(videoId, thumbnailPath) {
  if (!thumbnailPath || !fs.existsSync(thumbnailPath)) {
    console.warn('[YouTube] Thumbnail tidak ditemukan, skip set thumbnail');
    return false;
  }

  try {
    const auth = createOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth });

    const ext = path.extname(thumbnailPath).toLowerCase();
    const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        mimeType: mimeType,
        body: fs.createReadStream(thumbnailPath),
      },
    });

    console.log(`[YouTube] ✅ Thumbnail berhasil diset untuk video: ${videoId}`);
    return true;
  } catch (err) {
    // Set thumbnail butuh channel terverifikasi; lewati jika gagal
    console.warn(`[YouTube] ⚠️ Gagal set thumbnail (channel mungkin belum terverifikasi): ${err.message}`);
    return false;
  }
}

/**
 * Cek quota yang tersisa (perkiraan)
 * YouTube API tidak menyediakan endpoint untuk cek quota langsung
 */
export function estimateQuotaUsage(videoCount = 2) {
  const quotaPerUpload = 1600; // unit per video upload
  const dailyQuota = 10000;    // default quota harian
  const used = videoCount * quotaPerUpload;
  const remaining = dailyQuota - used;

  return {
    quotaPerUpload,
    dailyQuota,
    used,
    remaining,
    percentage: ((used / dailyQuota) * 100).toFixed(1),
    safeToUpload: remaining > quotaPerUpload,
  };
}
