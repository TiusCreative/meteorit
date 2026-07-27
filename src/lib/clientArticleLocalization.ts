import type { SiteLanguage } from './i18n';
import type { ArticleTranslations } from './articleLocalization';

export type LocalizableArticle = {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  translations?: ArticleTranslations;
};

/**
 * Bahasa yang tidak perlu on-the-fly translate (sudah di-generate waktu cron).
 * Untuk ru dan fr, kita perlu on-the-fly karena data lama mungkin belum punya.
 */
const CRON_LANGUAGES = new Set(['id', 'en', 'ms', 'zh', 'ja']);

export function localizeArticle<T extends LocalizableArticle>(article: T, language: SiteLanguage): T {
  if (language === 'id') return article;
  const trans = (article.translations?.[language] || {}) as any;
  const enTrans = (article.translations?.['en'] || {}) as any;

  return {
    ...article,
    title: trans.title || enTrans.title || article.title,
    excerpt: trans.excerpt || enTrans.excerpt || article.excerpt,
    content: trans.content || enTrans.content || article.content,
  };
}

/**
 * Cek apakah artikel sudah punya terjemahan untuk bahasa tersebut.
 */
export function articleHasTranslation(article: LocalizableArticle, language: SiteLanguage): boolean {
  if (language === 'id') return true;
  const trans = article.translations?.[language] as any;
  return !!(trans?.title && trans?.excerpt);
}

/**
 * Untuk bahasa yang tidak punya terjemahan (ru, fr pada artikel lama),
 * fetch on-the-fly dari API dan cache hasilnya.
 * Mengembalikan { title, excerpt } atau null jika gagal.
 */
export async function fetchArticleTranslation(
  articleId: string,
  language: SiteLanguage,
  collection: string = 'articles'
): Promise<{ title: string; excerpt: string } | null> {
  try {
    const res = await fetch(
      `/api/articles/translate?id=${encodeURIComponent(articleId)}&locale=${language}&collection=${encodeURIComponent(collection)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.title && data.excerpt) {
      return { title: data.title, excerpt: data.excerpt };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Perlu on-the-fly translate jika:
 * - Bahasa bukan 'id'
 * - Bahasa bukan salah satu yg selalu ada dari cron (en, ms, zh, ja)
 * - ATAU adalah bahasa cron tapi article tidak punya terjemahannya
 */
export function needsOnTheFlyTranslation(article: LocalizableArticle, language: SiteLanguage): boolean {
  if (language === 'id') return false;
  return !articleHasTranslation(article, language);
}

const categoryTranslations: Record<string, Partial<Record<SiteLanguage, string>>> = {
  Panduan: { en: 'Guide', ms: 'Panduan', zh: '指南', ja: 'ガイド', ru: 'Руководство', fr: 'Guide' },
  Peristiwa: { en: 'Events', ms: 'Peristiwa', zh: '事件', ja: '出来事', ru: 'События', fr: 'Événements' },
  Sejarah: { en: 'History', ms: 'Sejarah', zh: '历史', ja: '歴史', ru: 'История', fr: 'Histoire' },
  Edukasi: { en: 'Education', ms: 'Edukasi', zh: '教育', ja: '教育', ru: 'Образование', fr: 'Éducation' },
  Trivia: { en: 'Trivia', ms: 'Trivia', zh: '冷知识', ja: '豆知識', ru: 'Факты', fr: 'Anecdotes' },
  'Komet & Asteroid': { en: 'Comets & Asteroids', ms: 'Komet & Asteroid', zh: '彗星与小行星', ja: '彗星・小惑星', ru: 'Кометы и астероиды', fr: 'Comètes & Astéroïdes' },
  'Planet Mars': { en: 'Mars', ms: 'Planet Marikh', zh: '火星', ja: '火星', ru: 'Марс', fr: 'Mars' },
  'Bola Api & Fireball': { en: 'Fireballs & Meteors', ms: 'Bola Api & Meteor', zh: '火球与流星', ja: '火球・流星', ru: 'Болиды и метеоры', fr: 'Boules de feu & Météores' },
  'Peristiwa Alam': { en: 'Natural Events', ms: 'Peristiwa Alam', zh: '自然灾害事件', ja: '自然災害・現象', ru: 'Природные события', fr: 'Événements naturels' },
  Astronot: { en: 'Astronauts', ms: 'Angkasawan', zh: '宇航员', ja: '宇宙飛行士', ru: 'Космонавты', fr: 'Astronautes' },
  APOD: { en: 'Astronomy Picture of the Day', ms: 'Foto Astronomi Harian', zh: '每日天文图', ja: '今日の天文写真', ru: 'Астрономическая картинка дня', fr: 'Photo astronomique du jour' },
};

export function localizeCategory(category: string, language: SiteLanguage) {
  if (language === 'id') return category;
  return categoryTranslations[category]?.[language] || category;
}
