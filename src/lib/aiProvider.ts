import { getSiteUrl } from './siteUrl';

export type AIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AIGenerateOptions = {
  messages: AIMessage[];
  temperature?: number;
  responseFormatJson?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
};

export type AIGenerateResult = {
  content: string;
  provider: string;
};

type ProviderConfig = {
  name: string;
  type: 'openai-compatible' | 'mistral' | 'cloudflare';
  url?: string;
  key?: string;
  model?: string;
  fallbackModels?: string[];
};

export async function generateWithAI(options: AIGenerateOptions): Promise<AIGenerateResult> {
  const { messages, temperature = 0.7, responseFormatJson = false, maxTokens, timeoutMs = 25000 } = options;

  const groqKeyPrimary = process.env.GROQ_API_KEY;
  const openRouterKeyPrimary = process.env.OPENROUTER_API_KEY;
  const cfAiToken = process.env.CLOUDFLARE_AI_TOKEN;
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const groqKeyBackup = process.env.GROQ_BACKUP_API_KEY;
  const openRouterKeyBackup = process.env.OPENROUTER_BACKUP_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  const cfAccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';

  // Order requested by user:
  // 1. Groq Utama
  // 2. OpenRouter Utama
  // 3. Cloudflare AI Token
  // 4. Cloudflare API Token
  // 5. Groq Backup
  // 6. OpenRouter Backup
  // 7. Mistral (Opsi Terakhir)
  const providers: ProviderConfig[] = [
    {
      name: 'Groq Utama',
      type: 'openai-compatible',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: groqKeyPrimary,
      // llama-3.3-70b-versatile & llama-3.1-8b-instant deprecated Aug 16 2026
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      fallbackModels: ['llama3-8b-8192'],
    },
    {
      name: 'OpenRouter Utama',
      type: 'openai-compatible',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKeyPrimary,
      model: 'meta-llama/llama-3.3-70b-instruct',
      fallbackModels: ['meta-llama/llama-3.2-3b-instruct:free', 'google/gemini-2.0-flash-lite-001'],
    },
    {
      name: 'Cloudflare Workers AI (AI Token)',
      type: 'cloudflare',
      key: cfAiToken,
      model: '@cf/meta/llama-3.1-8b-instruct',
    },
    {
      name: 'Cloudflare Workers AI (API Token)',
      type: 'cloudflare',
      key: cfApiToken,
      model: '@cf/meta/llama-3.1-8b-instruct',
    },
    {
      name: 'Groq Backup',
      type: 'openai-compatible',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: groqKeyBackup,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      fallbackModels: ['llama3-8b-8192'],
    },
    {
      name: 'OpenRouter Backup',
      type: 'openai-compatible',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKeyBackup,
      model: 'meta-llama/llama-3.3-70b-instruct',
      fallbackModels: ['meta-llama/llama-3.2-3b-instruct:free'],
    },
    {
      name: 'Mistral (Opsi Terakhir)',
      type: 'mistral',
      url: 'https://api.mistral.ai/v1/chat/completions',
      key: mistralKey,
      model: 'open-mistral-7b',
      fallbackModels: ['mistral-tiny', 'mistral-small-latest'],
    },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.key) continue;

    const modelsToTry = [provider.model!, ...(provider.fallbackModels || [])];

    for (const model of modelsToTry) {
      try {
        if (provider.type === 'openai-compatible' && provider.url) {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          };
          if (provider.url.includes('openrouter.ai')) {
            headers['HTTP-Referer'] = getSiteUrl();
            headers['X-Title'] = 'Meteorit Indonesia';
          }

          const body: Record<string, any> = {
            model,
            messages,
            temperature,
          };
          if (responseFormatJson) {
            body.response_format = { type: 'json_object' };
          }
          if (maxTokens) {
            body.max_tokens = maxTokens;
          }

          const res = await fetch(provider.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined,
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`${res.status} ${res.statusText}: ${errText.slice(0, 180)}`);
          }

          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && typeof content === 'string' && content.trim().length > 0) {
            return { content: content.trim(), provider: `${provider.name} (${model})` };
          }
          throw new Error('Respons AI kosong.');
        }

        if (provider.type === 'mistral' && provider.url) {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          };

          const body: Record<string, any> = {
            model,
            messages,
            temperature,
          };
          if (maxTokens) {
            body.max_tokens = maxTokens;
          }

          const res = await fetch(provider.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined,
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`${res.status} ${res.statusText}: ${errText.slice(0, 180)}`);
          }

          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && typeof content === 'string' && content.trim().length > 0) {
            return { content: content.trim(), provider: `${provider.name} (${model})` };
          }
          throw new Error('Respons Mistral kosong.');
        }

        if (provider.type === 'cloudflare') {
          if (!cfAccountId) throw new Error('Cloudflare Account ID tidak tersedia.');
          const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`;

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${provider.key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
            signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined,
          });

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`${res.status} ${res.statusText}: ${errText.slice(0, 180)}`);
          }

          const json = await res.json();
          const content = json.result?.response;
          if (content && typeof content === 'string' && content.trim().length > 0) {
            return { content: content.trim(), provider: provider.name };
          }
          throw new Error('Respons Cloudflare AI kosong.');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[AI Provider] ${provider.name} (${model}) gagal:`, msg);
        errors.push(`${provider.name} (${model}): ${msg}`);
      }
    }
  }

  throw new Error(`Semua provider AI gagal. ${errors.join(' | ')}`);
}

/**
 * Parse JSON dari respons AI secara aman.
 * Membersihkan karakter kontrol yang tidak valid di dalam JSON string literals
 * sebelum di-parse, sehingga menghindari error "Bad control character in string literal".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAIJson(raw: string): Record<string, any> {
  // Hapus markdown code fences yang mungkin membungkus JSON
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Coba parse langsung terlebih dahulu
  try {
    return JSON.parse(cleaned);
  } catch {
    // Escape karakter kontrol yang ada di dalam JSON string literals
    // Regex: cocokkan quoted string dan escape literal control chars di dalamnya
    const sanitized = cleaned.replace(
      /"((?:[^"\\]|\\.)*)"/g,
      (_match, group: string) => {
        const escaped = group
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        return `"${escaped}"`;
      }
    );
    return JSON.parse(sanitized);
  }
}
