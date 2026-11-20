/**
 * src/lib/translator.ts
 * 
 * Central Translation Utility for Meteorit Indonesia
 * Supports cascading fallbacks through multiple AI endpoints and translation APIs:
 * 1. OpenRouter (Llama 3.3 70B Instruct / Gemini Flash) via aiProvider.ts
 * 2. Cloudflare Workers AI (Llama 3.1 8B Instruct)
 * 3. Groq (Llama 3.3 70B / Llama 3.1 8B)
 * 4. Mistral
 * 5. Free HTTP Translation Fallback with strict error guarding
 */

import { generateWithAI } from './aiProvider';

export async function translateText(
  text: string,
  systemPrompt = 'Terjemahkan teks berikut ke bahasa Indonesia secara lengkap dan akurat. Jangan memotong teks.',
  locale = 'id'
): Promise<string> {
  if (!text || text.trim() === '') return '';

  const cleanText = text.trim();

  // 1. Primary: High-fidelity AI Translation
  try {
    const result = await generateWithAI({
      messages: [
        {
          role: 'system',
          content: `${systemPrompt} Pertahankan nama ilmiah, nama misi, nama objek astronomi (misalnya NGC, Hubble, James Webb Space Telescope), dan format paragraf. Kembalikan HANYA hasil terjemahan langsung tanpa tanda kutip dan tanpa kata pengantar.`
        },
        {
          role: 'user',
          content: cleanText
        }
      ],
      temperature: 0.1,
      timeoutMs: 25000,
    });

    if (result.content) {
      let translated = result.content.trim();
      // Clean quotes if LLM wrapped in quotes
      if (
        (translated.startsWith('"') && translated.endsWith('"')) ||
        (translated.startsWith('“') && translated.endsWith('”'))
      ) {
        translated = translated.slice(1, -1).trim();
      }

      // Ensure it actually translated and didn't just echo identical long English text
      if (!(translated === cleanText && cleanText.length > 30)) {
        return translated;
      }
    }
  } catch (error) {
    console.warn('[Translator] AI translation failed, falling back to secondary translator:', error);
  }

  // 2. Secondary Fallback: MyMemory Translation API
  try {
    const targetLang = locale === 'zh' ? 'zh-CN' : locale;
    const chunks: string[] = [];
    // MyMemory has ~500 chars limit per query, split by sentences or paragraphs if needed
    const sentences = cleanText.split('\n');
    for (const para of sentences) {
      if (!para.trim()) {
        chunks.push('');
        continue;
      }
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(para.slice(0, 480))}&langpair=en|${targetLang}`;
      const res = await fetch(myMemoryUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeteoritIndonesia/1.0)' },
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(6000) : undefined,
      });
      if (res.ok) {
        const json = await res.json();
        const translatedPara = json.responseData?.translatedText;
        if (translatedPara && !translatedPara.includes('QUERY LENGTH LIMIT')) {
          chunks.push(translatedPara);
          continue;
        }
      }
      chunks.push(para);
    }

    const combined = chunks.join('\n').trim();
    if (combined && combined !== cleanText) {
      return combined;
    }
  } catch (err) {
    console.warn('[Translator] Secondary translation fallback error:', err);
  }

  // Return the original text as last resort
  return cleanText;
}
