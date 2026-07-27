import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, details, location, severity } = body;

    if (!location || !severity) {
      return NextResponse.json({ error: 'Missing location or severity' }, { status: 400 });
    }

    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1004429795655';
    
    // Choose emoji based on severity
    const emoji = severity === 'extreme' ? '🚨' : '⚠️';
    
    const message = `${emoji} <b>PERINGATAN CUACA EKSTREM</b> ${emoji}\n\n` +
      `📍 <b>Lokasi:</b> ${location}\n` +
      `⚠️ <b>Kategori Bahaya:</b> ${severity.toUpperCase()}\n` +
      `📝 <b>Detail Ancaman:</b> ${details || 'Terdeteksi kondisi cuaca tidak bersahabat.'}\n\n` +
      `<i>Peringatan dirilis oleh sistem monitoring cuaca komunitas Meteorit Indonesia.</i>`;

    const success = await sendTelegramMessage(TELEGRAM_CHANNEL_ID, message);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Send Telegram Warning] Error:', error);
    return NextResponse.json({ error: 'Failed to send telegram message' }, { status: 500 });
  }
}
