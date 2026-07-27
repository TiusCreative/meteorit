import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, fetchJsonFromR2 } from '@/lib/r2Client';

const METADATA_KEY = 'data/weather/metadata.json';

interface WeatherMetadata {
  reports: CommunityReport[];
  updatedAt: string;
}

interface CommunityReport {
  city: string;
  condition: string;
  note: string;
  emoji: string;
  timestamp: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  try {
    const meta = await fetchJsonFromR2<WeatherMetadata>(METADATA_KEY) || { reports: [], updatedAt: '' };

    if (type === 'reports') {
      return NextResponse.json({ reports: meta.reports || [] });
    }

    return NextResponse.json(meta);
  } catch (error) {
    console.error('[Cuaca R2 Metadata] GET error:', error);
    return NextResponse.json({ reports: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, report } = body;

    if (type !== 'report' || !report) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Validate required fields
    if (!report.city || !report.condition) {
      return NextResponse.json({ error: 'Missing city or condition' }, { status: 400 });
    }

    // Load existing metadata
    const meta = await fetchJsonFromR2<WeatherMetadata>(METADATA_KEY) || { reports: [], updatedAt: '' };

    // Prepend new report, keep only last 50
    meta.reports = [report, ...(meta.reports || [])].slice(0, 50);
    meta.updatedAt = new Date().toISOString();

    // Save back to R2
    await uploadToR2(METADATA_KEY, JSON.stringify(meta, null, 2), 'application/json');

    // Send Telegram Notification to Channel
    try {
      const { sendTelegramMessage } = await import('@/lib/telegram');
      const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';
      const formattedTime = new Date(report.timestamp).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta'
      });
      
      const message = `📢 <b>Laporan Cuaca Komunitas Terbaru!</b>\n\n` +
        `📍 <b>Kota/Daerah:</b> ${report.city}\n` +
        `🌤 <b>Kondisi:</b> ${report.emoji} ${report.condition}\n` +
        `📝 <b>Catatan:</b> ${report.note || '-'}\n` +
        `⏰ <b>Waktu:</b> ${formattedTime} WIB\n\n` +
        `<i>Laporan dikirim langsung oleh pengguna melalui Mini App Cuaca.</i>`;

      await sendTelegramMessage(TELEGRAM_CHANNEL_ID, message);
    } catch (tgErr) {
      console.error('[Cuaca R2 Metadata] Gagal mengirim notifikasi Telegram:', tgErr);
    }

    return NextResponse.json({ success: true, total: meta.reports.length });
  } catch (error) {
    console.error('[Cuaca R2 Metadata] POST error:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
