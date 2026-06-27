import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import { buildWeeklyEnergyMessage } from '@/lib/earthMonitoring';
import {
  getNotificationState,
  markNotificationChecked,
  markNotificationSent,
  shouldSendStatefulNotification,
} from '@/lib/notificationState';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = process.env.CRON_SECRET || '';
  const authHeader = request.headers.get('authorization');
  return searchParams.get('secret') === secret || authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jakartaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const weekNumber = Math.ceil((Number(jakartaDate.slice(5, 7)) * 31 + Number(jakartaDate.slice(8, 10))) / 7);
  const signature = `weekly_energy_summary:${jakartaDate.slice(0, 4)}:w${weekNumber}`;
  const state = await getNotificationState('weekly_energy_summary');
  const shouldNotify = shouldSendStatefulNotification(state, signature);

  await markNotificationChecked('weekly_energy_summary', signature);

  if (!shouldNotify) {
    return NextResponse.json({ success: true, eventType: 'weekly_energy_summary', skipped: true, telegramSent: false });
  }

  const channelId = process.env.TELEGRAM_CHANNEL_ID || '';
  const message = await buildWeeklyEnergyMessage();
  const telegramSent = channelId ? await sendTelegramMessage(channelId, message) : false;

  await markNotificationSent('weekly_energy_summary', signature, telegramSent);

  return NextResponse.json({ success: true, eventType: 'weekly_energy_summary', skipped: false, telegramSent });
}
