export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { parseAIJson } from '@/lib/aiProvider';
import { getSiteUrl } from '@/lib/siteUrl';

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
  zh: 'Mandarin Chinese',
  ja: 'Japanese',
  ru: 'Russian',
  fr: 'French',
};

import { generateWithAI } from '@/lib/aiProvider';

async function translateRadarData(
  payload: {
    earthquake?: { region: string; tsunamiPotential: string; felt?: string };
    launch?: { name: string; desc: string };
  },
  langLabel: string
) {
  try {
    const result = await generateWithAI({
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
      temperature: 0.2,
      responseFormatJson: true,
      timeoutMs: 6000,
    });

    const parsed = parseAIJson(String(result.content));
    return parsed;
  } catch (err) {
    console.warn(`[Radar Translate] AI translation failed for ${langLabel}:`, err instanceof Error ? err.message : String(err));
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
