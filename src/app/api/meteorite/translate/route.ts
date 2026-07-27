import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { translateText } from '@/lib/translator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('locale');

    if (!id || !locale) {
      return NextResponse.json({ error: 'Missing parameters id or locale' }, { status: 400 });
    }

    const docRef = adminDb.collection('meteorites').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Meteorite not found' }, { status: 404 });
    }

    const data = docSnap.data()!;
    let name = data.translations?.[locale]?.name || '';
    let description = data.translations?.[locale]?.description || '';

    // Jika belum ada terjemahan di database, buat on-demand
    if (locale !== 'id' && (!name || !description)) {
      const targetLangLabel = locale === 'en' ? 'English' : locale === 'ms' ? 'Malay' : locale === 'zh' ? 'Mandarin Chinese' : locale === 'ja' ? 'Japanese' : locale === 'ru' ? 'Russian' : locale === 'fr' ? 'French' : 'English';
      
      const sourceName = data.name || id;
      const sourceDesc = data.translated_description || data.description || '';

      const [translatedName, translatedDesc] = await Promise.all([
        translateText(
          sourceName,
          `Translate the following meteorite name/term into ${targetLangLabel}. Output ONLY the translated name/term, do not add any quotes, introductions or explanations.`,
          locale
        ),
        translateText(
          sourceDesc,
          `Translate the following text into ${targetLangLabel}. Keep paragraphs, list items and markdown headers (like ## or ###) intact. Output ONLY the translated text, do not add any quotes, introductions or explanations.`,
          locale
        )
      ]);

      if (translatedName && translatedDesc) {
        name = translatedName;
        description = translatedDesc;

        // Simpan ke Firestore
        await docRef.update({
          [`translations.${locale}.name`]: translatedName,
          [`translations.${locale}.description`]: translatedDesc,
          updatedAt: new Date().toISOString()
        });
      }
    }

    if (!name) name = data.name || id;
    if (!description) description = data.translated_description || data.description || '';

    return NextResponse.json({ name, description });
  } catch (error: any) {
    console.error('Meteorite translation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
