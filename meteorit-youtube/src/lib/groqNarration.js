// src/lib/groqNarration.js
// ============================================================
// Generate narasi pendek Bahasa Indonesia dari artikel
// menggunakan Groq AI (gratis, cepat) dengan fallback OpenRouter
// Output: Array 8 kalimat pendek untuk ditampilkan di video
// ============================================================

const GROQ_PROVIDERS = [
  {
    name: 'Groq Utama',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: () => process.env.GROQ_API_KEY,
    model: 'llama-3.1-8b-instant', // Model cepat & gratis
  },
  {
    name: 'Groq Backup',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: () => process.env.GROQ_BACKUP_API_KEY,
    model: 'llama-3.1-8b-instant',
  },
  {
    name: 'OpenRouter Backup',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: () => process.env.OPENROUTER_API_KEY,
    model: 'meta-llama/llama-3.1-8b-instruct:free',
  },
];

/**
 * Panggil AI dengan fallback provider
 */
async function callAI(prompt, systemPrompt = '') {
  const errors = [];

  for (const provider of GROQ_PROVIDERS) {
    const apiKey = provider.key();
    if (!apiKey) continue;

    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(provider.url.includes('openrouter') ? {
            'HTTP-Referer': 'https://www.meteorit.my.id',
            'X-Title': 'Meteorit Indonesia YouTube',
          } : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 600,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 150)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('Respons kosong dari AI');

      console.log(`[Groq] ✅ Narasi dihasilkan via ${provider.name}`);
      return content;
    } catch (err) {
      console.warn(`[Groq] ${provider.name} gagal: ${err.message}`);
      errors.push(`${provider.name}: ${err.message}`);
    }
  }

  throw new Error(`Semua provider AI gagal: ${errors.join(' | ')}`);
}

/**
 * Parse teks narasi menjadi array kalimat
 * Memisahkan berdasarkan nomor, newline, atau titik
 */
function parseNarrationToLines(text) {
  // Hapus markdown formatting
  let clean = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#+\s/g, '')
    .replace(/`/g, '')
    .trim();

  // Split berdasarkan nomor (1. 2. dst) atau newline ganda
  let lines = clean
    .split(/\n{1,}/)
    .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(l => l.length > 10 && l.length <= 120);

  // Jika masih terlalu sedikit, split per kalimat
  if (lines.length < 4) {
    lines = clean
      .split(/[.!?]+/)
      .map(l => l.trim())
      .filter(l => l.length > 10 && l.length <= 120);
  }

  // Ambil maksimal 8 kalimat, minimal 5
  return lines.slice(0, 8);
}

/**
 * Generate narasi 8 kalimat singkat dari artikel untuk video Shorts
 * @param {Object} article - Artikel dari R2
 * @param {Object} category - Kategori dari categoryRotation.js
 * @returns {Object} { lines: string[], fullNarration: string, youtubeDescription: string }
 */
export async function generateNarration(article, category) {
  const title = article.title || 'Fakta Luar Angkasa';
  const content = article.content || article.excerpt || '';

  // Bersihkan konten dari markdown dan batasi panjang
  const cleanContent = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/Source:.*$/gm, '')
    .substring(0, 1500);

  const systemPrompt = `Kamu adalah penulis konten media sosial astronomi Indonesia yang keren dan antusias. 
Kamu membuat narasi singkat untuk video YouTube Shorts berdurasi 55 detik tentang topik: ${category.emoji} ${category.name}.
Gaya penulisan: santai, menarik, mudah dipahami masyarakat awam Indonesia, sedikit dramatis dan penuh semangat.`;

  const prompt = `Dari artikel berikut, buatkan TEPAT 8 kalimat narasi singkat dalam Bahasa Indonesia untuk video YouTube Shorts.

Judul Artikel: "${title}"

Isi Artikel:
${cleanContent}

ATURAN WAJIB:
1. Tepat 8 kalimat, setiap kalimat di baris baru
2. Setiap kalimat MAKSIMAL 90 karakter (harus bisa dibaca dalam 5 detik)
3. Mulai dengan fakta menarik atau pertanyaan untuk hook perhatian
4. Gunakan bahasa yang sangat santai dan antusias
5. Akhiri dengan ajakan ke website meteorit.my.id
6. JANGAN gunakan nomor, bullet, atau markdown
7. Output HANYA 8 kalimat saja, tidak lebih

Contoh format:
Tahukah kamu bahwa komet Halley terakhir melintas Bumi pada 1986?
Benda es raksasa ini bergerak dengan kecepatan 70 km per detik!
...dan seterusnya 6 kalimat lagi`;

  const rawNarration = await callAI(prompt, systemPrompt);
  const lines = parseNarrationToLines(rawNarration);

  // Pastikan minimal 5 kalimat
  if (lines.length < 5) {
    console.warn(`[Groq] Narasi hanya ${lines.length} kalimat, menggunakan excerpt sebagai fallback`);
    const fallbackLines = [
      `${category.emoji} ${title}`,
      article.excerpt?.substring(0, 90) || 'Fakta menarik dari luar angkasa!',
      'NASA terus memantau dan meneliti fenomena ini setiap hari.',
      'Para ilmuwan bekerja keras untuk mengungkap misteri alam semesta.',
      'Bumi kita ternyata dikelilingi banyak benda luar angkasa yang menakjubkan!',
      `Pelajari lebih lanjut di meteorit.my.id`,
    ];
    return {
      lines: fallbackLines,
      fullNarration: fallbackLines.join('\n'),
      youtubeDescription: buildYoutubeDescription(article, fallbackLines, category),
    };
  }

  return {
    lines,
    fullNarration: lines.join('\n'),
    youtubeDescription: buildYoutubeDescription(article, lines, category),
  };
}

/**
 * Build deskripsi YouTube dengan format template
 */
function buildYoutubeDescription(article, narrationLines, category) {
  const articleUrl = article.articleUrl || `https://www.meteorit.my.id/blog/${article.id}`;
  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return `${article.title}

${narrationLines.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Baca artikel lengkapnya:
🔗 ${articleUrl}

🌐 Kunjungi website kami:
👉 https://www.meteorit.my.id/

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 IKUTI KAMI:
• 🎬 YouTube  : @Meteorit-h7d
• 🌐 Website  : meteorit.my.id
• ✈️ Telegram : t.me/meteorit_channel

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${category.emoji} Kategori  : ${category.name}
📅 Tanggal  : ${today}
🔬 Sumber   : NASA Open Data APIs
🤖 Narasi   : AI Astronomi Meteorit Indonesia

━━━━━━━━━━━━━━━━━━━━━━━━━━━
${category.hashtags}
#astronomi #nasa #luarangkasa #indonesiaastromi #meteorit #shorts #faktaunik #sainsluarangkasa`;
}

/**
 * Generate judul YouTube yang menarik dan SEO-friendly
 */
export async function generateYouTubeTitle(article, category) {
  const title = article.title || 'Fakta Luar Angkasa';
  // Batasi judul YouTube max 100 karakter untuk Shorts
  let youtubeTitle = `${category.emoji} ${title}`;

  if (youtubeTitle.length > 90) {
    youtubeTitle = youtubeTitle.substring(0, 87) + '...';
  }

  // Tambahkan #Shorts di akhir jika masih muat
  if (youtubeTitle.length <= 93) {
    youtubeTitle += ' #Shorts';
  }

  return youtubeTitle;
}
