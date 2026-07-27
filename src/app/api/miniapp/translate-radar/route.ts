import { NextRequest, NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/siteUrl';

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
  zh: 'Mandarin Chinese',
  ja: 'Japanese',
  ru: 'Russian',
  fr: 'French',
};

async function translateRadarData(
  payload: {
    earthquake?: { region: string; tsunamiPotential: string; felt?: string };
    launch?: { name: string; desc: string };
  },
  langLabel: string
) {
  const providers = [
    {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant',
    },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': getSiteUrl(),
          'X-Title': 'Meteorit Indonesia Radar Translate',
        },
        body: JSON.stringify({
          model: provider.model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a concise science translator. Translate all input fields into ${langLabel}. Return ONLY a JSON object with the exact same structure as the input.`,
            },
            {
              role: 'user',
              content: `Translate this JSON data into ${langLabel}:\n${JSON.stringify(payload)}`,
            },
          ],
        }),
        signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined,
      });

      if (!res.ok) continue;
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) continue;

      const parsed = JSON.parse(String(raw).replace(/```json|```/g, '').trim());
      return parsed;
    } catch {
      // try next
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { earthquake, launch, locale } = body;

    if (!locale || locale === 'id') {
      return NextResponse.json({ earthquake, launch });
    }

    const langLabel = LANG_LABELS[locale];
    if (!langLabel) {
      return NextResponse.json({ earthquake, launch });
    }

    const translated = await translateRadarData({ earthquake, launch }, langLabel);

    if (translated) {
      return NextResponse.json({
        earthquake: translated.earthquake || earthquake,
        launch: translated.launch || launch,
      });
    }

    return NextResponse.json({ earthquake, launch, fallback: true });
  } catch (error: any) {
    console.error('[Radar Translate API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
