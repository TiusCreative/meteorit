import { NextResponse } from 'next/server';
import { uploadToR2, fetchJsonFromR2, deleteFromR2 } from '@/lib/r2Client';
import { sendTelegramMessage } from '@/lib/telegram';
import { getSiteUrl, getAbsoluteUrl } from '@/lib/siteUrl';
import { queryD1 } from '@/lib/d1Client';
import { generateTtsMp3 } from '@/lib/tts';
import { isValidCronRequest } from '@/lib/cronAuth';
import R2_CONFIG from '@/lib/cloudflareR2Config';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 80; // Cocok dengan batas durasi cron Vercel

interface EpisodeMetadata {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  enclosureUrl: string;
  enclosureLength: number;
  duration: number;
  sourceId: string;
  sourceType: 'article' | 'apod' | 'meteorite';
  deletedFromR2?: boolean;
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cleanContentForSpeech(text: string): string {
  return text
    .replace(/^#+\s+/gm, '') // Hapus markdown headers
    .replace(/[*#_`~]/g, '') // Hapus style markdown
    .replace(/<[^>]*>/g, '') // Hapus tag HTML
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Hapus link markdown [teks](url) -> teks
    .replace(/^\s*[-*+]\s+/gm, '') // Hapus list bulet
    .replace(/^\s*\d+\.\s+/gm, '') // Hapus list bernomor
    .replace(/\s+/g, ' ') // Normalisasi spasi dan baris baru
    .trim();
}

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5429818332';
  const siteUrl = getSiteUrl();

  try {
    // 1. Unggah logo cover art podcast ke R2 jika file lokal ada
    const logoKey = 'logo-meteor-spotify.png';
    const logoUrl = `${R2_CONFIG.publicUrl}/${logoKey}`;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo-meteor-spotify.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        await uploadToR2(logoKey, logoBuffer, 'image/png');
        console.log("[Podcast Cron] Cover art podcast berhasil diunggah ke R2.");
      } else {
        console.warn("[Podcast Cron] Berkas lokal logo-meteor-spotify.png tidak ditemukan di folder public/");
      }
    } catch (logoErr) {
      console.warn("[Podcast Cron] Gagal menyelaraskan cover art ke R2:", logoErr);
    }

    // 2. Memilih sumber konten astronomi secara acak dari database D1
    let title = '';
    let rawContent = '';
    let sourceId = '';
    let sourceType: 'article' | 'apod' | 'meteorite' = 'article';
    let found = false;

    // Acak urutan pencarian sumber tabel
    const tableIndexes = [0, 1, 2].sort(() => Math.random() - 0.5);

    for (const idx of tableIndexes) {
      try {
        if (idx === 0) {
          // Dari Artikel Blog
          const res = await queryD1(
            `SELECT id, title, excerpt, r2_path FROM articles 
             WHERE status = 'Published' AND category IN ('Edukasi', 'Komet & Asteroid', 'Peristiwa Alam', 'Planet Mars', 'Bola Api & Fireball') 
             ORDER BY RANDOM() LIMIT 1`
          );
          if (res.results && res.results.length > 0) {
            const row = res.results[0];
            title = row.title;
            sourceId = row.id;
            sourceType = 'article';
            // Coba ambil isi lengkap dari R2
            try {
              const fullArticle = await fetchJsonFromR2<any>(`data/blog/articles/${row.id}.json`);
              if (fullArticle && fullArticle.content) {
                rawContent = fullArticle.content;
              }
            } catch {}
            if (!rawContent) {
              rawContent = row.excerpt || '';
            }
            if (rawContent) found = true;
            break;
          }
        } else if (idx === 1) {
          // Dari APOD NASA
          const res = await queryD1(
            `SELECT id, title, explanation, translations FROM apod_history 
             ORDER BY RANDOM() LIMIT 1`
          );
          if (res.results && res.results.length > 0) {
            const row = res.results[0];
            sourceId = row.id;
            sourceType = 'apod';

            let transTitle = '';
            let transExplanation = '';
            try {
              if (row.translations) {
                const transObj = JSON.parse(row.translations);
                transTitle = transObj.title?.id || transObj.title || '';
                transExplanation = transObj.explanation?.id || transObj.explanation || '';
              }
            } catch {}

            let finalTitle = row.title || '';
            let finalExplanation = row.explanation || '';
            if (finalTitle.startsWith('{')) {
              try { finalTitle = JSON.parse(finalTitle).id || finalTitle; } catch {}
            }
            if (finalExplanation.startsWith('{')) {
              try { finalExplanation = JSON.parse(finalExplanation).id || finalExplanation; } catch {}
            }

            title = transTitle || finalTitle;
            rawContent = transExplanation || finalExplanation;
            if (title && rawContent) {
              found = true;
              break;
            }
          }
        } else if (idx === 2) {
          // Dari Ensiklopedia Meteorit
          const res = await queryD1(
            `SELECT id, name, translated_name, recclass, mass, year, translated_description, description FROM meteorites 
             ORDER BY RANDOM() LIMIT 1`
          );
          if (res.results && res.results.length > 0) {
            const row = res.results[0];
            title = `Mengenal Meteorit ${row.translated_name || row.name}`;
            sourceId = row.id;
            sourceType = 'meteorite';

            rawContent = row.translated_description || row.description || '';
            if (!rawContent) {
              const yearStr = row.year ? new Date(row.year).getFullYear() : 'tidak diketahui';
              const massStr = row.mass ? `${(parseFloat(row.mass) / 1000).toFixed(2)} kg` : 'tidak diketahui';
              rawContent = `Meteorit ${row.name} adalah batu antariksa kelas ${row.recclass || 'tidak diketahui'} dengan massa ${massStr} yang ditemukan pada tahun ${yearStr}.`;
            }
            found = true;
            break;
          }
        }
      } catch (err) {
        console.warn(`[Podcast Cron] Gagal mengambil sumber tipe indeks ${idx}:`, err);
      }
    }

    if (!found || !title || !rawContent) {
      // Fallback Statis
      title = "Misteri Perjalanan Bintang Jatuh dan Batuan Meteorit";
      rawContent = "Bagaimana sebuah batu luar angkasa mampu bertahan melewati atmosfer bumi dan memberikan wawasan ilmiah yang berharga bagi sains modern.";
      sourceId = "fallback-static";
      sourceType = "article";
    }

    // 3. Menyusun Naskah Podcast
    const cleanContent = cleanContentForSpeech(rawContent);
    // Batasi kata agar durasi audio TTS tidak terlampau panjang (> 250 kata)
    const maxWords = 250;
    const words = cleanContent.split(/\s+/);
    const excerptContent = words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');

    const scriptText = `Halo pendengar, selamat datang di podcast Meteorit Indonesia. Episode kali ini berjudul: ${title}. \n\n ${excerptContent} \n\n Terima kasih telah mendengarkan podcast Meteorit Indonesia. Kunjungi website kami di meteorit.my.id untuk mendapatkan berita, peta kebencanaan, dan ensiklopedia astronomi secara real-time. Sampai jumpa di episode berikutnya!`;

    // 4. Membuat file MP3 dari naskah
    console.log(`[Podcast Cron] Memulai pembuatan audio TTS untuk: "${title}"`);
    const mp3Buffer = await generateTtsMp3(scriptText);
    const enclosureLength = mp3Buffer.length;
    
    // Estimasi durasi (kecepatan rata-rata membaca 2.3 kata per detik)
    const wordsCount = scriptText.split(/\s+/).length;
    const duration = Math.round(wordsCount / 2.3);

    // 5. Mengunggah audio MP3 ke Cloudflare R2
    const episodeId = `podcast-${Date.now()}`;
    const mp3Key = `data/podcast/mp3s/${episodeId}.mp3`;
    const enclosureUrl = await uploadToR2(mp3Key, mp3Buffer, 'audio/mpeg');
    console.log(`[Podcast Cron] Berkas MP3 berhasil diunggah ke R2: ${enclosureUrl}`);

    // 6. Membaca dan memperbarui berkas daftar episode index.json di R2
    const episodesKey = 'data/podcast/episodes.json';
    let episodesList = await fetchJsonFromR2<EpisodeMetadata[]>(episodesKey) || [];
    
    const newEpisode: EpisodeMetadata = {
      id: episodeId,
      title,
      description: cleanContent.substring(0, 300) + (cleanContent.length > 300 ? '...' : ''),
      pubDate: new Date().toISOString(),
      enclosureUrl,
      enclosureLength,
      duration,
      sourceId,
      sourceType
    };

    episodesList = [newEpisode, ...episodesList];

    // 7. Bersihkan berkas MP3 lama yang berusia lebih dari 24 jam untuk menghemat R2
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    for (const ep of episodesList) {
      const epAgeMs = nowMs - new Date(ep.pubDate).getTime();
      if (epAgeMs > ONE_DAY_MS && !ep.deletedFromR2) {
        try {
          const oldMp3Key = `data/podcast/mp3s/${ep.id}.mp3`;
          await deleteFromR2(oldMp3Key);
          ep.deletedFromR2 = true;
          console.log(`[Podcast Cron] Menghapus MP3 kedaluwarsa dari R2: ${oldMp3Key}`);
        } catch (cleanupErr) {
          console.error(`[Podcast Cron] Gagal menghapus MP3 kedaluwarsa untuk episode ${ep.id}:`, cleanupErr);
        }
      }
    }

    // Tulis kembali indeks episode terupdate ke R2
    await uploadToR2(episodesKey, JSON.stringify(episodesList, null, 2), 'application/json');

    // 8. Membangun RSS Feed podcast.xml
    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Meteorit Indonesia Podcast</title>
    <description>Membahas astronomi, meteor, komet, benda langit, dan peristiwa alam unik bersama Meteorit Indonesia.</description>
    <link>${siteUrl}</link>
    <language>id</language>
    <itunes:author>Meteorit Indonesia</itunes:author>
    <itunes:subtitle>Sains Astronomi dan Edukasi Benda Langit</itunes:subtitle>
    <itunes:summary>Membahas astronomi, meteor, komet, benda langit, dan peristiwa alam unik bersama Meteorit Indonesia.</itunes:summary>
    <itunes:owner>
      <itunes:name>Meteorit Indonesia</itunes:name>
      <itunes:email>creativecortex168@gmail.com</itunes:email>
    </itunes:owner>
    <itunes:image href="${logoUrl}" />
    <itunes:category text="Science">
      <itunes:category text="Astronomy" />
    </itunes:category>
    <itunes:explicit>no</itunes:explicit>
    <image>
      <url>${logoUrl}</url>
      <title>Meteorit Indonesia Podcast</title>
      <link>${siteUrl}</link>
    </image>
    <atom:link href="${getAbsoluteUrl('/podcast.xml')}" rel="self" type="application/rss+xml" />
`;

    for (const ep of episodesList) {
      rssXml += `    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description)}</description>
      <itunes:summary>${escapeXml(ep.description)}</itunes:summary>
      <pubDate>${new Date(ep.pubDate).toUTCString()}</pubDate>
      <guid isPermaLink="false">${ep.id}</guid>
      <enclosure url="${ep.enclosureUrl}" length="${ep.enclosureLength}" type="audio/mpeg" />
      <itunes:duration>${ep.duration}</itunes:duration>
      <itunes:explicit>no</itunes:explicit>
      <itunes:author>Meteorit Indonesia</itunes:author>
    </item>
`;
    }

    rssXml += `  </channel>
</rss>`;

    const podcastXmlKey = 'data/podcast/podcast.xml';
    await uploadToR2(podcastXmlKey, rssXml, 'application/xml; charset=utf-8');
    console.log(`[Podcast Cron] Podcast RSS XML berhasil diperbarui di R2: ${podcastXmlKey}`);

    // 9. Kirim laporan sukses ke Telegram Admin
    const fileMb = (enclosureLength / (1024 * 1024)).toFixed(2);
    const durationMin = Math.floor(duration / 60);
    const durationSec = duration % 60;
    const durationStr = `${durationMin}m ${durationSec}s`;

    const successMsg = `🎙 <b>LAPORAN PODCAST SPOTIFY CRON</b>\n\n` +
      `🟢 <b>Status:</b> Sukses Diterbitkan\n` +
      `📌 <b>Judul:</b> ${title}\n` +
      `📂 <b>Sumber:</b> ${sourceType} (${sourceId})\n` +
      `⏱ <b>Durasi:</b> ${durationStr} (${wordsCount} kata)\n` +
      `📦 <b>Ukuran:</b> ${fileMb} MB\n\n` +
      `🔗 <b>Audio R2:</b> <a href="${enclosureUrl}">Download MP3</a>\n` +
      `🔗 <b>RSS Feed:</b> <a href="${getAbsoluteUrl('/podcast.xml')}">podcast.xml</a>\n` +
      `🔗 <b>Spotify Show:</b> <a href="https://open.spotify.com/show/033TOxHjscqNxAZYKR34CE">Spotify Podcast</a>\n\n` +
      `ℹ️ <i>Catatan: File MP3 akan otomatis dihapus dari R2 setelah 1 hari.</i>`;

    await sendTelegramMessage(TELEGRAM_CHAT_ID, successMsg);

    return NextResponse.json({
      success: true,
      message: 'New podcast episode published successfully',
      episode: {
        id: episodeId,
        title,
        sourceType,
        sourceId
      }
    });

  } catch (err: any) {
    console.error('[Podcast Cron] Error:', err);
    // Kirim laporan gagal ke Telegram Admin
    const failMsg = `⚠️ <b>LAPORAN PODCAST SPOTIFY GAGAL</b>\n\n` +
      `❌ <b>Error:</b> ${err instanceof Error ? err.message : String(err)}\n` +
      `🛠 <b>Status:</b> Failed`;
    try {
      await sendTelegramMessage(TELEGRAM_CHAT_ID, failMsg);
    } catch {}

    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
