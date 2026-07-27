import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { translateText } from '@/lib/translator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const locale = searchParams.get('locale');
    
    // Asal data dari query parameter
    const originalBiography = searchParams.get('biography') || '';
    const originalRole = searchParams.get('role') || '';
    const originalCountry = searchParams.get('country') || '';

    if (!slug || !locale) {
      return NextResponse.json({ error: 'Missing parameters slug or locale' }, { status: 400 });
    }

    const cacheDocId = `${slug}_${locale}`;
    let cachedData: any = null;

    // 1. Coba fetch dari Cloudflare D1
    try {
      const { queryD1 } = await import('@/lib/d1Client');
      const d1Res = await queryD1('SELECT * FROM astronaut_translations WHERE id = ? LIMIT 1', [cacheDocId]);
      if (d1Res && d1Res.results && d1Res.results.length > 0) {
        cachedData = d1Res.results[0];
      }
    } catch (d1Err) {
      console.warn('[Translate API] Gagal membaca D1:', d1Err);
    }

    // 2. Coba dari Firestore jika D1 kosong
    const cacheDocRef = adminDb.collection('astronaut_translations').doc(cacheDocId);
    if (!cachedData) {
      try {
        const cacheDoc = await cacheDocRef.get();
        if (cacheDoc.exists) {
          cachedData = cacheDoc.data()!;
        }
      } catch (fsErr) {
        console.warn('[Translate API] Gagal membaca Firestore:', fsErr);
      }
    }

    if (cachedData) {
      const bio = cachedData.biography || '';
      const country = cachedData.country || '';
      const isIndonesianInForeignLocale = locale !== 'id' && (
        bio.includes('adalah') || 
        bio.includes('astronot') || 
        bio.includes('kosmonot') || 
        bio.includes('stasiun luar angkasa') ||
        bio.includes('Amerika Serikat') ||
        country === 'Amerika Serikat' ||
        country === 'Jepang' ||
        country === 'Rusia'
      );
      const isUntranslated = bio === originalBiography || isIndonesianInForeignLocale;
      if (!isUntranslated) {
        return NextResponse.json(cachedData);
      }
    }

    if (locale === 'id') {
      return NextResponse.json({
        biography: originalBiography,
        role: originalRole,
        country: originalCountry
      });
    }

    // Terjemahkan dengan AI jika cache belum ada
    const targetLangLabel = locale === 'en' ? 'English' : locale === 'ms' ? 'Malay' : locale === 'zh' ? 'Mandarin Chinese' : locale === 'ja' ? 'Japanese' : locale === 'ru' ? 'Russian' : locale === 'fr' ? 'French' : 'English';
    
    const [transBio, transRole, transCountry] = await Promise.all([
      translateText(originalBiography, `Translate the following text into ${targetLangLabel}. Output ONLY the translated text, do not add any quotes, introductions or explanations.`, locale),
      translateText(originalRole, `Translate the following text into ${targetLangLabel}. Output ONLY the translated text, do not add any quotes, introductions or explanations.`, locale),
      translateText(originalCountry, `Translate the following text into ${targetLangLabel}. Output ONLY the translated text, do not add any quotes, introductions or explanations.`, locale)
    ]);

    const resultData = {
      biography: transBio || originalBiography,
      role: transRole || originalRole,
      country: transCountry || originalCountry,
      updatedAt: new Date().toISOString()
    };

    // Simpan ke D1
    try {
      const { queryD1 } = await import('@/lib/d1Client');
      await queryD1(
        `INSERT INTO astronaut_translations (id, biography, role, country, updatedAt) 
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
         biography=excluded.biography,
         role=excluded.role,
         country=excluded.country,
         updatedAt=excluded.updatedAt`,
        [cacheDocId, resultData.biography, resultData.role, resultData.country, resultData.updatedAt]
      );
    } catch (d1SaveErr) {
      console.error('[Translate API] Gagal menyimpan ke D1:', d1SaveErr);
    }

    // Simpan ke Firestore (sebagai cadangan)
    try {
      await cacheDocRef.set(resultData);
    } catch (fsSaveErr) {
      console.error('[Translate API] Gagal menyimpan ke Firestore:', fsSaveErr);
    }

    return NextResponse.json(resultData);
  } catch (error: any) {
    console.error('Astronaut translation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
