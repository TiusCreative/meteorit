import { queryD1 } from './d1Client';

export type NotificationEventType =
  | 'earthquake_alert'
  | 'tsunami_alert'
  | 'extreme_weather_alert'
  | 'daily_sky_summary'
  | 'weekly_energy_summary'
  | 'magma_volcano_alert';

export interface NotificationEventState {
  signature?: string;
  sentAt?: string;
  checkedAt?: string;
  sent?: boolean;
}

export async function getNotificationState(eventType: NotificationEventType): Promise<NotificationEventState> {
  try {
    const res = await queryD1('SELECT value FROM system_state WHERE key = ? LIMIT 1', [`notify-${eventType}`]);
    const row = res?.results?.[0];
    if (row?.value) {
      return JSON.parse(row.value);
    }
  } catch (err) {
    console.warn(`[NotificationState] Gagal membaca state ${eventType} dari D1:`, err);
  }
  return {};
}

export async function markNotificationChecked(
  eventType: NotificationEventType,
  signature?: string
) {
  try {
    const currentState = await getNotificationState(eventType);
    const updated = {
      ...currentState,
      checkedAt: new Date().toISOString(),
      ...(signature ? { signature } : {}),
    };
    await queryD1('INSERT OR REPLACE INTO system_state (key, value, updated_at) VALUES (?, ?, ?)', [
      `notify-${eventType}`,
      JSON.stringify(updated),
      new Date().toISOString()
    ]);
  } catch (err) {
    console.warn(`[NotificationState] Gagal update checked state ${eventType}:`, err);
  }
}

export async function markNotificationSent(
  eventType: NotificationEventType,
  signature: string,
  sent: boolean
) {
  try {
    const currentState = await getNotificationState(eventType);
    const updated = {
      ...currentState,
      signature,
      sentAt: new Date().toISOString(),
      sent,
    };
    await queryD1('INSERT OR REPLACE INTO system_state (key, value, updated_at) VALUES (?, ?, ?)', [
      `notify-${eventType}`,
      JSON.stringify(updated),
      new Date().toISOString()
    ]);
  } catch (err) {
    console.warn(`[NotificationState] Gagal update sent state ${eventType}:`, err);
  }
}

export function shouldSendStatefulNotification(
  state: NotificationEventState,
  signature: string,
  cooldownMs = 0
) {
  if (!signature) return false;
  if (state.signature === signature && state.sent) return false;

  if (cooldownMs > 0 && state.sentAt) {
    const lastSentAt = new Date(state.sentAt).getTime();
    if (Number.isFinite(lastSentAt) && Date.now() - lastSentAt < cooldownMs) {
      return false;
    }
  }

  return true;
}
