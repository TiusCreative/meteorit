// scripts/test-render.js
// ============================================================
// Script untuk test render video tanpa upload ke YouTube
// Berguna untuk preview desain video sebelum deploy
//
// Cara pakai:
//   node scripts/test-render.js
//   node scripts/test-render.js --category=komet
//   node scripts/test-render.js --category=apod --output=out/test.mp4
// ============================================================
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getTodayCategory, CATEGORIES } from '../src/lib/categoryRotation.js';
import { getArticlesByCategory, downloadImageFromUrl } from '../src/lib/r2Client.js';
import { generateNarration, generateYouTubeTitle } from '../src/lib/groqNarration.js';
import { renderShorts, createThumbnail, checkFFmpeg } from '../src/lib/ffmpegRenderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(path.dirname(__dirname), 'out');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const categoryArg = args.find(a => a.startsWith('--category='))?.split('=')[1];
const outputArg   = args.find(a => a.startsWith('--output='))?.split('=')[1];

async function testRender() {
  console.log('\n🧪 Test Render YouTube Shorts');
  console.log('='.repeat(50));

  if (!checkFFmpeg()) {
    console.error('❌ FFmpeg tidak tersedia. Install: brew install ffmpeg');
    process.exit(1);
  }

  // Pilih kategori
  let category;
  if (categoryArg) {
    category = CATEGORIES.find(c => c.id === categoryArg);
    if (!category) {
      console.error(`❌ Kategori "${categoryArg}" tidak ditemukan.`);
      console.log('Kategori tersedia:', CATEGORIES.map(c => c.id).join(', '));
      process.exit(1);
    }
  } else {
    category = getTodayCategory();
  }

  console.log(`\n${category.emoji} Kategori: ${category.name}`);

  // Ambil artikel
  console.log('\n📥 Ambil artikel dari R2...');
  const articles = await getArticlesByCategory(category, 1);

  if (!articles || articles.length === 0) {
    console.error('❌ Tidak ada artikel ditemukan. Coba kategori lain.');
    process.exit(1);
  }

  const article = articles[0];
  console.log(`✅ Artikel: "${article.title}"`);
  console.log(`   Gambar: ${article.image || '(tidak ada)'}`);
  console.log(`   Kategori: ${article.category}`);

  // Generate narasi
  console.log('\n🤖 Generate narasi Groq AI...');
  const narrationResult = await generateNarration(article, category);
  console.log(`✅ ${narrationResult.lines.length} kalimat narasi:`);
  narrationResult.lines.forEach((l, i) => console.log(`   ${i + 1}. ${l}`));

  const youtubeTitle = await generateYouTubeTitle(article, category);
  console.log(`\n📺 Judul YouTube: ${youtubeTitle}`);
  console.log('\n📋 Deskripsi YouTube (150 karakter pertama):');
  console.log(narrationResult.youtubeDescription.substring(0, 150) + '...');

  // Download gambar
  const imagePath = path.join(OUT_DIR, `test-image-${Date.now()}.jpg`);
  if (article.image && article.image.startsWith('http')) {
    console.log('\n📥 Download gambar...');
    await downloadImageFromUrl(article.image, imagePath);
    console.log(`✅ Gambar: ${imagePath}`);
  } else {
    // Buat background fallback
    const { execSync } = await import('child_process');
    execSync(`ffmpeg -y -f lavfi -i "color=#0a0a1a:s=1080x1920" -frames:v 1 "${imagePath}"`, { stdio: 'pipe' });
    console.log('ℹ️ Gambar fallback dibuat (background hitam)');
  }

  // Render video
  const dateStr    = new Date().toISOString().split('T')[0];
  const outputPath = outputArg || path.join(OUT_DIR, `test-${category.id}-${dateStr}.mp4`);
  const thumbPath  = outputPath.replace('.mp4', '-thumb.jpg');

  console.log(`\n🎬 Render video → ${outputPath}`);
  console.log('⏳ Ini mungkin memakan 1–3 menit...\n');

  const startTime = Date.now();
  await renderShorts({
    imagePath,
    narrationLines: narrationResult.lines,
    title: article.title,
    categoryEmoji: category.emoji,
    categoryName: category.name,
    outputPath,
  });

  await createThumbnail(imagePath, thumbPath);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const stat = fs.statSync(outputPath);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(1);

  console.log(`\n✅ Render selesai dalam ${elapsed} detik!`);
  console.log(`📁 Output video  : ${outputPath} (${sizeMB} MB)`);
  console.log(`📁 Output thumb  : ${thumbPath}`);
  console.log('\n💡 Buka file untuk preview:');
  console.log(`   open "${outputPath}"`);

  // Cleanup gambar temp
  try { fs.unlinkSync(imagePath); } catch {}
}

testRender().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
