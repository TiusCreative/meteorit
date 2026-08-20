// src/lib/groqNarration.js
// ============================================================
// Generate narasi pendek Bahasa Indonesia dari artikel
// menggunakan Groq AI (gratis, cepat) dengan fallback OpenRouter
// Output: Array 8 kalimat pendek untuk ditampilkan di video
// ============================================================

/**
 * Panggil AI dengan fallback provider terpusat (Groq, OpenRouter, Cloudflare, Mistral)
 */
async function callAI(prompt, systemPrompt = '') {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];

  const groqKeyPrimary = process.env.GROQ_API_KEY;
  const openRouterKeyPrimary = process.env.OPENROUTER_API_KEY;
  const cfAiToken = process.env.CLOUDFLARE_AI_TOKEN;
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const groqKeyBackup = process.env.GROQ_BACKUP_API_KEY;
  const openRouterKeyBackup = process.env.OPENROUTER_BACKUP_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const cfAccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';

  const providers = [
    {
      name: 'Groq Utama',
      type: 'openai',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: groqKeyPrimary,
      // llama-3.3-70b-versatile & llama-3.1-8b-instant deprecated Aug 16 2026
      models: ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama3-8b-8192'],
    },
    {
      name: 'OpenRouter Utama',
      type: 'openai',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKeyPrimary,
      models: ['meta-llama/llama-3.3-70b-instruct', 'meta-llama/llama-3.2-3b-instruct:free', 'google/gemini-2.0-flash-lite-001'],
    },
    {
      name: 'Cloudflare Workers AI (AI Token)',
      type: 'cloudflare',
      key: cfAiToken,
      models: ['@cf/meta/llama-3.1-8b-instruct'],
    },
    {
      name: 'Cloudflare Workers AI (API Token)',
      type: 'cloudflare',
      key: cfApiToken,
      models: ['@cf/meta/llama-3.1-8b-instruct'],
    },
    {
      name: 'Groq Backup',
      type: 'openai',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: groqKeyBackup,
      models: ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama3-8b-8192'],
    },
    {
      name: 'OpenRouter Backup',
      type: 'openai',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKeyBackup,
      models: ['meta-llama/llama-3.3-70b-instruct', 'meta-llama/llama-3.2-3b-instruct:free'],
    },
    {
      name: 'Mistral (Opsi Terakhir)',
      type: 'mistral',
      url: 'https://api.mistral.ai/v1/chat/completions',
      key: mistralKey,
      models: ['open-mistral-7b', 'mistral-tiny', 'mistral-small-latest'],
    },
  ];

  const errors = [];

  for (const provider of providers) {
    if (!provider.key) continue;

    for (const model of provider.models) {
      try {
        if (provider.type === 'openai' || provider.type === 'mistral') {
          const headers = {
            Authorization: `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          };
          if (provider.url.includes('openrouter')) {
            headers['HTTP-Referer'] = 'https://www.meteorit.my.id';
            headers['X-Title'] = 'Meteorit Indonesia YouTube';
          }

          const response = await fetch(provider.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.5,
              max_tokens: 600,
            }),
            signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(20000) : undefined,
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`HTTP ${response.status}: ${body.slice(0, 150)}`);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (!content) throw new Error('Respons AI kosong');

          console.log(`[Groq] ✅ Narasi dihasilkan via ${provider.name} (${model})`);
          return content;
        }

        if (provider.type === 'cloudflare') {
          if (!cfAccountId) throw new Error('Cloudflare Account ID tidak tersedia');
          const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`;

          const response = await fetch(cfUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${provider.key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
            signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(20000) : undefined,
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`HTTP ${response.status}: ${body.slice(0, 150)}`);
          }

          const data = await response.json();
          const content = data.result?.response?.trim();
          if (!content) throw new Error('Respons Cloudflare AI kosong');

          console.log(`[Groq] ✅ Narasi dihasilkan via ${provider.name} (${model})`);
          return content;
        }
      } catch (err) {
        console.warn(`[Groq] ${provider.name} (${model}) gagal: ${err.message}`);
        errors.push(`${provider.name} (${model}): ${err.message}`);
      }
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
