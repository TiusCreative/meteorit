export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
  zh: 'Mandarin Chinese',
  ja: 'Japanese',
  ru: 'Russian',
  fr: 'French',
};

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.meteorit.my.id';

import { generateWithAI, parseAIJson } from '@/lib/aiProvider';

// Translate title + excerpt + content
async function translateFields(
  title: string,
  excerpt: string,
  content: string,
  langLabel: string
): Promise<{ title: string; excerpt: string; content: string } | null> {
  try {
    const result = await generateWithAI({
      messages: [
        {
          role: 'system',
          content: `You are a careful scientific translator. Keep HTML, headings, or Markdown structures intact and return only a valid JSON object.`,
        },
        {
          role: 'user',
          content: `Translate this Indonesian science article into ${langLabel}. Return JSON with "title", "excerpt", and "content" keys.
          
          Source:
          ${JSON.stringify({ title, excerpt, content })}`,
        },
      ],
      temperature: 0.25,
      responseFormatJson: true,
      timeoutMs: 25000,
    });

    const parsed = parseAIJson(String(result.content));
    if (parsed.title && parsed.excerpt && parsed.content) {
      return {
        title: String(parsed.title),
        excerpt: String(parsed.excerpt),
        content: String(parsed.content),
      };
    }
  } catch (err) {
    console.warn(`[Article Translate] AI translation failed for ${langLabel}:`, err);
  }

  // Ultimate Fallback: Google Translate Free Client
  try {
    const localeMap: Record<string, string> = {
      'English': 'en',
      'Bahasa Melayu': 'ms',
      'Mandarin Chinese': 'zh-CN',
      'Japanese': 'ja',
      'Russian': 'ru',
      'French': 'fr',
    };
    const targetLang = localeMap[langLabel] || 'en';

    const translateSingle = async (t: string) => {
      if (!t || t.trim() === '') return '';
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(t)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const sentences = json[0];
        if (Array.isArray(sentences)) {
          return sentences.map(s => s[0]).join('').trim();
        }
      }
      return t;
    };

    const transTitle = await translateSingle(title);
    const transExcerpt = await translateSingle(excerpt);
    const transContent = await translateSingle(content);

    if (transTitle && transExcerpt && transContent) {
      return {
        title: transTitle,
        excerpt: transExcerpt,
        content: transContent
      };
    }
  } catch (err) {
    console.warn('[Article Translate] Google free fallback failed:', err);
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('locale');

    if (!id || !locale) {
      return NextResponse.json({ error: 'Missing id or locale' }, { status: 400 });
    }

    if (!LANG_LABELS[locale]) {
      return NextResponse.json({ error: 'Unsupported locale' }, { status: 400 });
    }

    // 1. Baca artikel dari R2 individual file
    let articleData: any = await fetchJsonFromR2<any>(`data/blog/articles/${id}.json`);

    // 2. Jika tidak ada di R2, cari di posts.json catalog (artikel lama)
    if (!articleData) {
      try {
        const res = await fetch(`${R2_PUBLIC_URL}/data/blog/posts.json?t=${Date.now()}`);
        if (res.ok) {
          const list: any[] = await res.json();
          articleData = list.find((p: any) => p.id === id) || null;
        }
      } catch { /* continue */ }
    }

    // 3. Fallback ke Firestore (artikel sangat lama)
    if (!articleData) {
      try {
        const { adminDb } = await import('@/lib/firebaseAdmin');
        const docRef = adminDb.collection('articles').doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          articleData = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (e) {
        console.warn('[Article Translate] Firestore fallback gagal:', e);
      }
    }

    if (!articleData) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get source — prefer English, fallback to Indonesian
    const sourceTitle = articleData.translations?.en?.title || articleData.title || '';
    const sourceExcerpt = articleData.translations?.en?.excerpt || articleData.excerpt || '';
    const sourceContent = articleData.translations?.en?.content || articleData.content || '';

    // Check if translation already exists (with content)
    const existingTitle = articleData.translations?.[locale]?.title;
    const existingExcerpt = articleData.translations?.[locale]?.excerpt;
    const existingContent = articleData.translations?.[locale]?.content;
    const isFallback = existingContent && (
      existingContent.includes('terjemahan otomatis') ||
      existingContent.includes('belum tersedia') ||
      existingContent.startsWith('Catatan:')
    );
    const isUntranslated = existingContent && (
      existingContent === sourceContent ||
      existingContent === articleData.content ||
      existingContent === (articleData.translations?.id?.content || '')
    );

    if (existingTitle && existingExcerpt && existingContent && !isFallback && !isUntranslated) {
      return NextResponse.json({
        title: existingTitle,
        excerpt: existingExcerpt,
        content: existingContent,
        cached: true
      });
    }

    if (!sourceTitle) {
      return NextResponse.json({ error: 'No source text available' }, { status: 404 });
    }

    const translated = await translateFields(sourceTitle, sourceExcerpt, sourceContent, LANG_LABELS[locale]);

    if (!translated) {
      // Return English fallback
      return NextResponse.json({
        title: sourceTitle,
        excerpt: sourceExcerpt,
        content: sourceContent,
        fallback: true,
      });
    }

    // Simpan cache terjemahan ke R2 (update artikel JSON individual)
    try {
      const updatedArticle = {
        ...articleData,
        translations: {
          ...(articleData.translations || {}),
          [locale]: {
            title: translated.title,
            excerpt: translated.excerpt,
            content: translated.content,
            provider: 'on-the-fly',
          },
        },
      };

      // Upload artikel terupdate ke R2
      await uploadToR2(
        `data/blog/articles/${id}.json`,
        JSON.stringify(updatedArticle, null, 2),
        'application/json'
      );

      // Perbarui juga entri di posts.json (hanya field translations)
      try {
        const existingPosts = await fetchJsonFromR2<any[]>('data/blog/posts.json') || [];
        const updatedPosts = existingPosts.map((p: any) =>
          p.id === id
            ? { ...p, translations: { ...(p.translations || {}), [locale]: updatedArticle.translations[locale] } }
            : p
        );
        await uploadToR2('data/blog/posts.json', JSON.stringify(updatedPosts, null, 2), 'application/json');
      } catch (e) {
        console.warn('[Article Translate] Gagal update posts.json di R2:', e);
      }
    } catch (e) {
      console.warn(`[Article Translate] Gagal menyimpan cache terjemahan ke R2 untuk ${id} ${locale}:`, e);
    }

    return NextResponse.json({
      title: translated.title,
      excerpt: translated.excerpt,
      content: translated.content
    });
  } catch (error: any) {
    console.error('[Article Translate API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
