import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import { getAbsoluteUrl } from '@/lib/siteUrl';
import { isValidCronRequest } from '@/lib/cronAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const channelId = process.env.TELEGRAM_CHANNEL_ID || '';

    const today = new Date().toISOString().split('T')[0];

    // Fetch NEO data
    const neoRes = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${apiKey}`
    );

    if (!neoRes.ok) throw new Error(`NASA NEO API error: ${neoRes.status}`);
    const neoData = await neoRes.json();
    const nearEarthObjects = neoData.near_earth_objects?.[today] || [];

    const hazardous = nearEarthObjects.filter((neo: any) => neo.is_potentially_hazardous_asteroid);
    const totalCount = nearEarthObjects.length;

    // Also fetch DONKI for space weather
    const endDate = today;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const startStr = startDate.toISOString().split('T')[0];

    const flrRes = await fetch(
      `https://api.nasa.gov/DONKI/FLR?startDate=${startStr}&endDate=${endDate}&api_key=${apiKey}`
    ).catch(() => null);
    
    const flrData = flrRes?.ok ? await flrRes.json() : [];
    const hasXFlare = flrData.some((f: any) => f.classType?.startsWith('X'));

    // Build Telegram report
    let message = `🌌 <b>Laporan Harian Benda Langit — Meteorit Indonesia</b>\n`;
    message += `📅 ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

    // Asteroid section
    message += `🛰️ <b>Asteroid Dekat Bumi Hari Ini: ${totalCount} objek</b>\n`;

    if (hazardous.length > 0) {
      message += `\n⚠️ <b>PERINGATAN: ${hazardous.length} Asteroid Berpotensi Berbahaya Terdeteksi!</b>\n\n`;
      hazardous.slice(0, 3).forEach((neo: any) => {
        const approach = neo.close_approach_data?.[0];
        const distKm = parseFloat(approach?.miss_distance?.kilometers || '0');
        const distMoon = parseFloat(approach?.miss_distance?.lunar || '0');
        const velKmh = parseFloat(approach?.relative_velocity?.kilometers_per_hour || '0');
        const diamMax = neo.estimated_diameter?.kilometers?.estimated_diameter_max || 0;
        message += `🔴 <b>${neo.name}</b>\n`;
        message += `   • Diameter: ~${(diamMax * 1000).toFixed(0)} meter\n`;
        message += `   • Jarak Melintas: ${(distKm / 1000000).toFixed(3)} juta km (${distMoon.toFixed(1)} LD)\n`;
        message += `   • Kecepatan: ${(velKmh / 1000).toFixed(0)} ribu km/jam\n\n`;
      });
    } else {
      message += `✅ Semua asteroid melintas aman — tidak ada yang berpotensi berbahaya hari ini.\n\n`;
    }

    // Space weather section
    if (hasXFlare) {
      message += `☀️ <b>PERINGATAN CUACA ANTARIKSA: Solar Flare Kelas-X Terdeteksi!</b>\n`;
      message += `Badai matahari kuat terjadi. Potensi gangguan sinyal radio & satelit.\n\n`;
    } else if (flrData.length > 0) {
      message += `☀️ Aktivitas matahari: ${flrData.length} solar flare terdeteksi dalam 24 jam.\n\n`;
    } else {
      message += `☀️ Cuaca antariksa: Tenang.\n\n`;
    }

    message += `🔗 <a href="${getAbsoluteUrl('/monitoring')}">Pantau Langsung di Meteorit Indonesia →</a>`;

    // Send to Telegram channel
    let telegramSent = false;
    if (channelId) {
      telegramSent = await sendTelegramMessage(channelId, message);
    }

    // === AUTOMATIC KOMET ARTICLE GENERATION ===
    // Trigger the komet generation endpoint immediately to publish a new article for the closest/hazardous asteroid
    let kometArticleTriggered = false;
    let kometArticleResult = null;
    try {
      const secret = process.env.CRON_SECRET || 'UNVIKvyeh6thKFg7GiMhzSd33rVcz/yCZ/CBRyNuMvU=';
      const kometUrl = getAbsoluteUrl(`/api/cron/komet?secret=${encodeURIComponent(secret)}&bypass=true`);
      const kometRes = await fetch(kometUrl, { 
        headers: { 'Authorization': `Bearer ${secret}` },
        cache: 'no-store'
      });
      if (kometRes.ok) {
        kometArticleTriggered = true;
        kometArticleResult = await kometRes.json();
        console.log('[Cron NASA Alert] Komet article generated successfully:', kometArticleResult);
      }
    } catch (kometErr) {
      console.error('[Cron NASA Alert] Failed to trigger automatic komet article:', kometErr);
    }

    return NextResponse.json({
      success: true,
      date: today,
      totalAsteroids: totalCount,
      hazardousCount: hazardous.length,
      xFlareDetected: hasXFlare,
      telegramSent,
      kometArticleTriggered,
      kometArticleResult
    });
  } catch (error) {
    console.error('[Cron NASA Alert] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
