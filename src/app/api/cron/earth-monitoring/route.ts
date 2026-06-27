import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import {
  buildExtremeWeatherMessage,
  buildEarthquakeAlertMessage,
  buildExtremeWeatherSignature,
  detectExtremeWeather,
  fetchLatestBmkgEarthquake,
  fetchBmkgWeatherAlertText,
  fetchLiveWeatherSnapshot,
  getEarthquakeEventType,
  shouldSendEarthquakeAlert,
} from '@/lib/earthMonitoring';
import {
  getNotificationState,
  markNotificationChecked,
  markNotificationSent,
  shouldSendStatefulNotification,
} from '@/lib/notificationState';

export const dynamic = 'force-dynamic';

const EXTREME_WEATHER_COOLDOWN_MS = 6 * 60 * 60 * 1000;

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

  try {
    const channelId = process.env.TELEGRAM_CHANNEL_ID || '';
    const earthquake = await fetchLatestBmkgEarthquake();
    const earthquakeEventType = getEarthquakeEventType(earthquake);
    const earthquakeState = await getNotificationState(earthquakeEventType);
    const isNew = shouldSendStatefulNotification(earthquakeState, earthquake.signature);
    const shouldNotify = isNew && shouldSendEarthquakeAlert(earthquake);

    if (earthquake.signature) {
      await markNotificationChecked(earthquakeEventType, earthquake.signature);
      await adminDb.collection('system').doc('earth-monitoring-alerts').set({
        lastEarthquakeSignature: earthquake.signature,
        lastEarthquakeCheckedAt: new Date().toISOString(),
        lastEarthquakeMagnitude: earthquake.magnitude,
      }, { merge: true });
    }

    let earthquakeTelegramSent = false;
    if (shouldNotify) {
      earthquakeTelegramSent = channelId
        ? await sendTelegramMessage(channelId, buildEarthquakeAlertMessage(earthquake))
        : false;

      await markNotificationSent(earthquakeEventType, earthquake.signature, earthquakeTelegramSent);
      await adminDb.collection('system').doc('earth-monitoring-alerts').set({
        lastEarthquakeAlertedAt: new Date().toISOString(),
        lastEarthquakeTelegramSent: earthquakeTelegramSent,
      }, { merge: true });
    }

    let extremeWeather = {
      checked: false,
      alertCount: 0,
      shouldNotify: false,
      telegramSent: false,
      error: '',
    };

    try {
      const [weatherSnapshot, bmkgAlertText] = await Promise.all([
        fetchLiveWeatherSnapshot(),
        fetchBmkgWeatherAlertText(),
      ]);
      const alerts = detectExtremeWeather(weatherSnapshot.points, bmkgAlertText);
      const signature = buildExtremeWeatherSignature(alerts);
      const state = await getNotificationState('extreme_weather_alert');
      const shouldNotifyExtreme = alerts.length > 0 &&
        shouldSendStatefulNotification(state, signature, EXTREME_WEATHER_COOLDOWN_MS);
      let extremeTelegramSent = false;

      await markNotificationChecked('extreme_weather_alert', signature || weatherSnapshot.updatedAt);

      if (shouldNotifyExtreme) {
        extremeTelegramSent = channelId
          ? await sendTelegramMessage(channelId, buildExtremeWeatherMessage(alerts))
          : false;
        await markNotificationSent('extreme_weather_alert', signature, extremeTelegramSent);
      }

      extremeWeather = {
        checked: true,
        alertCount: alerts.length,
        shouldNotify: shouldNotifyExtreme,
        telegramSent: extremeTelegramSent,
        error: '',
      };
    } catch (error) {
      extremeWeather = {
        checked: false,
        alertCount: 0,
        shouldNotify: false,
        telegramSent: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    return NextResponse.json({
      success: true,
      earthquake: {
        eventType: earthquakeEventType,
        isNew,
        shouldNotify,
        telegramSent: earthquakeTelegramSent,
        data: earthquake,
      },
      extremeWeather,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal menjalankan cron earth monitoring.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
