// src/lib/d1Tracker.js
// ============================================================
// Catat riwayat upload video ke Cloudflare D1
// Table: youtube_uploads
// ============================================================

const CF_API_TOKEN  = () => process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = () => process.env.R2_ACCOUNT_ID;
const D1_DB_ID      = () => process.env.CLOUDFLARE_D1_DATABASE_ID;

let tableEnsured = false;

/**
 * Eksekusi query SQL ke Cloudflare D1 via REST API
 */
async function queryD1(sql, params = []) {
  const token     = CF_API_TOKEN();
  const accountId = CF_ACCOUNT_ID();
  const dbId      = D1_DB_ID();

  if (!token || !accountId || !dbId) {
    console.warn('[D1] Credentials tidak lengkap, skip D1 tracking');
    return null;
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'D1 query gagal');
    }

    return data.result?.[0];
  } catch (err) {
    console.warn('[D1] Query gagal:', err.message);
    return null;
  }
}

/**
 * Pastikan tabel youtube_uploads ada
 */
export async function ensureTable() {
  if (tableEnsured) return;
  const sql = `
    CREATE TABLE IF NOT EXISTS youtube_uploads (
      id TEXT PRIMARY KEY,
      youtube_id TEXT NOT NULL,
      youtube_url TEXT,
      shorts_url TEXT,
      title TEXT,
      category TEXT,
      category_emoji TEXT,
      article_id TEXT,
      article_url TEXT,
      uploaded_at TEXT DEFAULT (datetime('now')),
      duration_sec INTEGER,
      views INTEGER DEFAULT 0
    );
  `;
  const result = await queryD1(sql);
  if (result !== null) {
    tableEnsured = true;
    console.log('[D1] Tabel youtube_uploads siap');
  }
}

/**
 * Catat upload berhasil ke D1
 */
export async function recordUpload({ article, category, youtubeResult, duration }) {
  await ensureTable();

  const id          = `yt-${Date.now()}`;
  const articleUrl  = article.articleUrl || `https://www.meteorit.my.id/blog/${article.id}`;
  const uploadedAt  = new Date().toISOString();

  const sql = `
    INSERT OR REPLACE INTO youtube_uploads
    (id, youtube_id, youtube_url, shorts_url, title, category, category_emoji, article_id, article_url, uploaded_at, duration_sec, views)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);
  `;

  const params = [
    id,
    youtubeResult.videoId,
    youtubeResult.watchUrl,
    youtubeResult.youtubeUrl,
    article.title,
    category.name,
    category.emoji,
    article.id,
    articleUrl,
    uploadedAt,
    duration || parseInt(process.env.VIDEO_DURATION_SEC || '55'),
  ];

  const result = await queryD1(sql, params);
  if (result !== null) {
    console.log(`[D1] ✅ Upload tercatat: ${id} → YouTube ${youtubeResult.videoId}`);
  }
  return id;
}

/**
 * Cek apakah artikel sudah pernah diupload (hindari duplikat)
 */
export async function isAlreadyUploaded(articleId) {
  await ensureTable();
  const result = await queryD1(
    `SELECT id FROM youtube_uploads WHERE article_id = ? LIMIT 1;`,
    [articleId]
  );
  return result?.results?.length > 0;
}

/**
 * Cek apakah judul video sudah pernah diupload (hindari duplikat judul)
 */
export async function isTitleAlreadyUploaded(title) {
  await ensureTable();
  const result = await queryD1(
    `SELECT id FROM youtube_uploads WHERE title = ? LIMIT 1;`,
    [title]
  );
  return result?.results?.length > 0;
}

/**
 * Ambil daftar upload terbaru
 */
export async function getRecentUploads(limit = 10) {
  await ensureTable();
  const result = await queryD1(
    `SELECT * FROM youtube_uploads ORDER BY uploaded_at DESC LIMIT ?;`,
    [limit]
  );
  return result?.results || [];
}
