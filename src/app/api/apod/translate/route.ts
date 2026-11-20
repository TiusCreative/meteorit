export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { translateText } from '@/lib/translator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('locale') || 'id';

    if (!id) {
      return NextResponse.json({ error: 'Missing parameter id' }, { status: 400 });
    }

    const docRef = adminDb.collection('apod_history').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'APOD not found' }, { status: 404 });
    }

    const data = docSnap.data()!;
    let title = data.title?.[locale] || '';
    let explanation = data.explanation?.[locale] || '';

    const isUntranslated = (
      !title ||
      title.toLowerCase() === 'nasa science' ||
      !explanation ||
      (locale === 'id' && explanation === data.explanation?.en)
    );

    if (isUntranslated) {
      const targetLangLabel = 
        locale === 'id' ? 'Indonesian' :
        locale === 'en' ? 'English' : 
        locale === 'ms' ? 'Malay' : 
        locale === 'zh' ? 'Mandarin Chinese' : 
        locale === 'ja' ? 'Japanese' : 
        locale === 'ru' ? 'Russian' : 
        locale === 'fr' ? 'French' : 
        'Indonesian';
      
      const sourceTitle = (data.title?.en && data.title.en.toLowerCase() !== 'nasa science') ? data.title.en : (data.title?.id || 'NASA Astronomy Picture of the Day');
      const sourceExplanation = data.explanation?.en || data.explanation?.id || '';

      const [translatedTitle, translatedExplanation] = await Promise.all([
        translateText(
          sourceTitle,
          `Translate this astronomy title into ${targetLangLabel}. Return ONLY the translated title, no introduction, no quotes, no other text.`,
          locale
        ),
        translateText(
          sourceExplanation,
          `Translate this astronomy explanation into ${targetLangLabel}. Preserve paragraph structure, mission names, and scientific terms. Return ONLY the translated description, no other text.`,
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

    if (!title) title = data.title?.id || data.title?.en || '';
    if (!explanation) explanation = data.explanation?.id || data.explanation?.en || '';

    return NextResponse.json({ title, explanation });
  } catch (error: any) {
    console.error('APOD translation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
