/**
 * GET /api/admin/apod-fix-images
 * 
 * Admin endpoint untuk memperbaiki entri APOD yang tersimpan dengan
 * placeholder logo NASA (bukan gambar astronomi sebenarnya).
 * 
 * Menggunakan NASA WordPress API (science.nasa.gov) sebagai sumber gambar alternatif.
 * 
 * Query params:
 *   ?secret=CRON_SECRET   - Required untuk autentikasi
 *   ?startDate=YYYY-MM-DD - Tanggal mulai scan (default: 7 hari yang lalu)
 *   ?endDate=YYYY-MM-DD   - Tanggal akhir scan (default: hari ini)
 *   ?dryRun=true          - Hanya laporan tanpa perubahan
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { isValidCronRequest } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const isNasaLogoPlaceholder = (url: string): boolean =>
  !url || url.includes('nasa-logo') || url.includes('/themes/nasa-child/assets/images/') || url.includes('nasa-logo@2x');

const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];

async function fetchImageFromWordPress(date: string): Promise<string | null> {
  try {
    const d = new Date(date + 'T00:00:00Z');
    const month = monthNames[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const slugPrefix = `apod-${year}-${month}-${day}`;

    const wpUrl = `https://science.nasa.gov/wp-json/wp/v2/image-article?search=${slugPrefix}&per_page=3&orderby=date&order=desc`;
    const wpRes = await fetch(wpUrl, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!wpRes.ok) return null;

    const wpData = await wpRes.json();
    if (!Array.isArray(wpData) || wpData.length === 0) return null;

    const matched = wpData.find((item: any) => item.slug?.startsWith(slugPrefix)) || wpData[0];
    if (!matched) return null;

    const fi = matched.featured_image;
    if (fi?.file && fi.file.startsWith('http') && !isNasaLogoPlaceholder(fi.file)) {
      return fi.file;
    }
    if (matched.featured_image_url && matched.featured_image_url.startsWith('http') && !isNasaLogoPlaceholder(matched.featured_image_url)) {
      return matched.featured_image_url;
    }
    return null;
  } catch {
    return null;
  }
}

async function cacheImageToR2(imageUrl: string, date: string): Promise<string> {
  try {
    const imgFetch = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (imgFetch.ok) {
      const buffer = Buffer.from(await imgFetch.arrayBuffer());
      const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
      const imgKey = `data/encyclopedia/images/${date}.${safeExt}`;
      const contentType = imgFetch.headers.get('content-type') || 'image/jpeg';
      return await uploadToR2(imgKey, buffer, contentType);
    }
  } catch (e) {
    console.warn(`[APOD Fix] Failed to cache image to R2 for ${date}:`, e);
  }
  return imageUrl;
}

export async function GET(req: NextRequest) {
  if (!isValidCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get('dryRun') === 'true';

  // Default: 10 hari terakhir
  const today = new Date().toISOString().split('T')[0];
  const defaultStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const startDate = searchParams.get('startDate') || defaultStart;
  const endDate = searchParams.get('endDate') || today;

  const results: any[] = [];
  let fixed = 0, skipped = 0, failed = 0;

  try {
    // Ambil semua APOD dalam rentang tanggal dari Firestore
    const snapshot = await adminDb.collection('apod_history')
      .where('id', '>=', startDate)
      .where('id', '<=', endDate)
      .orderBy('id', 'asc')
      .get();

    const entries: any[] = [];
    snapshot.forEach(doc => {
      entries.push({ id: doc.id, ...doc.data() });
    });

    console.log(`[APOD Fix] Found ${entries.length} APOD entries between ${startDate} and ${endDate}`);

    for (const entry of entries) {
      const date = entry.id;
      const currentUrl = entry.image_url || '';
      const isPlaceholder = isNasaLogoPlaceholder(currentUrl);

      if (!isPlaceholder) {
        skipped++;
        results.push({ date, status: 'ok', url: currentUrl.substring(0, 80) });
        continue;
      }

      console.log(`[APOD Fix] Fixing placeholder for ${date}: ${currentUrl}`);

      // Coba dapatkan gambar dari WordPress
      const wpImageUrl = await fetchImageFromWordPress(date);

      if (!wpImageUrl) {
        failed++;
        results.push({ date, status: 'no_wp_image', oldUrl: currentUrl.substring(0, 80) });
        continue;
      }

      if (!dryRun) {
        // Cache ke R2
        const r2Url = await cacheImageToR2(wpImageUrl, date);
        
        // Update Firestore
        await adminDb.collection('apod_history').doc(date).update({
          image_url: r2Url,
          fixedAt: new Date().toISOString(),
          fixSource: 'nasa-wordpress-api'
        });

        fixed++;
        results.push({ date, status: 'fixed', oldUrl: currentUrl.substring(0, 60), newUrl: r2Url.substring(0, 80) });
      } else {
        fixed++;
        results.push({ date, status: 'would_fix', oldUrl: currentUrl.substring(0, 60), newUrl: wpImageUrl.substring(0, 80) });
      }
    }

    // Rebuild R2 history cache jika ada yang di-fix
    if (!dryRun && fixed > 0) {
      try {
        const snapAll = await adminDb.collection('apod_history').orderBy('id', 'desc').limit(100).get();
        const historyList: any[] = [];
        snapAll.forEach(doc => historyList.push({ id: doc.id, ...doc.data() }));
        await uploadToR2('data/encyclopedia/history.json', JSON.stringify(historyList, null, 2), 'application/json');
        
        // Update latest.json jika entry hari ini di-fix
        const latestEntry = historyList[0];
        if (latestEntry && fixed > 0) {
          await uploadToR2('data/encyclopedia/latest.json', JSON.stringify(latestEntry, null, 2), 'application/json');
        }
        console.log('[APOD Fix] Rebuilt R2 history cache.');
      } catch (cacheErr) {
        console.error('[APOD Fix] Failed to rebuild R2 cache:', cacheErr);
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      range: { startDate, endDate },
      summary: { total: entries.length, fixed, skipped, failed },
      results
    });

  } catch (err) {
    console.error('[APOD Fix] Error:', err);
    return NextResponse.json({
      error: 'Failed to fix APOD images',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
