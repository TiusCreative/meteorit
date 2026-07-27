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

    const docRef = adminDb.collection('apod_history').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'APOD not found' }, { status: 404 });
    }

    const data = docSnap.data()!;
    let title = (locale !== 'id' && data.title?.[locale]) || '';
    let explanation = (locale !== 'id' && data.explanation?.[locale]) || '';

    if (locale !== 'id' && (!title || !explanation)) {
      const targetLangLabel = locale === 'en' ? 'English' : locale === 'ms' ? 'Malay' : locale === 'zh' ? 'Mandarin Chinese' : locale === 'ja' ? 'Japanese' : locale === 'ru' ? 'Russian' : locale === 'fr' ? 'French' : 'English';
      
      const [translatedTitle, translatedExplanation] = await Promise.all([
        translateText(
          data.title?.en || data.title?.id,
          `Translate this astronomy title into ${targetLangLabel}. Return ONLY the translated title, no introduction, no quotes, no other text.`,
          locale
        ),
        translateText(
          data.explanation?.en || data.explanation?.id,
          `Translate this astronomy explanation into ${targetLangLabel}. Keep paragraph structure intact. Return ONLY the translated description, no other text.`,
          locale
        )
      ]);

      if (translatedTitle && translatedExplanation) {
        title = translatedTitle;
        explanation = translatedExplanation;
        
        // Save back to Firestore
        const updateData: any = {};
        updateData[`title.${locale}`] = translatedTitle;
        updateData[`explanation.${locale}`] = translatedExplanation;
        await docRef.update(updateData);
      }
    }

    if (!title) title = data.title?.id || data.title?.en;
    if (!explanation) explanation = data.explanation?.id || data.explanation?.en;

    return NextResponse.json({ title, explanation });
  } catch (error: any) {
    console.error('APOD translation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
