// src/lib/ffmpegRenderer.js
// ============================================================
// Render video YouTube Shorts (1080×1920) menggunakan FFmpeg
// Format: gambar artikel + teks narasi bertahap + musik ambient
//
// Layout video (dari atas ke bawah):
//   - Header bar: logo + nama website
//   - Background: gambar artikel (Ken Burns zoom)
//   - Card teks: narasi 8 kalimat muncul bergantian
//   - Progress bar: menunjukkan waktu
//   - Footer: CTA link website
// ============================================================
import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(path.dirname(path.dirname(__dirname)), 'src', 'assets');

// Konfigurasi video
const VIDEO_WIDTH  = 1080;
const VIDEO_HEIGHT = 1920;
const VIDEO_FPS    = 30;
const VIDEO_DURATION = parseInt(process.env.VIDEO_DURATION_SEC || '55'); // detik

// Durasi setiap kalimat narasi (detik)
const LINE_DURATION = Math.floor((VIDEO_DURATION - 5) / 8); // ~6 detik per kalimat

// Warna tema (dark space)
const COLOR_BG        = '0x0a0a1a';  // dark navy
const COLOR_HEADER    = '0x1a1a2e';  // dark blue
const COLOR_CARD_BG   = '0x000000@0.7'; // transparan gelap
const COLOR_TEXT_MAIN = 'white';
const COLOR_TEXT_GRAY = 'cccccc';
const COLOR_ACCENT    = '00ff88';    // hijau neon
const COLOR_PROGRESS  = '4fc3f7';   // biru muda

/**
 * Cek apakah FFmpeg tersedia
 */
export function checkFFmpeg() {
  try {
    const result = execSync('ffmpeg -version', { stdio: 'pipe' }).toString();
    const version = result.match(/ffmpeg version ([^\s]+)/)?.[1] || 'unknown';
    console.log(`[FFmpeg] ✅ FFmpeg tersedia: v${version}`);
    return true;
  } catch {
    console.error('[FFmpeg] ❌ FFmpeg tidak ditemukan. Install: brew install ffmpeg (Mac) atau apt install ffmpeg (Linux)');
    return false;
  }
}

/**
 * Escape teks untuk drawtext FFmpeg filter
 */
function escapeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, ' ')
    .replace(/%/g, '\\%')
    .substring(0, 90); // Batas 90 karakter per baris
}

/**
 * Wrap teks panjang menjadi 2 baris
 */
function wrapText(text, maxChars = 42) {
  if (!text || text.length <= maxChars) return [text || '', ''];
  const words = text.split(' ');
  let line1 = '';
  let line2 = '';
  for (const word of words) {
    if ((line1 + ' ' + word).trim().length <= maxChars) {
      line1 = (line1 + ' ' + word).trim();
    } else {
      line2 = (line2 + ' ' + word).trim();
    }
  }
  return [line1, line2];
}

/**
 * Dapatkan path font yang tersedia
 */
function getFontPath() {
  const fontPaths = [
    path.join(ASSETS_DIR, 'fonts', 'NotoSans-Bold.ttf'),
    '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
    '/usr/share/fonts/noto/NotoSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/System/Library/Fonts/Helvetica.ttc',          // Mac
    '/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf', // Ubuntu
  ];

  for (const fp of fontPaths) {
    if (fs.existsSync(fp)) {
      console.log(`[FFmpeg] Font: ${fp}`);
      return fp;
    }
  }
  // Fallback — pakai font default FFmpeg
  console.warn('[FFmpeg] Font tidak ditemukan, pakai default');
  return '';
}

/**
 * Dapatkan path musik ambient yang tersedia
 */
function getMusicPath() {
  const musicFiles = [
    path.join(ASSETS_DIR, 'music', 'space-ambient-1.mp3'),
    path.join(ASSETS_DIR, 'music', 'space-ambient-2.mp3'),
    path.join(ASSETS_DIR, 'music', 'space-ambient-3.mp3'),
  ];

  // Pilih acak berdasarkan tanggal
  const dayOfMonth = new Date().getDate();
  const idx = dayOfMonth % musicFiles.length;
  const selected = musicFiles[idx];

  if (fs.existsSync(selected)) return selected;

  // Coba file lain
  for (const f of musicFiles) {
    if (fs.existsSync(f)) return f;
  }

  return null; // Tidak ada musik
}

/**
 * Dapatkan path logo
 */
function getLogoPath() {
  const logoPaths = [
    path.join(ASSETS_DIR, 'logo', 'meteorit-logo.png'),
    path.join(ASSETS_DIR, 'logo', 'logo.png'),
  ];
  for (const lp of logoPaths) {
    if (fs.existsSync(lp)) return lp;
  }
  return null;
}

/**
 * Render video YouTube Shorts menggunakan FFmpeg
 * @param {Object} options
 * @param {string} options.imagePath - Path gambar background
 * @param {string[]} options.narrationLines - Array 8 kalimat narasi
 * @param {string} options.title - Judul artikel (untuk header)
 * @param {string} options.categoryEmoji - Emoji kategori
 * @param {string} options.categoryName - Nama kategori
 * @param {string} options.outputPath - Path output video .mp4
 * @returns {Promise<string>} Path file video yang dihasilkan
 */
export async function renderShorts({ imagePath, narrationLines, title, categoryEmoji, categoryName, outputPath }) {
  checkFFmpeg();

  const fontPath = getFontPath();
  const musicPath = getMusicPath();
  const logoPath = getLogoPath();

  const fontArg = fontPath ? `fontfile='${fontPath}':` : '';

  // Pastikan direktori output ada
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Siapkan teks per kalimat dengan timing
  const drawTextFilters = narrationLines.map((line, i) => {
    const startSec = 3 + (i * LINE_DURATION);
    const endSec   = startSec + LINE_DURATION;
    const [line1, line2] = wrapText(line, 42);

    const l1 = escapeText(line1);
    const l2 = escapeText(line2);

    const filters = [];

    // Baris 1 teks narasi
    if (l1) {
      filters.push(
        `drawtext=${fontArg}` +
        `text='${l1}':` +
        `fontcolor=white:fontsize=46:` +
        `x=(w-text_w)/2:y=h*0.62:` +
        `line_spacing=10:` +
        `box=1:boxcolor=black@0.65:boxborderw=20:` +
        `alpha='if(between(t,${startSec},${startSec + 0.3}),(t-${startSec})/0.3,if(between(t,${endSec - 0.3},${endSec}),(${endSec}-t)/0.3,1))':` +
        `enable='between(t,${startSec},${endSec})'`
      );
    }

    // Baris 2 teks narasi (jika ada)
    if (l2) {
      filters.push(
        `drawtext=${fontArg}` +
        `text='${l2}':` +
        `fontcolor=white:fontsize=46:` +
        `x=(w-text_w)/2:y=h*0.62+70:` +
        `box=1:boxcolor=black@0.65:boxborderw=20:` +
        `alpha='if(between(t,${startSec},${startSec + 0.3}),(t-${startSec})/0.3,if(between(t,${endSec - 0.3},${endSec}),(${endSec}-t)/0.3,1))':` +
        `enable='between(t,${startSec},${endSec})'`
      );
    }

    return filters.join(',');
  }).join(',');

  // Header: nama website
  const headerText = `${escapeText(categoryEmoji)} meteorit.my.id`;
  const headerFilter = `drawtext=${fontArg}text='${headerText}':fontcolor=white:fontsize=42:x=60:y=55:alpha=0.95`;

  // Footer CTA
  const footerText = escapeText('🔗 meteorit.my.id  |  @Meteorit-h7d');
  const footerFilter =
    `drawtext=${fontArg}text='${footerText}':fontcolor=${COLOR_TEXT_GRAY}:fontsize=36:` +
    `x=(w-text_w)/2:y=h-80`;

  // Judul artikel (muncul di awal 3 detik)
  const titleText = escapeText(title?.substring(0, 55) || categoryName);
  const titleFilter =
    `drawtext=${fontArg}text='${titleText}':fontcolor=${COLOR_ACCENT}:fontsize=48:` +
    `x=(w-text_w)/2:y=h*0.52:` +
    `box=1:boxcolor=black@0.7:boxborderw=25:` +
    `enable='between(t,0.5,3.5)'`;

  // Gabungkan semua filter teks
  const allTextFilters = [
    headerFilter,
    titleFilter,
    drawTextFilters,
    footerFilter,
  ].filter(Boolean).join(',');

  // Input streams
  const inputs = [`-loop 1 -t ${VIDEO_DURATION} -i "${imagePath}"`];
  if (musicPath) inputs.push(`-i "${musicPath}"`);

  // Video filter: scale & crop to 9:16 vertical -> pad to 16:9 landscape -> zoompan -> crop to 9:16 -> scale to target resolution.
  // This prevents stretching since zoompan only supports 16:9 aspect ratio correctly.
  const inputScale    = `scale=608:1080:force_original_aspect_ratio=increase,crop=608:1080`;
  const inputPad      = `pad=1920:1080:(ow-iw)/2:0:black`;
  const setsar        = `setsar=1/1`;
  const zoomFilter    = `zoompan=z='min(zoom+0.0007,1.08)':d=${VIDEO_DURATION * VIDEO_FPS}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080`;
  const outputCrop    = `crop=608:1080:(iw-ow)/2:0`;
  const outputScale   = `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT},setdar=9/16`;
  const overlayFilter = `drawbox=x=0:y=0:w=iw:h=ih:color=black@0.12:t=fill`;
  const headerBg      = `drawbox=x=0:y=0:w=iw:h=130:color=${COLOR_HEADER}@0.9:t=fill`;
  const footerBg      = `drawbox=x=0:y=h-100:w=iw:h=100:color=${COLOR_HEADER}@0.85:t=fill`;
 
  const vfChain = [
    inputScale,
    inputPad,
    setsar,
    zoomFilter,
    outputCrop,
    outputScale,
    overlayFilter,
    headerBg,
    footerBg,
    allTextFilters,
  ].join(',');

  // Audio filter
  const audioFilter = musicPath
    ? `-filter_complex "[1:a]volume=0.3,afade=t=out:st=${VIDEO_DURATION - 3}:d=3[a]" -map 0:v -map "[a]"`
    : '-an';

  // FFmpeg command
  const ffmpegCmd = [
    'ffmpeg -y',
    ...inputs,
    `-vf "${vfChain}"`,
    audioFilter,
    `-c:v libx264 -preset fast -crf 23`,
    `-c:a aac -b:a 128k`,
    `-t ${VIDEO_DURATION}`,
    `-r ${VIDEO_FPS}`,
    `-pix_fmt yuv420p`,
    `-movflags +faststart`,
    `"${outputPath}"`,
  ].join(' ');

  console.log(`[FFmpeg] Render dimulai: ${path.basename(outputPath)}`);
  console.log(`[FFmpeg] Durasi: ${VIDEO_DURATION}s | Resolusi: ${VIDEO_WIDTH}×${VIDEO_HEIGHT} | FPS: ${VIDEO_FPS}`);

  try {
    const { stdout, stderr } = await execAsync(ffmpegCmd, {
      maxBuffer: 100 * 1024 * 1024, // 100MB buffer
      timeout: 300000, // 5 menit timeout
    });

    // Cek ukuran file
    const stat = fs.statSync(outputPath);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`[FFmpeg] ✅ Render selesai: ${path.basename(outputPath)} (${sizeMB} MB)`);

    return outputPath;
  } catch (err) {
    console.error('[FFmpeg] ❌ Error saat render:', err.message);
    if (err.stderr) console.error('[FFmpeg] stderr:', err.stderr.slice(-500));
    throw new Error(`FFmpeg render gagal: ${err.message}`);
  }
}

/**
 * Buat thumbnail dari gambar artikel
 * Crop ke 1280×720 untuk thumbnail YouTube
 */
export async function createThumbnail(imagePath, outputPath) {
  const cmd = `ffmpeg -y -i "${imagePath}" -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" -frames:v 1 "${outputPath}"`;
  try {
    await execAsync(cmd);
    console.log(`[FFmpeg] ✅ Thumbnail dibuat: ${path.basename(outputPath)}`);
    return outputPath;
  } catch (err) {
    console.warn('[FFmpeg] Gagal buat thumbnail:', err.message);
    return null;
  }
}
