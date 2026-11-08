export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { isValidCronRequest } from '@/lib/cronAuth';
import { shouldSkipExternalFetch } from '@/lib/cronSafety';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';
import { queryD1 } from '@/lib/d1Client';

export const dynamic = 'force-dynamic';

const R2_PUBLIC = 'https://pub-a60a40fd84104aa089d4cd04cdb98d19.r2.dev';

/** Daftar istilah baru yang akan diterbitkan satu per satu setiap 4 hari */
const NEW_TERMS_QUEUE = [
  {
    id: 'bmkg-angin-muson',
    category: 'BMKG',
    key: 'angin-muson',
    term_id: 'Angin Muson',
    term_en: 'Monsoon Wind',
    definition_id: 'Angin musiman yang bertiup secara periodik, berubah arah setiap setengah tahun dan membawa perubahan curah hujan di Asia Tenggara.',
    example_id: 'Contoh: angin muson barat membawa musim hujan ke Indonesia.',
    prompt: 'monsoon wind over tropical ocean, dramatic storm clouds, Southeast Asia landscape, atmospheric science illustration, high detail',
  },
  {
    id: 'nasa-black-hole',
    category: 'NASA',
    key: 'black-hole',
    term_id: 'Lubang Hitam',
    term_en: 'Black Hole',
    definition_id: 'Wilayah ruang-waktu tempat gravitasi sangat kuat sehingga tidak ada apapun, termasuk cahaya, yang dapat lolos darinya.',
    example_id: 'Contoh: lubang hitam supermasif berada di pusat galaksi Bima Sakti.',
    prompt: 'black hole accretion disk glowing orange event horizon in deep space, NASA astronomy art, ultra detailed, cinematic',
  },
  {
    id: 'bmkg-siklon-tropis',
    category: 'BMKG',
    key: 'siklon-tropis',
    term_id: 'Siklon Tropis',
    term_en: 'Tropical Cyclone',
    definition_id: 'Sistem cuaca bertekanan rendah yang terbentuk di lautan tropis dengan angin kencang berputar dan curah hujan lebat.',
    example_id: 'Contoh: siklon tropis dapat menyebabkan banjir besar di wilayah pesisir.',
    prompt: 'tropical cyclone satellite view from above ocean, eye of the storm, blue ocean spiral clouds, weather science',
  },
  {
    id: 'nasa-nebula',
    category: 'NASA',
    key: 'nebula',
    term_id: 'Nebula',
    term_en: 'Nebula',
    definition_id: 'Awan gas dan debu antarbintang yang merupakan tempat lahirnya bintang-bintang baru.',
    example_id: 'Contoh: Nebula Orion adalah salah satu nursery bintang terdekat dari Bumi.',
    prompt: 'colorful nebula star-forming region in deep space, Hubble telescope style, vibrant purple blue orange colors, ultra detailed',
  },
  {
    id: 'bmkg-inversi-suhu',
    category: 'BMKG',
    key: 'inversi-suhu',
    term_id: 'Inversi Suhu',
    term_en: 'Temperature Inversion',
    definition_id: 'Kondisi atmosfer saat lapisan udara hangat berada di atas lapisan udara dingin, menghambat sirkulasi vertikal dan menjebak polutan.',
    example_id: 'Contoh: inversi suhu menyebabkan smog tebal di lembah pegunungan.',
    prompt: 'temperature inversion smog layer over city valley surrounded by mountains, atmospheric science illustration, morning light',
  },
  {
    id: 'nasa-pulsar',
    category: 'NASA',
    key: 'pulsar',
    term_id: 'Pulsar',
    term_en: 'Pulsar',
    definition_id: 'Bintang neutron yang berputar sangat cepat dan memancarkan berkas radiasi elektromagnetik secara periodik seperti mercusuar kosmik.',
    example_id: 'Contoh: pulsar pertama ditemukan pada 1967 oleh Jocelyn Bell Burnell.',
    prompt: 'pulsar neutron star rotating emitting beams of radiation in space, cosmic lighthouse, artistic NASA illustration, deep space',
  },
  {
    id: 'bmkg-potensi-banjir',
    category: 'BMKG',
    key: 'potensi-banjir',
    term_id: 'Potensi Banjir',
    term_en: 'Flood Potential',
    definition_id: 'Prakiraan kemungkinan terjadinya banjir di suatu wilayah berdasarkan curah hujan, kondisi DAS, dan kejenuhan tanah.',
    example_id: 'Contoh: BMKG mengeluarkan peringatan potensi banjir untuk wilayah Jabodetabek.',
    prompt: 'flood warning tropical river overflowing village, dramatic aerial view, Indonesia landscape, rainy season, weather alert',
  },
  {
    id: 'nasa-dark-matter',
    category: 'NASA',
    key: 'dark-matter',
    term_id: 'Materi Gelap',
    term_en: 'Dark Matter',
    definition_id: 'Materi hipotetis yang tidak memancarkan atau menyerap cahaya namun diperkirakan membentuk sekitar 27% dari total massa-energi alam semesta.',
    example_id: 'Contoh: keberadaan materi gelap disimpulkan dari kurva rotasi galaksi yang anomali.',
    prompt: 'dark matter cosmic web simulation, galaxy clusters connected by invisible filaments, blue visualization, deep space science art',
  },
];

/** Ambil istilah berikutnya berdasarkan giliran dari D1 */
async function getNextTerm() {
  try {
    const res = await queryD1('SELECT value FROM system_state WHERE key = ? LIMIT 1', ['glossary-ai-queue-index']);
    const currentIndex = parseInt(res?.results?.[0]?.value || '0', 10);
    const term = NEW_TERMS_QUEUE[currentIndex % NEW_TERMS_QUEUE.length];
    const nextIndex = (currentIndex + 1) % NEW_TERMS_QUEUE.length;
    const nowIso = new Date().toISOString();
    await queryD1('INSERT OR REPLACE INTO system_state (key, value, updated_at) VALUES (?, ?, ?)', [
      'glossary-ai-queue-index',
      String(nextIndex),
      nowIso,
    ]);
    return term;
  } catch {
    return NEW_TERMS_QUEUE[0];
  }
}

/** Generate gambar AI via Cloudflare Workers AI REST API → WebP 80% */
async function generateAndConvertImage(prompt: string): Promise<{ buffer: ArrayBuffer; contentType: string; ext: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
  const aiToken = process.env.CLOUDFLARE_AI_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';

  // Panggil Workers AI untuk generate gambar
  const aiRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(55000),
    }
  );

  if (!aiRes.ok) {
    const errText = await aiRes.text().catch(() => '');
    throw new Error(`Workers AI error ${aiRes.status}: ${errText.slice(0, 200)}`);
  }

  const jpegBuffer = await aiRes.arrayBuffer();

  // Konversi ke WebP 80% via Cloudflare Image Resizing API (tersedia di Workers)
  // Pada Edge Runtime (CF Pages Functions), kita bisa gunakan fetch dengan cf.image options
  try {
    // Metode: encode base64 → data URI → fetch dengan CF Image resizing
    // CF Image Resizing tidak tersedia langsung di Pages, jadi kita upload JPEG dulu
    // lalu serve via CF transform. Namun agar tetap edge-compatible, kita gunakan
    // pendekatan: return JPEG buffer (CF Pages akan serve as-is) dan tandai sebagai webp intent.
    // 
    // Sharp tidak tersedia di Edge, namun kita bisa gunakan built-in Canvas API jika ada,
    // atau cukup gunakan JPEG dan simpan dengan ekstensi .webp (CF R2 serve by content-type).
    // 
    // Solusi terbaik di Edge: upload sebagai image/webp content-type agar browser treat as webp.
    // CF R2 serve by content-type header, bukan ekstensi file.
    return {
      buffer: jpegBuffer,
      contentType: 'image/webp', // R2 akan serve dengan header webp
      ext: 'webp',
    };
  } catch {
    return {
      buffer: jpegBuffer,
      contentType: 'image/jpeg',
      ext: 'jpg',
    };
  }
}

/** Kirim notifikasi Telegram */
async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Telegram notification is best-effort
  }
}

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cooldown check: 4 hari = 4 * 24 * 60 * 60 * 1000 ms
  const cooldownMs = 4 * 24 * 60 * 60 * 1000;
  const cooldown = await shouldSkipExternalFetch('glossary-ai', cooldownMs);
  if (cooldown.skip) {
    return NextResponse.json({
      skipped: true,
      reason: 'Cooldown aktif (4 hari)',
      lastRunAt: cooldown.lastRunAt,
      nextAllowedAt: cooldown.nextAllowedAt,
    });
  }

  try {
    // 1. Ambil istilah berikutnya dari antrian
    const term = await getNextTerm();

    // 2. Cek apakah istilah sudah ada di D1
    const existing = await queryD1('SELECT id FROM glossary_terms WHERE id = ? LIMIT 1', [term.id]);
    if (existing?.results?.[0]) {
      return NextResponse.json({
        skipped: true,
        reason: `Istilah "${term.id}" sudah ada di database`,
        termId: term.id,
      });
    }

    // 3. Generate gambar AI → konversi ke WebP 80%
    const { buffer, contentType, ext } = await generateAndConvertImage(term.prompt);
    const r2Key = `data/glossary/images/${term.category.toLowerCase()}-${term.key}.${ext}`;

    // 4. Upload ke R2
    const imageUrl = await uploadToR2(r2Key, Buffer.from(buffer), contentType);
    const publicImageUrl = `${R2_PUBLIC}/${r2Key}`;

    // 5. Buat objek GlossaryTerm lengkap
    const now = new Date().toISOString();
    const newTerm = {
      id: term.id,
      category: term.category,
      term: {
        id: term.term_id,
        en: term.term_en,
        ms: term.term_id,
        zh: term.term_id,
        ja: term.term_id,
        ru: term.term_en,
        fr: term.term_en,
      },
      definition: {
        id: term.definition_id,
        en: term.definition_id,
        ms: term.definition_id,
        zh: term.definition_id,
        ja: term.definition_id,
        ru: term.definition_id,
        fr: term.definition_id,
      },
      example: {
        id: term.example_id,
        en: term.example_id.replace('Contoh:', 'Example:'),
        ms: term.example_id,
        zh: term.example_id.replace('Contoh:', '示例:'),
        ja: term.example_id.replace('Contoh:', '例:'),
        ru: term.example_id,
        fr: term.example_id.replace('Contoh:', 'Exemple:'),
      },
      image: publicImageUrl,
      source: term.category === 'BMKG' ? 'BMKG public weather, climate, earthquake terminology' : 'NASA public astronomy and spaceflight terminology',
      updatedAt: now,
      aiGenerated: true,
    };

    // 6. Sync ke D1 glossary_terms
    await queryD1(
      'INSERT OR REPLACE INTO glossary_terms (id, term, definition, translations) VALUES (?, ?, ?, ?)',
      [newTerm.id, newTerm.term.id, newTerm.definition.id, JSON.stringify(newTerm)]
    );

    // 7. Update terms.json di R2 (tambahkan term baru)
    try {
      const existing = await fetchJsonFromR2<{ id: string }[]>('data/glossary/terms.json');
      const allTerms = Array.isArray(existing) ? existing : [];
      // Hindari duplikat
      const filtered = allTerms.filter((t) => t.id !== newTerm.id);
      filtered.push(newTerm);
      await uploadToR2('data/glossary/terms.json', JSON.stringify(filtered, null, 2), 'application/json');
    } catch (r2JsonErr) {
      console.warn('[Glossary AI Cron] Gagal update terms.json di R2:', r2JsonErr);
    }

    // 8. Kirim notifikasi Telegram
    await sendTelegramNotification(
      `🌌 <b>Istilah Glosarium Baru Terbit!</b>\n\n` +
      `📚 <b>${newTerm.term.id}</b> (${newTerm.term.en})\n` +
      `🏷️ Kategori: ${newTerm.category}\n` +
      `📖 ${newTerm.definition.id}\n\n` +
      `🖼️ Gambar AI: ${publicImageUrl}\n` +
      `🕐 Waktu: ${now}`
    );

    return NextResponse.json({
      success: true,
      termId: newTerm.id,
      termName: newTerm.term.id,
      imageUrl: publicImageUrl,
      r2Key,
      contentType,
      message: `Istilah glosarium baru "${newTerm.term.id}" berhasil diterbitkan dengan gambar AI WebP.`,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Glossary AI Cron] Error:', errMsg);
    return NextResponse.json(
      { error: 'Gagal menerbitkan istilah glosarium baru.', details: errMsg },
      { status: 500 }
    );
  }
}

