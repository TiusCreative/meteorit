import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/translator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { records, target } = await req.json();

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing records array' }, { status: 400 });
    }

    const locale = target || 'id';

    if (records.length === 0) {
      return NextResponse.json({ summary: locale === 'id' ? 'Tidak ada data bencana untuk dianalisis.' : 'No disaster data available for analysis.' });
    }

    // Compile top records to keep text length small
    const summaryText = records
      .slice(0, 15)
      .map(r => `[${r.type}] ${r.title}. Waktu: ${r.timestamp}. Lokasi: ${r.location}. Detail: ${r.details}`)
      .join('\n');

    const targetLangLabel = 
      locale === 'en' ? 'English' : 
      locale === 'ms' ? 'Malay' : 
      locale === 'zh' ? 'Mandarin Chinese' : 
      locale === 'ja' ? 'Japanese' : 
      locale === 'ru' ? 'Russian' : 
      locale === 'fr' ? 'French' : 'Indonesian';

    const systemPrompt = `You are a disaster mitigation AI assistant. Analyze the following list of active/recent disasters and generate a concise, professional summary of the disaster trends, severity levels, regions of concern, and brief safety recommendations. Write the summary directly in ${targetLangLabel}. Do not add any conversational introductions, quotes, or markdown wraps. Maximum 4 sentences.`;

    const summary = await translateText(summaryText, systemPrompt, locale);

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('[Data Center AI Summary Error]:', error);
    return NextResponse.json({ error: 'Failed to generate AI summary', details: String(error) }, { status: 500 });
  }
}
