import Link from 'next/link';
import { cookies } from 'next/headers';
import GlossaryDetailActions from '@/components/GlossaryDetailActions';
import { fetchJsonFromR2, uploadToR2 } from '@/lib/r2Client';
import { adminDb } from '@/lib/firebaseAdmin';
import { getGlossarySeed, type GlossaryTerm } from '@/lib/glossaryData';
import { defaultLanguage, isSiteLanguage, LANGUAGE_COOKIE_KEY, type SiteLanguage } from '@/lib/i18n';
import { landingText } from '@/lib/landingText';
import JsonLd from '@/components/JsonLd';
import { generateBreadcrumbSchema } from '@/lib/seoSchemas';

export const dynamic = 'force-dynamic';

async function getGlossaryTerms() {
  const r2Terms = await fetchJsonFromR2<GlossaryTerm[]>('data/glossary/terms.json');
  return Array.isArray(r2Terms) && r2Terms.length > 0 ? r2Terms : getGlossarySeed();
}

async function getGlossaryTerm(id: string) {
  // 1. Coba dari R2
  try {
    const terms = await getGlossaryTerms();
    const matched = terms.find((term) => term.id === id);
    if (matched) return matched;
  } catch (e) {
    console.warn('[Glossary] Error reading R2 terms:', e);
  }

  // 2. Fallback ke Firestore
  try {
    const docSnap = await adminDb.collection('glossary_terms').doc(id).get();
    if (docSnap.exists) {
      return docSnap.data() as GlossaryTerm;
    }
  } catch (e) {
    console.error('[Glossary] Error reading Firestore term:', e);
  }
  return null;
}

// Generate premium SEO Metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const term = await getGlossaryTerm(params.id);
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const locale = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = landingText[locale];

  if (!term) {
    return {
      title: `${t.articleNotFound || 'Istilah Tidak Ditemukan'} - Meteorit Indonesia`,
      description: t.articleNotFound || 'Istilah glossarium sains tidak ditemukan.',
    };
  }

  const title = term.term[locale] || term.term.id;
  const description = term.definition[locale] || term.definition.id;

  return {
    title: `${title} (${term.term.en}) - Kamus & Istilah Sains Antariksa`,
    description: `Definisi lengkap, contoh penggunaan, dan penjelasan ilmiah mengenai istilah ${title}: ${description}`,
    keywords: [title, term.term.en, term.category, 'glossarium sains', 'BMKG', 'NASA', 'meteorologi', 'astronomi'],
    openGraph: {
      title: `${title} - Kamus Sains Meteorit Indonesia`,
      description: description,
      images: [term.image],
      type: 'article',
    },
  };
}

// AI article generator helper with multi-provider fallbacks
async function generateGlossaryArticle(term: GlossaryTerm, language: string): Promise<string> {
  const lang = language as SiteLanguage;
  const prompt = `Write a comprehensive, educational, and SEO-friendly science article of 350-500 words in language "${language}" explaining the scientific term "${term.term[lang] || term.term.id}".
  Category: ${term.category}
  Short definition: ${term.definition[lang] || term.definition.id}
  Example of usage: ${term.example[lang] || term.example.id}

  Structure the article with:
  1. An introduction explaining what the term means in simple yet scientific language.
  2. The scientific context or how it relates to meteorology, astronomy, or space exploration.
  3. Real-world importance, phenomena, or historical context.
  4. Use clear HTML headings (e.g. <h2>, <h3>) and clean HTML paragraphs (<p>, <strong>, <em>, <ul>, <li>). Do not use Markdown, return pure HTML for the article body.

  Return ONLY the raw HTML string, without wrapping it in markdown code blocks or any explanation.`;

  const messages = [
    { role: 'system', content: 'You are an expert scientific writer and educator. You write highly engaging, premium quality articles in clean HTML.' },
    { role: 'user', content: prompt }
  ];

  const providers = [
    {
      name: 'Groq Utama',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct' // llama-3.3-70b-versatile deprecated Aug 16 2026
    },
    {
      name: 'Groq Backup',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_BACKUP_API_KEY,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct'
    },
    {
      name: 'OpenRouter Utama',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.3-70b-instruct:free'
    }
  ];

  for (const provider of providers) {
    if (!provider.key) continue;

    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.65
        })
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content.replace(/```html|```/gi, '').trim();
      }
    } catch (err) {
      console.warn(`[Glossary AI Generation] ${provider.name} failed:`, err);
    }
  }

  throw new Error('All AI providers failed to generate glossary article.');
}

async function translateGlossaryDetails(
  term: GlossaryTerm,
  language: SiteLanguage
): Promise<{ term: string; definition: string; example: string }> {
  const prompt = `Translate the following scientific glossary term details to the language "${language}".
  Original Indonesian values:
  Term Name: ${term.term.id}
  Definition: ${term.definition.id}
  Example: ${term.example.id}

  Provide the translation in raw JSON format with precisely the keys "term", "definition", and "example". Do not include any explanation or markdown formatting, just return raw JSON.`;

  const messages = [
    { role: 'system', content: 'You are a professional scientific translator. Return ONLY a valid JSON object.' },
    { role: 'user', content: prompt }
  ];

  const providers = [
    {
      name: 'Groq Utama',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct' // llama-3.3-70b-versatile deprecated Aug 16 2026
    },
    {
      name: 'Groq Backup',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_BACKUP_API_KEY,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct'
    },
    {
      name: 'OpenRouter Utama',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: 'meta-llama/llama-3.3-70b-instruct:free'
    }
  ];

  for (const provider of providers) {
    if (!provider.key) continue;

    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0].trim());
            if (parsed.term && parsed.definition && parsed.example) {
              return {
                term: parsed.term.trim(),
                definition: parsed.definition.trim(),
                example: parsed.example.trim()
              };
            }
          } catch (jsonErr) {
            console.warn(`[Glossary Translation] JSON parse error from ${provider.name}:`, jsonErr, "Content was:", content);
          }
        } else {
          console.warn(`[Glossary Translation] No JSON block found in content from ${provider.name}:`, content);
        }
      }
    } catch (err) {
      console.warn(`[Glossary Translation] ${provider.name} failed:`, err);
    }
  }

  throw new Error('All AI providers failed to translate glossary term.');
}

import GlossaryDetailClient from '@/components/GlossaryDetailClient';

export default async function GlossaryDetailPage({ params }: { params: { id: string } }) {
  const term = await getGlossaryTerm(params.id);
  const localeCookie = cookies().get(LANGUAGE_COOKIE_KEY)?.value || null;
  const language: SiteLanguage = isSiteLanguage(localeCookie) ? localeCookie : defaultLanguage;
  const t = landingText[language];

  if (!term) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <p className="text-lg font-black text-red-300">{t.glossaryError || 'Istilah tidak ditemukan.'}</p>
          <Link href="/glossarium" className="mt-4 inline-flex rounded-lg bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950">
            {t.backToGlossary || 'Kembali ke Glossarium'}
          </Link>
        </div>
      </main>
    );
  }

  // Translate term details if missing or not yet translated on server side first (for SEO / first load)
  const isStillIndonesianOrEnglish = language !== 'id' && (
    !term.definition[language] ||
    term.definition[language] === term.definition.id ||
    term.definition[language] === term.definition.en
  );
  if (language !== 'id' && (!term.translatedLocales?.[language] || isStillIndonesianOrEnglish)) {
    console.log(`[Glossarium Translation] Translating term ${term.id} to ${language}`);
    try {
      const translation = await translateGlossaryDetails(term, language);
      if (translation.definition !== term.definition.id) {
        const docRef = adminDb.collection('glossary_terms').doc(term.id);
        
        term.term[language] = translation.term;
        term.definition[language] = translation.definition;
        term.example[language] = translation.example;
        const locales = term.translatedLocales || ({} as any);
        locales[language] = true;
        term.translatedLocales = locales;

        // Update Firestore
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          await docRef.update({
            [`term.${language}`]: translation.term,
            [`definition.${language}`]: translation.definition,
            [`example.${language}`]: translation.example,
            [`translatedLocales.${language}`]: true,
            updatedAt: new Date().toISOString()
          });
        } else {
          await docRef.set({
            ...term,
            updatedAt: new Date().toISOString()
          });
        }

        // Rebuild R2 cache
        const allTermsSnapshot = await adminDb.collection('glossary_terms').get();
        const termsList: any[] = [];
        allTermsSnapshot.forEach((doc: any) => {
          termsList.push(doc.data());
        });
        await uploadToR2('data/glossary/terms.json', JSON.stringify(termsList, null, 2), 'application/json');
      }

    } catch (e) {
      console.error(`[Glossarium Translation] Failed to translate details for ${term.id}:`, e);
    }
  }

  // Trigger on-demand generation if missing on server side first
  let articleHtml = term.articles?.[language] || '';
  if (!articleHtml) {
    console.log(`[Glossarium API] Generating on-demand article for term: ${term.id} in language: ${language}`);
    try {
      articleHtml = await generateGlossaryArticle(term, language);
      const docRef = adminDb.collection('glossary_terms').doc(term.id);
      const docSnap = await docRef.get();

      const updatedArticles: Record<SiteLanguage, string> = {
        id: term.articles?.id || '',
        en: term.articles?.en || '',
        ms: term.articles?.ms || '',
        zh: term.articles?.zh || '',
        ja: term.articles?.ja || '',
        ru: term.articles?.ru || '',
        fr: term.articles?.fr || '',
        [language]: articleHtml
      };

      if (docSnap.exists) {
        await docRef.update({
          articles: updatedArticles,
          updatedAt: new Date().toISOString()
        });
      } else {
        await docRef.set({
          ...term,
          articles: updatedArticles,
          updatedAt: new Date().toISOString()
        });
      }

      // Rebuild R2 cache
      const allTermsSnapshot = await adminDb.collection('glossary_terms').get();
      const termsList: any[] = [];
      allTermsSnapshot.forEach((doc: any) => {
        termsList.push(doc.data());
      });
      await uploadToR2('data/glossary/terms.json', JSON.stringify(termsList, null, 2), 'application/json');

      term.articles = updatedArticles;
    } catch (e) {
      console.error('[Glossarium API] On-demand generation error:', e);
    }
  }

  // JSON-LD Schemas for Premium SEO
  const title = term.term[language] || term.term.id;
  const definition = term.definition[language] || term.definition.id;
  const example = term.example[language] || term.example.id;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': `${title} - Kamus Sains Antariksa`,
    'description': definition,
    'image': term.image,
    'dateModified': term.updatedAt,
    'author': {
      '@type': 'Organization',
      'name': 'Meteorit Indonesia',
      'url': 'https://meteorit.my.id'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': `Apa definisi dari istilah ${title}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': definition
        }
      },
      {
        '@type': 'Question',
        'name': `Bagaimana contoh penggunaan istilah ${title}?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': example
        }
      }
    ]
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Beranda', url: '/' },
    { name: 'Glossarium', url: '/glossarium' },
    { name: title, url: `/glossarium/${term.id}` },
  ]);

  return (
    <>
      <JsonLd schema={[breadcrumbSchema, articleSchema, faqSchema]} />
      <GlossaryDetailClient initialTerm={term} initialLanguage={language} />
    </>
  );
}
