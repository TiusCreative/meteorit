import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import { buildDailySkyMessage } from '@/lib/earthMonitoring';
import {
  getNotificationState,
  markNotificationChecked,
  markNotificationSent,
  shouldSendStatefulNotification,
} from '@/lib/notificationState';

export const dynamic = 'force-dynamic';

import { isValidCronRequest } from '@/lib/cronAuth';

import { sendBroadcastNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayJakarta = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const signature = `daily_sky_summary:${todayJakarta}`;
  const state = await getNotificationState('daily_sky_summary');
  const shouldNotify = shouldSendStatefulNotification(state, signature);

  await markNotificationChecked('daily_sky_summary', signature);

  if (!shouldNotify) {
    return NextResponse.json({ success: true, eventType: 'daily_sky_summary', skipped: true, telegramSent: false });
  }

  const message = await buildDailySkyMessage();
  const broadcastRes = await sendBroadcastNotification({
    title: '🌌 Rekomendasi Langit Malam Ini',
    body: 'Cek prediksi langit malam ini untuk observasi bintang terbaik di Indonesia.',
    telegramHtml: message,
    link: '/langit-malam'
  });
  const telegramSent = broadcastRes.tgSuccess;

  await markNotificationSent('daily_sky_summary', signature, telegramSent);

  return NextResponse.json({ success: true, eventType: 'daily_sky_summary', skipped: false, telegramSent });
}
