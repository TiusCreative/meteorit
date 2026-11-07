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
  const { messages, temperature = 0.7, responseFormatJson = false, maxTokens, timeoutMs = 8000 } = options;

  const groqKeyPrimary = process.env.GROQ_API_KEY;
  const openRouterKeyPrimary = process.env.OPENROUTER_API_KEY;
  const cfAiToken = process.env.CLOUDFLARE_AI_TOKEN;
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const groqKeyBackup = process.env.GROQ_BACKUP_API_KEY;
  const openRouterKeyBackup = process.env.OPENROUTER_BACKUP_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  const cfAccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || '';

  // Order of providers:
  // 1. Cloudflare Workers AI (AI Token) - Lightning fast, reliable
  // 2. OpenRouter Utama
  // 3. Groq Utama (Llama 3.3 70B / Llama 3.1 8B)
  // 4. Cloudflare Workers AI (API Token)
  // 5. Groq Backup
  // 6. OpenRouter Backup
  // 7. Mistral (Latest models)
  const providers: ProviderConfig[] = [
    {
      name: 'Cloudflare Workers AI (AI Token)',
      type: 'cloudflare',
      key: cfAiToken,
      model: '@cf/meta/llama-3.1-8b-instruct',
    },
    {
      name: 'Groq Utama',
      type: 'openai-compatible',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: groqKeyPrimary,
      model: 'llama-3.3-70b-versatile',
      fallbackModels: ['llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'],
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
      model: 'llama-3.3-70b-versatile',
      fallbackModels: ['llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'],
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
      name: 'Mistral',
      type: 'mistral',
      url: 'https://api.mistral.ai/v1/chat/completions',
      key: mistralKey,
      model: 'mistral-small-latest',
      fallbackModels: ['ministral-8b-latest', 'ministral-3b-latest'],
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
 * Sanitasi string JSON dari LLM secara karakter-demi-karakter.
 * Menangani:
 * - Markdown code block fences (```json ... ```)
 * - Teks percakapan di luar struktur JSON
 * - Karakter kontrol (newline 0x0A, carriage return 0x0D, tab 0x09, 0x00-0x1F) di dalam string literal
 * - Tanda petik ganda tidak ter-escape di dalam nilai string
 * - Koma ekstra (trailing comma) sebelum kurung tutup
 * - Respons terpotong akibat max_tokens limit (auto-close string & bracket)
 */
export function sanitizeJsonString(raw: string): string {
  let str = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');

  let start = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }

  if (start !== -1) {
    str = str.substring(start);
  }

  let result = '';
  let inString = false;
  let isEscaped = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);

    if (!inString) {
      if (char === '{') {
        stack.push('}');
        result += char;
      } else if (char === '[') {
        stack.push(']');
        result += char;
      } else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
        result += char;
      } else if (char === '"') {
        inString = true;
        isEscaped = false;
        result += char;
      } else {
        result += char;
      }
    } else {
      if (isEscaped) {
        if ('"\\/bfnrtu'.includes(char)) {
          result += char;
        } else {
          result += '\\' + char;
        }
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
        result += char;
      } else if (char === '"') {
        let nextNonSpace = '';
        for (let j = i + 1; j < str.length; j++) {
          if (!' \t\n\r'.includes(str[j])) {
            nextNonSpace = str[j];
            break;
          }
        }
        if (':,}]'.includes(nextNonSpace) || nextNonSpace === '') {
          inString = false;
          result += char;
        } else {
          result += '\\"';
        }
      } else if (code < 32) {
        if (char === '\n') result += '\\n';
        else if (char === '\r') result += '\\r';
        else if (char === '\t') result += '\\t';
        else if (char === '\b') result += '\\b';
        else if (char === '\f') result += '\\f';
        else {
          const hex = code.toString(16).padStart(4, '0');
          result += '\\u' + hex;
        }
      } else {
        result += char;
      }
    }
  }

  if (inString) {
    result += '"';
  }

  result = result.replace(/,\s*([}\]])/g, '$1');
  result = result.replace(/,\s*$/, '');

  while (stack.length > 0) {
    result += stack.pop();
  }

  return result;
}

/**
 * Parse JSON dari respons AI secara aman.
 * Membersihkan karakter kontrol yang tidak valid dan format yang rusak di dalam JSON string literals
 * sebelum di-parse, sehingga menghindari error "Bad control character in string literal".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAIJson<T = Record<string, any>>(raw: string): T {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Input string ke parseAIJson kosong.');
  }

  // Coba parse langsung terlebih dahulu
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    // Jalankan pembersihan penuh dengan scanner karakter
    const sanitized = sanitizeJsonString(raw);
    return JSON.parse(sanitized);
  }
}

