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

import { generateWithAI, parseAIJson } from './aiProvider';

async function translateWithProvider(
  languageLabel: string,
  source: { title: string; excerpt: string; content: string }
): Promise<ArticleTranslation | null> {
  try {
    const result = await generateWithAI({
      messages: [
        {
          role: 'system',
          content:
            'You are a scientific translator. Keep Markdown formatting intact and return only valid JSON.',
        },
        {
          role: 'user',
          content: `Translate this Indonesian article into ${languageLabel}. Return JSON with "title", "excerpt", and "content".\n\n${JSON.stringify(source)}`,
        },
      ],
      temperature: 0.25,
      responseFormatJson: true,
      timeoutMs: 3500, // Strict 3.5s timeout per translation
    });

    const parsed = parseAIJson(String(result.content));
    if (parsed.title && parsed.excerpt && parsed.content) {
      return {
        title: String(parsed.title),
        excerpt: String(parsed.excerpt),
        content: String(parsed.content),
        provider: result.provider,
      };
    }
  } catch (error) {
    console.warn(`[Article Translation] Fast-fallback triggered for ${languageLabel}:`, error instanceof Error ? error.message : String(error));
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
    content: source.content,
    provider: 'Fallback source Indonesian',
  };
}

export async function buildArticleTranslations(source: {
  title: string;
  excerpt: string;
  content: string;
}): Promise<ArticleTranslations> {
  // Focus on core languages for fast auto-translation during cron
  const primaryLanguages = TARGET_LANGUAGES.slice(0, 2); // 'en', 'ms'
  
  const results = await Promise.allSettled(
    primaryLanguages.map(async (language) => {
      const translated = await translateWithProvider(language.label, source);
      return [
        language.code,
        translated || fallbackTranslation(language.label, source),
      ] as [string, ArticleTranslation];
    })
  );

  const entries: Array<[string, ArticleTranslation]> = [];
  for (const res of results) {
    if (res.status === 'fulfilled') {
      entries.push(res.value);
    }
  }

  // Fill in fallbacks for remaining languages instantly without API calls
  for (const lang of TARGET_LANGUAGES) {
    if (!entries.some(([code]) => code === lang.code)) {
      entries.push([lang.code, fallbackTranslation(lang.label, source)]);
    }
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
