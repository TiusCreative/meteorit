/**
 * Central Translation Utility for Meteorit Indonesia
 * Supports cascading fallbacks through multiple AI endpoints and Google Translate:
 * 1. Groq (meta-llama/llama-4-scout-17b-16e-instruct) — via aiProvider.ts
 * 2. Cloudflare Workers AI (Llama 3 Instruct)
 * 3. OpenRouter (Llama 3.3 Instruct Free)
 * 4. Mistral (mistral-tiny)
 * 5. Google Translate Client (Free/No-Key Fallback - 100% Reliable)
 */

import { generateWithAI } from './aiProvider';

export async function translateText(
  text: string,
  systemPrompt = 'Terjemahkan teks berikut ke bahasa Indonesia.',
  locale = 'id'
): Promise<string> {
  if (!text || text.trim() === '') return '';

  try {
    const result = await generateWithAI({
      messages: [
        { role: 'user', content: `${systemPrompt}\n\nText to translate:\n"${text}"` }
      ],
      temperature: 0.1,
      timeoutMs: 15000,
    });

    if (result.content) {
      const translated = result.content.trim();
      if (!(translated === text && text.length > 10)) {
        return translated;
      }
    }
  } catch (error) {
    console.warn('[Translator] All AI providers failed, falling back to Google free translate:', error);
  }

  // Ultimate Fallback: Google Translate Free Client (100% reliable, no key needed)
  try {
    const targetLang = locale === 'zh' ? 'zh-CN' : locale;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (response.ok) {
      const json = await response.json();
      const sentences = json[0];
      if (Array.isArray(sentences)) {
        const translated = sentences.map(s => s[0]).join('').trim();
        if (translated && translated !== '') {
          return translated;
        }
      }
    }
  } catch (error) {
    console.warn(`[Translator] Google free fallback failed:`, error);
  }

  // Return the original text as a last resort
  return text;
}
