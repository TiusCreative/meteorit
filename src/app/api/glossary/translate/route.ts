import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { type GlossaryTerm } from '@/lib/glossaryData';
import { type SiteLanguage } from '@/lib/i18n';
import { translateText } from '@/lib/translator';

import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

async function generateGlossaryArticle(term: GlossaryTerm, language: string): Promise<string> {
  const prompt = `Write a comprehensive, educational, and SEO-friendly science article of 350-500 words in language "${language}" explaining the scientific term "${term.term[language as SiteLanguage] || term.term.id}".
  Category: ${term.category}
  Short definition: ${term.definition[language as SiteLanguage] || term.definition.id}
  Example of usage: ${term.example[language as SiteLanguage] || term.example.id}

  Structure the article with:
  1. An introduction explaining what the term means in simple yet scientific language.
  2. The scientific context or how it relates to meteorology, astronomy, or space exploration.
  3. Real-world importance, phenomena, or historical context.
  4. Use clear HTML headings (e.g. <h2>, <h3>) and clean HTML paragraphs (<p>, <strong>, <em>, <ul>, <li>). Do not use Markdown, return pure HTML for the article body.

  Return ONLY the raw HTML string, without wrapping it in markdown code blocks or any explanation.`;

  const providers = [
    {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
    },
    {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_BACKUP_API_KEY,
      model: 'llama-3.1-8b-instant',
    },
    {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.2-3b-instruct:free',
    },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          ...(provider.url.includes('openrouter.ai')
            ? { 'HTTP-Referer': getSiteUrl(), 'X-Title': 'Meteorit Indonesia Glossary Article Gen' }
            : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: 'You are an expert scientific writer and educator. You write highly engaging, premium quality articles in clean HTML.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.65
        }),
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(18000) : undefined,
      });

      if (!response.ok) continue;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content.replace(/```html|```/gi, '').trim();
      }
    } catch {
      // try next
    }
  }
  return '';
}

async function translateGlossaryDetails(
  term: GlossaryTerm,
  language: string
): Promise<{ term: string; definition: string; example: string }> {
  const prompt = `Translate the following scientific glossary term details to the language "${language}".
  Original Indonesian values:
  Term Name: ${term.term.id}
  Definition: ${term.definition.id}
  Example: ${term.example.id}

  Provide the translation in raw JSON format with precisely the keys "term", "definition", and "example". Do not include any explanation or markdown formatting, just return raw JSON.`;

  const providers = [
    {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant',
    },
    {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_BACKUP_API_KEY,
      model: 'llama-3.1-8b-instant',
    },
    {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.2-3b-instruct:free',
    },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          ...(provider.url.includes('openrouter.ai')
            ? { 'HTTP-Referer': getSiteUrl(), 'X-Title': 'Meteorit Indonesia Glossary Translate' }
            : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: 'You are a professional scientific translator. Return ONLY a valid JSON object.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        }),
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(12000) : undefined,
      });

      if (!response.ok) continue;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0].trim());
          if (parsed.term && parsed.definition && parsed.example) {
            return {
              term: parsed.term.trim(),
              definition: parsed.definition.trim(),
              example: parsed.example.trim()
            };
          }
        }
      }
    } catch {
      // try next
    }
  }

  // Fallbacks if translation fails, utilizing translateText central engine
  try {
    const targetLangLabel = language === 'en' ? 'English' : language === 'ms' ? 'Malay' : language === 'zh' ? 'Mandarin Chinese' : language === 'ja' ? 'Japanese' : language === 'ru' ? 'Russian' : language === 'fr' ? 'French' : 'English';
    const [transTerm, transDef, transEx] = await Promise.all([
      translateText(term.term.id, `Translate the scientific term "${term.term.id}" to ${targetLangLabel}. Output only the translation.`, language),
      translateText(term.definition.id, `Translate the definition "${term.definition.id}" to ${targetLangLabel}. Output only the translation.`, language),
      translateText(term.example.id, `Translate the example "${term.example.id}" to ${targetLangLabel}. Output only the translation.`, language)
    ]);
    return {
      term: transTerm || term.term.id,
      definition: transDef || term.definition.id,
      example: transEx || term.example.id
    };
  } catch {
    return {
      term: term.term.id,
      definition: term.definition.id,
      example: term.example.id
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('locale') as SiteLanguage;

    if (!id || !locale) {
      return NextResponse.json({ error: 'Missing id or locale' }, { status: 400 });
    }

    const docRef = adminDb.collection('glossary_terms').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    }

    const term = docSnap.data() as GlossaryTerm;
    let didChange = false;

    // 1. Terjemahkan detail istilah jika belum ada atau jika terjemahannya masih berupa bahasa Indonesia/Inggris (fallback palsu)
    const isStillIndonesianOrEnglish = locale !== 'id' && (
      !term.definition[locale] ||
      term.definition[locale] === term.definition.id ||
      term.definition[locale] === term.definition.en
    );
    if (locale !== 'id' && (!term.translatedLocales?.[locale] || isStillIndonesianOrEnglish)) {
      const translation = await translateGlossaryDetails(term, locale);
      if (translation.definition !== term.definition.id) {
        term.term[locale] = translation.term;
        term.definition[locale] = translation.definition;
        term.example[locale] = translation.example;
        term.translatedLocales = (term.translatedLocales || {}) as any;
        (term.translatedLocales as any)[locale] = true;
        didChange = true;
      }
    }

    // 2. Generate artikel pembahasan ilmiah jika belum ada
    if (!term.articles?.[locale]) {
      const articleHtml = await generateGlossaryArticle(term, locale);
      term.articles = (term.articles || {}) as any;
      (term.articles as any)[locale] = articleHtml;
      didChange = true;
    }

    // 3. Simpan perubahan ke Firestore & R2 jika ada perubahan
    if (didChange) {
      term.updatedAt = new Date().toISOString();
      await docRef.set(term);

      // Rebuild R2 cache
      const allTermsSnapshot = await adminDb.collection('glossary_terms').get();
      const termsList: any[] = [];
      allTermsSnapshot.forEach((doc: any) => {
        termsList.push(doc.data());
      });
      await uploadToR2('data/glossary/terms.json', JSON.stringify(termsList, null, 2), 'application/json');
    }

    return NextResponse.json({
      term: term.term[locale] || term.term.id,
      definition: term.definition[locale] || term.definition.id,
      example: term.example[locale] || term.example.id,
      articleHtml: term.articles?.[locale] || '',
      updatedAt: term.updatedAt
    });

  } catch (error: any) {
    console.error('Glossary translation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
