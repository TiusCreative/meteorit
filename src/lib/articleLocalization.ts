import { getSiteUrl } from './siteUrl';
import type { SiteLanguage } from './i18n';

export type ArticleTranslation = {
  title: string;
  excerpt: string;
  content: string;
  provider: string;
};

export type ArticleTranslations = Partial<Record<Exclude<SiteLanguage, 'id'>, ArticleTranslation>>;

const TARGET_LANGUAGES: { code: Exclude<SiteLanguage, 'id'>; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'zh', label: 'Mandarin Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ru', label: 'Russian' },
  { code: 'fr', label: 'French' },
];

async function translateWithProvider(
  languageLabel: string,
  source: { title: string; excerpt: string; content: string }
): Promise<ArticleTranslation | null> {
  const providers = [
    {
      name: 'Groq Llama 3.3 70B (Primary)',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
    },
    {
      name: 'OpenRouter Llama 3.3 70B (Primary)',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.3-70b-instruct:free',
    },
    {
      name: 'Groq Llama 3.1 8B (Backup)',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant',
    },
    {
      name: 'OpenRouter Llama 3.2 3B (Backup)',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.2-3b-instruct:free',
    },
  ];

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const provider of providers) {
    if (!provider.key) continue;

    try {
      let res: any = null;
      let attempt = 1;
      const maxAttempts = 3;

      while (attempt <= maxAttempts) {
        res = await fetch(provider.url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
            ...(provider.url.includes('openrouter.ai')
              ? {
                  'HTTP-Referer': getSiteUrl(),
                  'X-Title': 'Meteorit Indonesia',
                }
              : {}),
          },
          body: JSON.stringify({
            model: provider.model,
            temperature: 0.25,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You are a careful scientific translator. Keep Markdown or HTML structure intact and return only valid JSON.',
              },
              {
                role: 'user',
                content: `Translate this Indonesian science article into ${languageLabel}. Return JSON with "title", "excerpt", and "content".\n\n${JSON.stringify(source)}`,
              },
            ],
          }),
          signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(25000) : undefined,
        });

        if (res.status === 429) {
          console.warn(`[Article Translation] Rate limit (429) hit for ${provider.name} translating to ${languageLabel}. Attempt ${attempt}/${maxAttempts}. Waiting 5s...`);
          await delay(5000);
          attempt++;
          continue;
        }

        break;
      }

      if (!res || !res.ok) {
        console.warn(`[Article Translation] ${provider.name} failed with status: ${res?.status}`);
        continue;
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) continue;

      const parsed = JSON.parse(String(raw).replace(/```json|```/g, '').trim());
      if (parsed.title && parsed.excerpt && parsed.content) {
        return {
          title: String(parsed.title),
          excerpt: String(parsed.excerpt),
          content: String(parsed.content),
          provider: provider.name,
        };
      }
    } catch (error) {
      console.warn(`[Article Translation] ${provider.name} gagal:`, error);
    }
  }

  return null;
}

function fallbackTranslation(
  languageLabel: string,
  source: { title: string; excerpt: string; content: string }
): ArticleTranslation {
  return {
    title: source.title,
    excerpt: source.excerpt,
    content:
      `Catatan: terjemahan otomatis ke ${languageLabel} belum tersedia dari provider AI saat artikel ini dibuat.\n\n` +
      source.content,
    provider: 'Fallback source Indonesian',
  };
}

export async function buildArticleTranslations(source: {
  title: string;
  excerpt: string;
  content: string;
}): Promise<ArticleTranslations> {
  const entries: Array<[string, ArticleTranslation]> = [];
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const language of TARGET_LANGUAGES) {
    const translated = await translateWithProvider(language.label, source);
    entries.push([language.code, translated || fallbackTranslation(language.label, source)]);
    // Wait 2.5 seconds between languages to keep rate limit usage low
    await delay(2500);
  }

  return Object.fromEntries(entries) as ArticleTranslations;
}

export function pickLocalizedArticle<T extends {
  title: string;
  excerpt: string;
  content?: string;
  translations?: ArticleTranslations;
}>(article: T, locale: SiteLanguage): T {
  if (locale === 'id') return article;
  const trans = (article.translations?.[locale] || {}) as any;
  const enTrans = (article.translations?.['en'] || {}) as any;
  return {
    ...article,
    title: trans.title || enTrans.title || article.title,
    excerpt: trans.excerpt || enTrans.excerpt || article.excerpt,
    content: trans.content || enTrans.content || article.content,
  };
}
