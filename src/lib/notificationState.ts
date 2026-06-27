import { adminDb } from './firebaseAdmin';

export type NotificationEventType =
  | 'earthquake_alert'
  | 'tsunami_alert'
  | 'extreme_weather_alert'
  | 'daily_sky_summary'
  | 'weekly_energy_summary';

export interface NotificationEventState {
  signature?: string;
  sentAt?: string;
  checkedAt?: string;
  sent?: boolean;
}

const STATE_COLLECTION = 'system';
const STATE_DOCUMENT = 'earth-monitoring-alerts';

export async function getNotificationState(eventType: NotificationEventType): Promise<NotificationEventState> {
  const snapshot = await adminDb.collection(STATE_COLLECTION).doc(STATE_DOCUMENT).get();
  const data = snapshot.exists ? snapshot.data() : null;
  return data?.eventStates?.[eventType] || {};
}

export async function markNotificationChecked(
  eventType: NotificationEventType,
  signature?: string
) {
  await adminDb.collection(STATE_COLLECTION).doc(STATE_DOCUMENT).set({
    [`eventStates.${eventType}.checkedAt`]: new Date().toISOString(),
    ...(signature ? { [`eventStates.${eventType}.signature`]: signature } : {}),
  }, { merge: true });
}

export async function markNotificationSent(
  eventType: NotificationEventType,
  signature: string,
  sent: boolean
) {
  await adminDb.collection(STATE_COLLECTION).doc(STATE_DOCUMENT).set({
    [`eventStates.${eventType}.signature`]: signature,
    [`eventStates.${eventType}.sentAt`]: new Date().toISOString(),
    [`eventStates.${eventType}.sent`]: sent,
  }, { merge: true });
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
