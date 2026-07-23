/**
 * Central Translation Utility for Meteorit Indonesia
 * Supports cascading fallbacks through multiple AI endpoints and Google Translate:
 * 1. Groq (llama-3.1-8b-instant)
 * 2. Cloudflare Workers AI (Llama 3 Instruct)
 * 3. OpenRouter (Llama 3.3 Instruct Free)
 * 4. Mistral (mistral-tiny)
 * 5. Google Translate Client (Free/No-Key Fallback - 100% Reliable)
 */

export async function translateText(
  text: string,
  systemPrompt = 'Terjemahkan teks berikut ke bahasa Indonesia.',
  locale = 'id'
): Promise<string> {
  if (!text || text.trim() === '') return '';

  // 1. Try Groq (Llama-3.1)
  const groqKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_BACKUP_API_KEY
  ].filter(Boolean) as string[];

  for (const key of groqKeys) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nText to translate:\n"${text}"` }
          ],
          temperature: 0.1
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.choices && result.choices[0]?.message?.content) {
          const translated = result.choices[0].message.content.trim();
          if (!(translated === text && text.length > 10)) {
            return translated;
          }
        }
      }
    } catch (error) {
      console.warn(`[Translator] Groq key failed:`, error);
    }
  }

  // 2. Try Cloudflare Workers AI
  const cfAiToken = process.env.CLOUDFLARE_AI_TOKEN || '';
  const cfAccountId = process.env.R2_ACCOUNT_ID || '';
  
  if (cfAiToken && cfAccountId) {
    try {
      const model = '@cf/meta/llama-3-8b-instruct';
      const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`;
      const response = await fetch(url, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${cfAiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ]
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.result?.response) {
          const translated = json.result.response.trim();
          if (!(translated === text && text.length > 10)) {
            return translated;
          }
        }
      }
    } catch (error) {
      console.warn(`[Translator] Cloudflare Workers AI failed:`, error);
    }
  }

  // 3. Try OpenRouter
  const openRouterKeys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_BACKUP_API_KEY
  ].filter(Boolean) as string[];

  for (const key of openRouterKeys) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nText to translate:\n"${text}"` }
          ],
          temperature: 0.1
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.choices && result.choices[0]?.message?.content) {
          const translated = result.choices[0].message.content.trim();
          if (!(translated === text && text.length > 10)) {
            return translated;
          }
        }
      }
    } catch (error) {
      console.warn(`[Translator] OpenRouter key failed:`, error);
    }
  }

  // 4. Try Mistral
  if (process.env.MISTRAL_API_KEY) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-tiny',
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nText to translate:\n"${text}"` }
          ],
          temperature: 0.1
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.choices && result.choices[0]?.message?.content) {
          const translated = result.choices[0].message.content.trim();
          if (!(translated === text && text.length > 10)) {
            return translated;
          }
        }
      }
    } catch (error) {
      console.warn(`[Translator] Mistral failed:`, error);
    }
  }

  // 5. Ultimate Fallback: Google Translate Free Client (100% reliable, no key needed)
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
