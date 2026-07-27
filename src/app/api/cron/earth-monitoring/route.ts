import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendBroadcastNotification } from '@/lib/notifications';
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
export const maxDuration = 80;

const EXTREME_WEATHER_COOLDOWN_MS = 6 * 60 * 60 * 1000;

import { isValidCronRequest } from '@/lib/cronAuth';

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
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
      let weatherText = '';
      if (earthquake.coordinates) {
        try {
          const coords = earthquake.coordinates.split(',');
          if (coords.length === 2) {
            const latVal = parseFloat(coords[0].trim());
            const lonVal = parseFloat(coords[1].trim());
            if (!isNaN(latVal) && !isNaN(lonVal)) {
              const { fetchAndCacheWeather } = await import('@/lib/openweather');
              const w = await fetchAndCacheWeather(latVal, lonVal);
              if (w) {
                weatherText = `${w.description}, suhu ${w.temp}°C, kelembapan ${w.humidity}%, angin ${w.wind_speed} m/s`;
              }
            }
          }
        } catch (weatherErr) {
          console.error('[Earthquake Cron] Gagal mengambil cuaca koordinat:', weatherErr);
        }
      }

      let msg = buildEarthquakeAlertMessage(earthquake);
      if (weatherText) {
        msg += `\n\n☁️ <b>Kondisi Cuaca di Pusat Gempa:</b> ${weatherText}`;
      }

      const broadcastRes = await sendBroadcastNotification({
        title: `🚨 Peringatan Gempa M ${earthquake.magnitude.toFixed(1)}`,
        body: `Gempa bumi M ${earthquake.magnitude.toFixed(1)} di ${earthquake.region}. ${earthquake.tsunamiPotential}`,
        telegramHtml: msg,
        link: `/monitoring`
      });
      earthquakeTelegramSent = broadcastRes.tgSuccess;

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
        const weatherMsg = buildExtremeWeatherMessage(alerts);
        const broadcastRes = await sendBroadcastNotification({
          title: `⛈️ Peringatan Cuaca Ekstrem`,
          body: `Ditemukan ${alerts.length} wilayah dengan indikasi cuaca ekstrem. Harap waspada.`,
          telegramHtml: weatherMsg,
          link: `/monitoring`
        });
        extremeTelegramSent = broadcastRes.tgSuccess;
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

    // 3. Pengecekan Aktivitas Gunung Api MAGMA Indonesia (VONA RED Alert)
    let magmaAlert = {
      checked: false,
      alertCount: 0,
      telegramSent: false,
      error: ''
    };
    try {
      const { getAbsoluteUrl } = await import('@/lib/siteUrl');
      const magmaRes = await fetch(`${getAbsoluteUrl('/api/earth-monitoring/magma')}`, { cache: 'no-store' });
      if (magmaRes.ok) {
        const magmaJson = await magmaRes.json();
        const vonas = magmaJson.vona || [];
        const redVonas = vonas.filter((v: any) => v.current_code === 'RED');
        
        let magmaTelegramSent = false;
        if (redVonas.length > 0) {
          const latestRed = redVonas[0];
          const signature = `magma:vona:${latestRed.vona_id || latestRed.volcano_name}:${latestRed.issued_time}`;
          const state = await getNotificationState('magma_volcano_alert');
          const isNewVona = shouldSendStatefulNotification(state, signature, 12 * 60 * 60 * 1000); // 12h cooldown
          
          if (isNewVona) {
            const msg = `🌋 <b>PERINGATAN ERUPSI GUNUNG API (MAGMA INDONESIA)</b> 🌋\n\n` +
              `🔺 <b>Gunung Api:</b> ${latestRed.volcano_name}\n` +
              `🔴 <b>Status Kode Penerbangan:</b> ${latestRed.current_code}\n` +
              `📝 <b>Ringkasan Aktivitas:</b> ${latestRed.volcanic_activity_summary || 'Terjadi erupsi dan aktivitas vulkanik.'}\n` +
              `💨 <b>Kolom Abu:</b> ${latestRed.ash_cloud || 'Tidak teramati.'}\n` +
              `🕒 <b>Waktu Rilis:</b> ${new Date(latestRed.issued_time).toLocaleString('id-ID')}\n\n` +
              `<i>Rekomendasi: ${latestRed.remarks || 'Patuhi zona aman sektoral.'}</i>`;
              
            const broadcastRes = await sendBroadcastNotification({
              title: `🌋 Peringatan Letusan Gunung ${latestRed.volcano_name}`,
              body: `Gunung ${latestRed.volcano_name} berstatus ${latestRed.current_code} (Awas/Erupsi).`,
              telegramHtml: msg,
              link: `/cuaca`
            });
            magmaTelegramSent = broadcastRes.tgSuccess;
            await markNotificationSent('magma_volcano_alert', signature, magmaTelegramSent);
          }
        }

        magmaAlert = {
          checked: true,
          alertCount: redVonas.length,
          telegramSent: magmaTelegramSent,
          error: ''
        };
      }
    } catch (magmaErr: any) {
      magmaAlert = {
        checked: false,
        alertCount: 0,
        telegramSent: false,
        error: magmaErr instanceof Error ? magmaErr.message : String(magmaErr)
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
      magmaAlert,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal menjalankan cron earth monitoring.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
