import { NextRequest, NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1Client';
import { fetchJsonFromR2 } from '@/lib/r2Client';
import R2_CONFIG from '@/lib/cloudflareR2Config';
import { getSiteUrl } from '@/lib/siteUrl';
import adminApp from '@/lib/firebaseAdmin';
import { findCachedAnswer, saveQAToCache, sanitizeInternalLinks } from '@/lib/chatbotCache';

export const dynamic = 'force-dynamic';

// Sliding window Rate Limiter in-memory store
// key: `user:${uid}` or `guest:${ip}`
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

function checkRateLimit(key: string, limit: number, windowMs = 3600000): { allowed: boolean; remaining: number; resetInMinutes: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInMinutes: 60 };
  }

  if (record.count >= limit) {
    const resetInMinutes = Math.ceil((record.resetAt - now) / 60000);
    return { allowed: false, remaining: 0, resetInMinutes };
  }

  record.count += 1;
  const remaining = limit - record.count;
  const resetInMinutes = Math.ceil((record.resetAt - now) / 60000);
  return { allowed: true, remaining, resetInMinutes };
}

// Clean up stale rate limits every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitStore.entries()) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}, 15 * 60 * 1000);

// Knowledge Retrieval for Prompt Enrichment
async function retrieveKnowledgeContext(query: string): Promise<string> {
  if (!query || query.trim().length < 2) return '';
  const qLower = query.toLowerCase().trim();

  const isLatestQuery = /terbaru|terkini|baru|terakhir|latest|newest/i.test(qLower);
  const stopWords = new Set(['yang', 'dan', 'di', 'ke', 'dari', 'apa', 'itu', 'ada', 'batu', 'meteor', 'meteorit', 'terbaru', 'terkini', 'baru', 'tolong', 'bisa', 'saya', 'mau', 'tanya', 'artikel']);
  const keywords = qLower.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)).slice(0, 4);

  const resultsText: string[] = [];

  // 1. Search Meteorite Encyclopedia
  try {
    let meteorites: any[] = [];
    if (isLatestQuery) {
      try {
        const d1Res = await queryD1(
          `SELECT id, name, translated_name, mass, year, recclass, description, translated_description 
           FROM meteorites 
           ORDER BY CAST(year AS INTEGER) DESC LIMIT 3`
        );
        meteorites = d1Res.results || [];
      } catch {
        const catalogRes = await fetch(`${R2_CONFIG.publicUrl}/data/meteorites/catalog.json?t=${Date.now()}`);
        if (catalogRes.ok) {
          const catalog: any[] = await catalogRes.json();
          meteorites = [...catalog].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0)).slice(0, 3);
        }
      }
    } else if (keywords.length > 0) {
      const searchKw = keywords[0];
      try {
        const d1Res = await queryD1(
          `SELECT id, name, translated_name, mass, year, recclass, description, translated_description 
           FROM meteorites 
           WHERE (name LIKE ? OR translated_name LIKE ? OR recclass LIKE ? OR description LIKE ? OR translated_description LIKE ?) 
           LIMIT 3`,
          [`%${searchKw}%`, `%${searchKw}%`, `%${searchKw}%`, `%${searchKw}%`, `%${searchKw}%`]
        );
        meteorites = d1Res.results || [];
      } catch {
        const catalogRes = await fetch(`${R2_CONFIG.publicUrl}/data/meteorites/catalog.json?t=${Date.now()}`);
        if (catalogRes.ok) {
          const catalog: any[] = await catalogRes.json();
          meteorites = catalog.filter(m => 
            keywords.some(kw => 
              m.name?.toLowerCase().includes(kw) || 
              m.translated_name?.toLowerCase().includes(kw) || 
              m.recclass?.toLowerCase().includes(kw) ||
              m.description?.toLowerCase().includes(kw)
            )
          ).slice(0, 3);
        }
      }
    } else {
      try {
        const d1Res = await queryD1(
          `SELECT id, name, translated_name, mass, year, recclass, description, translated_description 
           FROM meteorites LIMIT 3`
        );
        meteorites = d1Res.results || [];
      } catch {
        const catalogRes = await fetch(`${R2_CONFIG.publicUrl}/data/meteorites/catalog.json?t=${Date.now()}`);
        if (catalogRes.ok) {
          const catalog: any[] = await catalogRes.json();
          meteorites = catalog.slice(0, 3);
        }
      }
    }

    if (meteorites.length > 0) {
      resultsText.push('--- Ensiklopedia Meteorit Terkait ---');
      meteorites.forEach(m => {
        const name = m.translated_name || m.name;
        const desc = (m.translated_description || m.description || '').slice(0, 150);
        resultsText.push(`- **${name}** (Tipe: ${m.recclass || 'Meteorit'}, Massa: ${m.mass || 'N/A'}g, Tahun: ${m.year || 'N/A'}): ${desc}... [Buka Ensiklopedia](/ensiklopedia/${m.id})`);
      });
    }
  } catch (e) {
    console.warn('[Chatbot API] Error searching meteorites:', e);
  }

  // 2. Search Articles
  try {
    let articles: any[] = [];
    if (isLatestQuery) {
      try {
        const d1Res = await queryD1(
          `SELECT id, title, category, excerpt FROM articles 
           WHERE status = 'Published' 
           ORDER BY createdAt DESC LIMIT 3`
        );
        articles = d1Res.results || [];
      } catch {
        const posts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
        articles = posts.filter(p => p.status === 'Published').slice(0, 3);
      }
    } else if (keywords.length > 0) {
      const searchKw = keywords[0];
      try {
        const d1Res = await queryD1(
          `SELECT id, title, category, excerpt FROM articles 
           WHERE status = 'Published' AND (title LIKE ? OR excerpt LIKE ? OR category LIKE ?) 
           ORDER BY createdAt DESC LIMIT 3`,
          [`%${searchKw}%`, `%${searchKw}%`, `%${searchKw}%`]
        );
        articles = d1Res.results || [];
      } catch {
        const posts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
        articles = posts.filter(p => 
          p.status === 'Published' && keywords.some(kw => 
            p.title?.toLowerCase().includes(kw) || 
            p.excerpt?.toLowerCase().includes(kw) ||
            p.category?.toLowerCase().includes(kw)
          )
        ).slice(0, 3);
      }
    } else {
      try {
        const d1Res = await queryD1(
          `SELECT id, title, category, excerpt FROM articles 
           WHERE status = 'Published' ORDER BY createdAt DESC LIMIT 3`
        );
        articles = d1Res.results || [];
      } catch {
        const posts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
        articles = posts.filter(p => p.status === 'Published').slice(0, 3);
      }
    }

    if (articles.length > 0) {
      resultsText.push('--- Artikel Website Terkait ---');
      articles.forEach(art => {
        const cat = art.category || 'Blog';
        let path = `/blog/${art.id}`;
        if (cat === 'Mars') path = `/mars/${art.id}`;
        else if (cat === 'Fireball') path = `/fireball/${art.id}`;
        else if (cat === 'Eonet') path = `/eonet/${art.id}`;
        resultsText.push(`- **[${art.title}](${path})** (${cat}): ${(art.excerpt || '').slice(0, 150)}...`);
      });
    }
  } catch (e) {
    console.warn('[Chatbot API] Error searching articles:', e);
  }

  return resultsText.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, idToken } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Format pesan tidak valid' }, { status: 400 });
    }

    // 1. Verify User (Guest vs Logged-in User)
    let isUserLoggedIn = false;
    let userId = `guest_${getClientIp(req)}`;

    if (idToken && typeof idToken === 'string') {
      try {
        if (adminApp) {
          const { getAuth } = await import('firebase-admin/auth');
          const decoded = await getAuth(adminApp).verifyIdToken(idToken);
          if (decoded && decoded.uid) {
            isUserLoggedIn = true;
            userId = `user_${decoded.uid}`;
          }
        }
      } catch (err) {
        console.warn('[Chatbot API] Token verification failed:', err);
      }
    }

    // 2. Extract latest query & Check R2 Q&A Cache to save AI quota
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const limit = isUserLoggedIn ? 20 : 5;

    if (latestUserMessage) {
      const cachedMatch = await findCachedAnswer(latestUserMessage);
      if (cachedMatch) {
        return NextResponse.json({
          reply: cachedMatch.answer,
          remaining: limit,
          limit,
          resetInMinutes: 60,
          isUserLoggedIn,
          provider: 'R2 Cache (Terhemat)',
          isCached: true,
        });
      }
    }

    // 3. Enforce Rate Limiting for fresh AI calls
    const { allowed, remaining, resetInMinutes } = checkRateLimit(userId, limit);

    if (!allowed) {
      return NextResponse.json(
        {
          error: `Batas pesan tercapai (${limit} pesan/jam untuk ${isUserLoggedIn ? 'pengguna terdaftar' : 'tamu'}). Silakan tunggu ${resetInMinutes} menit lagi${!isUserLoggedIn ? ' atau Login untuk kuota 20 pesan/jam' : ''}.`,
          remaining: 0,
          limit,
          resetInMinutes,
          isUserLoggedIn,
        },
        { status: 429 }
      );
    }

    // 4. Build context
    const knowledgeContext = await retrieveKnowledgeContext(latestUserMessage);

    const systemPrompt = `Anda adalah "Meteorit Indonesia AI Assistant", asisten AI resmi platform Meteorit Indonesia (meteorit.my.id).

TUGAS DAN UTAMAKAN MEMBERIKAN LINK INTERNAL:
1. PRIORITAS UTAMA - MEMBERIKAN HYPERLINK INTERNAL:
   Di setiap jawaban yang Anda berikan, HARUS memprioritaskan memberikan hyperlink Markdown ke halaman/fitur internal aplikasi yang relevan agar pengguna bisa langsung mengkliknya.

2. DAFTAR ROUTE INTERNAL RESMI YANG VALID (DILARANG KERAS MEMBUAT URL 404 / KOSONG / FIKTIF):
   Gunakan HANYA URL internal valid berikut untuk rekomendasi maupun penjelasan fitur:
   - Ensiklopedia Meteorit: [Ensiklopedia Meteorit](/ensiklopedia)
   - Peta Langit Malam (Starchart): [Peta Langit Malam](/langit-malam)
   - Foto Astronomi Harian (APOD): [APOD NASA](/apod)
   - Artikel & Berita Sains: [Artikel & Berita](/blog)
   - Cuaca Luar Angkasa & Badai Matahari: [Cuaca Luar Angkasa](/cuaca)
   - Komet & Asteroid Dekat Bumi (NEO): [Komet & Asteroid](/komet)
   - Eksplorasi Planet Mars & Rover NASA: [Eksplorasi Mars](/mars)
   - Pemantauan Bola Api (Fireball Data): [Pemantauan Fireball](/fireball)
   - Peristiwa Bencana Alam NASA EONET: [Event Bencana EONET](/eonet)
   - Peringatan Dini Kebencanaan Earth (TEWS): [Peringatan Dini Kebencanaan](/kebencanaan)
   - Forum Komunitas & Diskusi Astronomi: [Forum Komunitas](/forum)
   - Informasi Data Astronot: [Informasi Astronot](/astronot)
   - Kamus & Glosarium Istilah Astronomi: [Glosarium Astronomi](/glossarium)
   - Monitoring Satelit NASA EPIC: [Monitoring Satelit EPIC](/monitoring-epic)
   - Tentang Meteorit Indonesia: [Tentang Kami](/tentang)
   - Visi & Misi Platform: [Visi & Misi](/visi-misi)
   - Kontak Tim: [Kontak Kami](/kontak)
   - Login Pengguna: [Login Pengguna](/login)
   - Detail Spesifik (hanya jika ID tersedia di Konteks Basis Pengetahuan): [Nama Meteorit](/ensiklopedia/ID), [Judul Artikel](/blog/ID), [Detail Mars](/mars/ID), [Detail Fireball](/fireball/ID), [Detail EONET](/eonet/ID).

3. ATURAN BEBAS LINK KOSONG / 404:
   - Dilarang keras memberikan link 404 atau URL imajiner yang tidak ada di daftar di atas (misal: /meteor, /search, /article, /fitur, dll).
   - Gunakan format Markdown [Label Jelas](/path-valid) agar otomatis menjadi link aktif yang dapat diklik di UI.

4. BAHASA & GAYA JAWABAN:
   - Berkomunikasi multi-bahasa: Jawab dalam bahasa yang sama dengan pertanyaan pengguna (Indonesia, English, dll).
   - Singkat, ramah, ilmiah, dan informatif (2-3 paragraf ringkas).

${knowledgeContext ? `Konteks Basis Pengetahuan Meteorit Indonesia:\n${knowledgeContext}\n` : ''}`;

    // Limit conversation history to last 6 messages
    const trimmedHistory = messages.slice(-6).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || ''),
    }));

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory
    ];

    // 4. LLM Providers Fallback Execution
    const providers = [
      // Primary: Groq API with GROQ_BACKUP_API_KEY / GROQ_API_KEY
      {
        name: 'Groq (Backup Key)',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_BACKUP_API_KEY || process.env.GROQ_API_KEY,
        model: 'llama-3.1-8b-instant',
      },
      {
        name: 'Groq (Primary Key)',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        model: 'llama-3.1-8b-instant',
      },
      // Fallback 1: OpenRouter API
      {
        name: 'OpenRouter (Backup Key)',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: process.env.OPENROUTER_BACKUP_API_KEY || process.env.OPENROUTER_API_KEY,
        model: 'meta-llama/llama-3.1-8b-instruct:free',
      },
      {
        name: 'OpenRouter (Primary Key)',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: process.env.OPENROUTER_API_KEY,
        model: 'google/gemini-2.5-flash',
      },
      // Fallback 2: Mistral API
      {
        name: 'Mistral API',
        url: 'https://api.mistral.ai/v1/chat/completions',
        key: process.env.MISTRAL_API_KEY,
        model: 'open-mistral-7b',
      },
    ];

    let replyText = '';
    let usedProvider = '';

    for (const provider of providers) {
      if (!provider.key) continue;

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
        };

        if (provider.url.includes('openrouter.ai')) {
          headers['HTTP-Referer'] = getSiteUrl();
          headers['X-Title'] = 'Meteorit Indonesia Chatbot';
        }

        const res = await fetch(provider.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: provider.model,
            messages: fullMessages,
            temperature: 0.6,
            max_tokens: 350,
          }),
          signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(12000) : undefined,
        });

        if (!res.ok) {
          console.warn(`[Chatbot API] Provider ${provider.name} status ${res.status}`);
          continue;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;

        if (content && typeof content === 'string' && content.trim().length > 0) {
          replyText = content.trim();
          usedProvider = provider.name;
          break; // Success!
        }
      } catch (err) {
        console.warn(`[Chatbot API] Provider ${provider.name} failed:`, err);
      }
    }

    if (!replyText) {
      replyText = 'Maaf, sistem AI sedang mengalami peningkatan traffic. Silakan coba kirim pesan Anda kembali beberapa saat lagi.';
    } else {
      // Sanitize any potential invalid / 404 internal links to valid parent category routes
      replyText = sanitizeInternalLinks(replyText);

      if (usedProvider && latestUserMessage) {
        // Auto-save valid Q&A pair to Cloudflare R2 JSON to conserve AI quota
        saveQAToCache(latestUserMessage, replyText, usedProvider).catch(err => {
          console.warn('[Chatbot API] Error saving QA to R2 cache:', err);
        });
      }
    }

    return NextResponse.json({
      reply: replyText,
      remaining,
      limit,
      resetInMinutes,
      isUserLoggedIn,
      provider: usedProvider,
    });

  } catch (error: any) {
    console.error('[Chatbot API] Internal Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem internal' }, { status: 500 });
  }
}
