// main.js
// ============================================================
// Entry Point Utama — YouTube Shorts Automation
// Dijalankan oleh GitHub Actions setiap hari 07:00 WIB
//
// Alur:
// 1. Tentukan kategori hari ini (rotasi 9 kategori)
// 2. Ambil 2 artikel terbaru dari R2 (kategori hari ini)
// 3. Untuk setiap artikel:
//    a. Generate narasi 8 kalimat via Groq AI
//    b. Download gambar artikel dari R2
//    c. Render video Shorts 1080×1920 via FFmpeg
//    d. Upload ke R2 transit
//    e. Upload ke YouTube
//    f. Hapus transit R2
//    g. Catat ke D1
//    h. Notif Telegram
// 4. Laporan harian
// ============================================================
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as os from 'os';

// Bypass SSL verification in future sandbox environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { getTodayCategory, previewSchedule } from './src/lib/categoryRotation.js';
import { getArticlesByCategory, downloadImageFromUrl, uploadFileToR2, deleteFromR2, getPublicUrl } from './src/lib/r2Client.js';
import { generateNarration, generateYouTubeTitle } from './src/lib/groqNarration.js';
import { renderShorts, createThumbnail, checkFFmpeg } from './src/lib/ffmpegRenderer.js';
import { uploadToYouTube, setThumbnail, estimateQuotaUsage } from './src/lib/youtubeClient.js';
import { notifySuccess, notifyError, notifyDailyReport, notifyNoArticles } from './src/lib/telegramNotifier.js';
import { recordUpload, isAlreadyUploaded, isTitleAlreadyUploaded } from './src/lib/d1Tracker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR   = path.join(os.tmpdir(), 'meteorit-shorts');
const MAX_VIDEOS = parseInt(process.env.MAX_VIDEOS_PER_DAY || '2');
const DRY_RUN    = process.argv.includes('--dry-run');

// Pastikan direktori temp ada
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

/**
 * Cleanup file temp setelah selesai
 */
function cleanupTemp(files) {
  for (const f of files) {
    try {
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
    } catch {}
  }
}

/**
 * Proses 1 artikel: render + upload
 */
async function processArticle(article, category, videoIndex, totalVideos) {
  const tempFiles = [];
  let r2TransitKey = null;

  try {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🎬 Video ${videoIndex}/${totalVideos}: ${article.title}`);
    console.log(`${'═'.repeat(60)}`);

    // Generate judul YouTube
    const youtubeTitle = await generateYouTubeTitle(article, category);

    // Cek duplikat
    const alreadyUploaded = await isAlreadyUploaded(article.id);
    if (alreadyUploaded) {
      console.log(`[Main] ⏭️ Artikel sudah diupload sebelumnya, skip: ${article.id}`);
      return 'skipped';
    }

    const titleAlreadyUploaded = await isTitleAlreadyUploaded(youtubeTitle);
    if (titleAlreadyUploaded) {
      console.log(`[Main] ⏭️ Judul video sudah diupload sebelumnya, skip: ${youtubeTitle}`);
      return 'skipped';
    }

    // ─── Step 1: Download gambar artikel ─────────────────────
    console.log(`\n[Step 1/6] 📥 Download gambar...`);
    const imageExt  = article.image?.includes('.png') ? 'png' : 'jpg';
    const imagePath = path.join(TMP_DIR, `image-${Date.now()}.${imageExt}`);
    tempFiles.push(imagePath);

    // Gambar bisa dari URL R2 publik atau path lokal
    if (article.image && article.image.startsWith('http')) {
      await downloadImageFromUrl(article.image, imagePath);
    } else {
      // Gambar tidak ada, buat solid color background
      console.warn('[Main] Gambar tidak ditemukan, buat background default');
      const fallbackCmd = `ffmpeg -y -f lavfi -i "color=#0a0a1a:s=1080x1920" -frames:v 1 "${imagePath}"`;
      const { execSync } = await import('child_process');
      execSync(fallbackCmd, { stdio: 'pipe' });
    }
    console.log(`[Step 1/6] ✅ Gambar siap: ${path.basename(imagePath)}`);

    // ─── Step 2: Generate narasi AI ──────────────────────────
    console.log(`\n[Step 2/6] 🤖 Generate narasi AI (Groq)...`);
    const narrationResult = await generateNarration(article, category);
    const { lines: narrationLines, youtubeDescription } = narrationResult;
    console.log(`[Step 2/6] ✅ ${narrationLines.length} kalimat narasi siap`);
    narrationLines.forEach((l, i) => console.log(`   ${i + 1}. ${l}`));

    // ─── Step 3: Render video FFmpeg ──────────────────────────
    console.log(`\n[Step 3/6] 🎬 Render video FFmpeg...`);
    const videoPath     = path.join(TMP_DIR, `shorts-${Date.now()}.mp4`);
    const thumbnailPath = path.join(TMP_DIR, `thumb-${Date.now()}.jpg`);
    tempFiles.push(videoPath, thumbnailPath);

    if (DRY_RUN) {
      console.log(`[DRY RUN] Akan render: ${path.basename(videoPath)}`);
      console.log(`[DRY RUN] Judul YouTube: ${youtubeTitle}`);
      console.log(`[DRY RUN] Deskripsi (150 karakter pertama): ${youtubeDescription.substring(0, 150)}...`);
    } else {
      await renderShorts({
        imagePath,
        narrationLines,
        title: article.title,
        categoryEmoji: category.emoji,
        categoryName: category.name,
        outputPath: videoPath,
      });

      // Buat thumbnail
      await createThumbnail(imagePath, thumbnailPath);
    }
    console.log(`[Step 3/6] ✅ Video siap`);

    if (DRY_RUN) {
      console.log('\n[DRY RUN] Mode test aktif — skip upload R2 dan YouTube');
      return { title: youtubeTitle, youtubeUrl: 'https://www.youtube.com/shorts/DRY-RUN' };
    }

    // ─── Step 4: Upload ke R2 transit ────────────────────────
    console.log(`\n[Step 4/6] ☁️ Upload transit ke R2...`);
    const dateStr       = new Date().toISOString().split('T')[0];
    r2TransitKey        = `video/transit/${dateStr}-${videoIndex}-${Date.now()}.mp4`;
    await uploadFileToR2(r2TransitKey, videoPath);
    console.log(`[Step 4/6] ✅ Transit R2: ${r2TransitKey}`);

    // ─── Step 5: Upload ke YouTube ───────────────────────────
    console.log(`\n[Step 5/6] 📤 Upload ke YouTube...`);

    // Estimasi quota
    const quotaInfo = estimateQuotaUsage(videoIndex);
    console.log(`[YouTube] Estimasi quota: ${quotaInfo.used}/${quotaInfo.dailyQuota} unit (${quotaInfo.percentage}%)`);

    const youtubeResult = await uploadToYouTube({
      videoPath,
      title: youtubeTitle,
      description: youtubeDescription,
      tags: [
        'astronomi', 'nasa', 'luarangkasa', 'meteorit',
        category.id, 'shorts', 'edukasi', 'sains', 'indonesia',
      ],
      categoryId: '28',
      isShorts: true,
    });

    // Set thumbnail kustom
    if (fs.existsSync(thumbnailPath)) {
      await setThumbnail(youtubeResult.videoId, thumbnailPath);
    }

    console.log(`[Step 5/6] ✅ YouTube: ${youtubeResult.youtubeUrl}`);

    // ─── Step 6: Cleanup & Catat ─────────────────────────────
    console.log(`\n[Step 6/6] 🧹 Cleanup & Catat...`);

    // Hapus dari R2 transit
    if (r2TransitKey) {
      await deleteFromR2(r2TransitKey);
      console.log(`[Step 6/6] ✅ Transit R2 dihapus`);
    }

    // Catat ke D1
    await recordUpload({
      article,
      category,
      youtubeResult,
      duration: parseInt(process.env.VIDEO_DURATION_SEC || '55'),
    });

    // Notif Telegram sukses
    await notifySuccess({
      article: { ...article, articleUrl: article.articleUrl || `https://www.meteorit.my.id/blog/${article.id}` },
      category,
      youtubeResult,
      videoIndex,
      totalVideos,
    });

    cleanupTemp(tempFiles);

    return {
      title: youtubeTitle,
      youtubeUrl: youtubeResult.youtubeUrl,
      ...youtubeResult,
    };
  } catch (err) {
    console.error(`\n[Main] ❌ Error proses video ${videoIndex}:`, err.message);

    // Coba hapus transit R2 jika ada
    if (r2TransitKey) {
      await deleteFromR2(r2TransitKey).catch(() => {});
    }

    // Notif error
    await notifyError({
      article,
      category,
      error: err.message,
      videoIndex,
      totalVideos,
    });

    cleanupTemp(tempFiles);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Meteorit YouTube Shorts Automation');
  console.log('='.repeat(60));
  console.log(`📅 Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  console.log(`🔧 Mode: ${DRY_RUN ? '🟡 DRY RUN (test, tidak upload)' : '🟢 PRODUCTION'}`);
  console.log(`🎬 Max video/hari: ${MAX_VIDEOS}`);

  // Cek FFmpeg
  if (!checkFFmpeg() && !DRY_RUN) {
    console.error('❌ FFmpeg tidak tersedia. Abort.');
    process.exit(1);
  }

  // Preview jadwal 9 hari (hanya di dry-run)
  if (DRY_RUN) previewSchedule(9);

  // ─── Tentukan kategori hari ini ───────────────────────────
  let category = getTodayCategory();
  
  // Ambil override dari argumen CLI --category=xyz atau env CATEGORY_OVERRIDE
  const categoryArg = process.argv.find(a => a.startsWith('--category='))?.split('=')[1] || process.env.CATEGORY_OVERRIDE;
  if (categoryArg) {
    const { CATEGORIES } = await import('./src/lib/categoryRotation.js');
    const matched = CATEGORIES.find(c => c.id === categoryArg.toLowerCase());
    if (matched) {
      category = matched;
      console.log(`\n⚠️ OVERRIDE KATEGORI AKTIF: ${category.emoji} ${category.name}`);
    } else {
      console.warn(`\n⚠️ Override kategori "${categoryArg}" tidak ditemukan, memakai rotasi harian.`);
    }
  } else {
    console.log(`\n${category.emoji} Kategori hari ini: ${category.name}`);
  }

  // ─── Ambil artikel ────────────────────────────────────────
  console.log(`\n📥 Mengambil artikel dari R2 (kategori: ${category.name})...`);
  const articles = await getArticlesByCategory(category, MAX_VIDEOS + 2); // Ambil lebih, antisipasi duplikat

  if (!articles || articles.length === 0) {
    console.warn('[Main] ⚠️ Tidak ada artikel ditemukan!');
    await notifyNoArticles({ category });
    process.exit(0);
  }

  console.log(`[Main] Ditemukan ${articles.length} artikel kandidat`);

  // Deduplikasi antrean kandidat agar tidak memproses artikel dengan ID/Judul yang sama dalam satu antrean hari ini
  const uniqueArticles = [];
  const seenIds = new Set();
  const seenTitles = new Set();
  for (const article of articles) {
    if (!article.id) continue;
    const cleanTitle = (article.title || '').trim().toLowerCase();
    if (seenIds.has(article.id) || seenTitles.has(cleanTitle)) {
      console.log(`[Main] ⏭️ Skip artikel duplikat dalam antrean kandidat: ${article.title} (${article.id})`);
      continue;
    }
    seenIds.add(article.id);
    seenTitles.add(cleanTitle);
    uniqueArticles.push(article);
  }

  // ─── Proses setiap artikel (max MAX_VIDEOS) ───────────────
  const successVideos = [];
  let failCount = 0;
  let videoIndex = 0;

  for (const article of uniqueArticles) {
    if (videoIndex >= MAX_VIDEOS) break;
    videoIndex++;

    const result = await processArticle(article, category, videoIndex, MAX_VIDEOS);
    if (result === 'skipped') {
      videoIndex--; // decrement agar bisa mencoba artikel berikutnya
    } else if (result) {
      successVideos.push({ ...result, title: article.title });
    } else {
      failCount++;
    }

    // Delay 5 detik antar video (antisipasi rate limit)
    if (videoIndex < MAX_VIDEOS && videoIndex < uniqueArticles.length) {
      console.log('\n⏳ Jeda 5 detik sebelum video berikutnya...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // ─── Laporan akhir ────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 LAPORAN AKHIR');
  console.log('═'.repeat(60));
  console.log(`✅ Sukses : ${successVideos.length} video`);
  console.log(`❌ Gagal  : ${failCount} video`);
  successVideos.forEach((v, i) => {
    console.log(`   ${i + 1}. ${v.youtubeUrl}`);
    console.log(`      "${v.title?.substring(0, 60)}..."`);
  });

  // Kirim laporan harian ke Telegram
  await notifyDailyReport({
    category,
    successCount: successVideos.length,
    failCount,
    videos: successVideos,
  });

  // Cleanup direktori temp
  try {
    const tmpFiles = fs.readdirSync(TMP_DIR);
    tmpFiles.forEach(f => {
      try { fs.unlinkSync(path.join(TMP_DIR, f)); } catch {}
    });
  } catch {}

  if (failCount > 0 && successVideos.length === 0) {
    process.exit(1); // Exit error jika semua proses benar-benar gagal
  }

  console.log('\n✅ Selesai!\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
