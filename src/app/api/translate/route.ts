import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/translator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text, texts, target } = await req.json();
    if (!target) {
      return NextResponse.json({ error: 'Missing target locale' }, { status: 400 });
    }

    const targetLang = target === 'zh' ? 'zh-CN' : target;
    const targetLangLabel = 
      target === 'en' ? 'English' : 
      target === 'ms' ? 'Malay' : 
      target === 'zh' ? 'Mandarin Chinese' : 
      target === 'ja' ? 'Japanese' : 
      target === 'ru' ? 'Russian' : 
      target === 'fr' ? 'French' : 'English';

    // ── Batch Translation Mode ──────────────────────────────────────────────
    if (texts && Array.isArray(texts)) {
      const translatedList = await Promise.all(
        texts.map(async (t) => {
          if (!t || t.trim() === '' || target === 'id') return t;
          try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(t)}`;
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) {
              const json = await res.json();
              const sentences = json[0];
              if (Array.isArray(sentences)) {
                return sentences.map((s: any) => s[0]).join('').trim();
              }
            }
          } catch (e) {
            console.warn('[Translate API] Batch item error:', t, e);
          }
          return t;
        })
      );
      return NextResponse.json({ translated: translatedList });
    }

    // ── Single Text Mode ────────────────────────────────────────────────────
    if (!text) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    if (target === 'id') {
      return NextResponse.json({ translated: text });
    }

    // Direct Google Translate for clean neural translation
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const sentences = json[0];
        if (Array.isArray(sentences)) {
          const gTrans = sentences.map((s: any) => s[0]).join('').trim();
          if (gTrans && gTrans.length > 0) {
            return NextResponse.json({ translated: gTrans });
          }
        }
      }
    } catch (gErr) {
      console.warn('[Translate API] Direct Google Translate failed:', gErr);
    }

    // LLM Fallback (Llama)
    let translated = await translateText(
      text,
      `Translate the following volcanic disaster report or text into ${targetLangLabel}. Output ONLY the translated text, do not add any quotes, introductions or explanations.`,
      target
    );

    // Strict validation to filter out prompt leakages
    const lower = translated.toLowerCase();
    if (
      lower.includes('translate the') ||
      lower.includes('output only') ||
      lower.includes('here is the translation') ||
      lower.includes('translation:') ||
      lower.includes('translated text') ||
      translated.trim().length === 0
    ) {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const gRes = await fetch(url, { cache: 'no-store' });
        if (gRes.ok) {
          const gJson = await gRes.json();
          const sentences = gJson[0];
          if (Array.isArray(sentences)) {
            const gTrans = sentences.map(s => s[0]).join('').trim();
            if (gTrans && gTrans.length > 0) {
              translated = gTrans;
            }
          }
        }
      } catch (gErr) {
        console.warn('[Translate API] Fallback to Google Translate failed:', gErr);
      }
    }

    return NextResponse.json({ translated });
  } catch (error: any) {
    console.error('[Translation API Route Error]:', error);
    return NextResponse.json({
      error: 'Translation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
