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
 *   ?startDate=YYYY-MM-DD - Tanggal mulai scan (default: 10 hari yang lalu)
 *   ?endDate=YYYY-MM-DD   - Tanggal akhir scan (default: hari ini)
 *   ?force=true           - Paksa perbaikan gambar meski sudah ada URL (default: true)
 *   ?dryRun=true          - Hanya laporan tanpa perubahan
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebaseAdmin';
import { uploadToR2 } from '@/lib/r2Client';
import { isValidCronRequest } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const isNasaLogoPlaceholder = (url: string): boolean =>
  !url || url.includes('nasa-logo') || url.includes('/themes/nasa-child/assets/images/') || url.includes('nasa-logo@2x');

const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];

async function fetchApodFromWordPress(date: string): Promise<{
  title: string;
  explanation: string;
  imageUrl: string | null;
} | null> {
  try {
    const d = new Date(date + 'T00:00:00Z');
    const month = monthNames[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    const slugPrefix = `apod-${year}-${month}-${day}-`;

    const wpUrl = `https://science.nasa.gov/wp-json/wp/v2/image-article?search=${encodeURIComponent(`apod-${year}-${month}-${day}`)}&per_page=10`;
    const wpRes = await fetch(wpUrl, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!wpRes.ok) return null;

    const wpData = await wpRes.json();
    if (!Array.isArray(wpData) || wpData.length === 0) return null;

    // Prioritaskan slug dengan akhiran strip '-' agar tidak salah match (misal tgl 1 match tgl 10)
    const matched = wpData.find((item: any) => item.slug?.startsWith(slugPrefix)) ||
                    wpData.find((item: any) => item.slug?.startsWith(`apod-${year}-${month}-${day}`)) ||
                    wpData[0];
    if (!matched) return null;

    let imageUrl: string | null = null;
    const fi = matched.featured_image;
    if (fi?.file && fi.file.startsWith('http') && !isNasaLogoPlaceholder(fi.file)) {
      imageUrl = fi.file;
    } else if (matched.featured_image_url && !isNasaLogoPlaceholder(matched.featured_image_url)) {
      imageUrl = matched.featured_image_url;
    }

    const rawTitle = (matched.title?.rendered || matched.title || '')
      .replace(/APOD: \d{4} \w+ \d+ – /i, '')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8217;/g, "'").trim();

    const rawExcerpt = (matched.excerpt?.rendered || matched.caption || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\[&hellip;\]/g, '...')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').trim();

    return { title: rawTitle, explanation: rawExcerpt, imageUrl };
  } catch (err) {
    console.warn(`[APOD Fix] WP fetch error for ${date}:`, err);
    return null;
  }
}

async function cacheImageToR2(imageUrl: string, date: string): Promise<string> {
  try {
    const imgFetch = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (imgFetch.ok) {
      const buffer = Buffer.from(await imgFetch.arrayBuffer());
      const ext = imageUrl.split('.').pop()?.split('?')[0].toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
      const imgKey = `data/encyclopedia/images/${date}.${safeExt}`;
      const contentType = safeExt === 'png' ? 'image/png' : 'image/jpeg';
      const uploadedUrl = await uploadToR2(imgKey, buffer, contentType);

      // Jika formatnya bukan png, simpan juga salinan ke .png untuk menghindari 404 pada URL lama
      if (safeExt !== 'png') {
        try {
          await uploadToR2(`data/encyclopedia/images/${date}.png`, buffer, contentType);
        } catch {}
      }

      return `${uploadedUrl}?v=${Date.now()}`;
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
  // Default force=true saat dipanggil agar admin klik langsung memperbaiki
  const force = searchParams.get('force') !== 'false';

  const today = new Date().toISOString().split('T')[0];
  const defaultStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const startDate = searchParams.get('startDate') || defaultStart;
  const endDate = searchParams.get('endDate') || today;

  const results: any[] = [];
  let fixed = 0, skipped = 0, failed = 0;

  try {
    const snapshot = await adminDb.collection('apod_history')
      .where('id', '>=', startDate)
      .where('id', '<=', endDate)
      .orderBy('id', 'asc')
      .get();

    const entries: any[] = [];
    snapshot.forEach((doc: any) => {
      entries.push({ id: doc.id, ...doc.data() });
    });

    console.log(`[APOD Fix] Found ${entries.length} APOD entries between ${startDate} and ${endDate}`);

    for (const entry of entries) {
      const date = entry.id;
      const currentUrl = entry.image_url || '';
      const isPlaceholderUrl = isNasaLogoPlaceholder(currentUrl);
      const isPngPlaceholder = currentUrl.endsWith('.png');
      const isGenericTitle = entry.title?.en === 'NASA Science' || entry.title?.id === 'Ilmu Pengetahuan NASA';

      const needsFix = force || isPlaceholderUrl || isPngPlaceholder || isGenericTitle;

      if (!needsFix) {
        skipped++;
        results.push({ date, status: 'ok', url: currentUrl.substring(0, 80) });
        continue;
      }

      console.log(`[APOD Fix] Processing fix for ${date} (current: ${currentUrl})`);

      const wpData = await fetchApodFromWordPress(date);

      if (!wpData || !wpData.imageUrl) {
        failed++;
        results.push({ date, status: 'no_wp_image', oldUrl: currentUrl.substring(0, 80) });
        continue;
      }

      if (!dryRun) {
        const r2Url = await cacheImageToR2(wpData.imageUrl, date);
        
        const updatePayload: any = {
          image_url: r2Url,
          fixedAt: new Date().toISOString(),
          fixSource: 'nasa-wordpress-api'
        };

        if (wpData.title && (isGenericTitle || !entry.title?.en || entry.title.en === 'NASA Science')) {
          updatePayload.title = {
            en: wpData.title,
            id: wpData.title
          };
        }

        if (wpData.explanation && (!entry.explanation?.en || entry.explanation.en.includes('Source: NASA Open Data APIs'))) {
          updatePayload.explanation = {
            en: wpData.explanation,
            id: wpData.explanation
          };
        }

        await adminDb.collection('apod_history').doc(date).update(updatePayload);

        fixed++;
        results.push({
          date,
          status: 'fixed',
          title: wpData.title,
          oldUrl: currentUrl.substring(0, 60),
          newUrl: r2Url.substring(0, 80)
        });
      } else {
        fixed++;
        results.push({
          date,
          status: 'would_fix',
          title: wpData.title,
          oldUrl: currentUrl.substring(0, 60),
          newUrl: wpData.imageUrl.substring(0, 80)
        });
      }
    }

    // Rebuild R2 cache
    if (!dryRun && fixed > 0) {
      try {
        const snapAll = await adminDb.collection('apod_history').orderBy('id', 'desc').limit(100).get();
        const historyList: any[] = [];
        snapAll.forEach((doc: any) => historyList.push({ id: doc.id, ...doc.data() }));
        await uploadToR2('data/encyclopedia/history.json', JSON.stringify(historyList, null, 2), 'application/json');
        
        const latestEntry = historyList[0];
        if (latestEntry) {
          await uploadToR2('data/encyclopedia/latest.json', JSON.stringify(latestEntry, null, 2), 'application/json');
        }
        console.log('[APOD Fix] Rebuilt R2 history and latest cache successfully.');
      } catch (cacheErr) {
        console.error('[APOD Fix] Failed to rebuild R2 cache:', cacheErr);
      }
    }

    // Revalidate paths on Next.js / Vercel Edge
    try {
      revalidatePath('/');
      revalidatePath('/apod');
      revalidatePath('/ensiklopedia');
    } catch {}

    return NextResponse.json({
      success: true,
      dryRun,
      force,
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
