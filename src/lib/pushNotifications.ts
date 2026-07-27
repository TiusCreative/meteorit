import { getMessaging } from 'firebase-admin/messaging';
import adminApp, { adminDb } from './firebaseAdmin';
import { getSiteUrl } from './siteUrl';

export async function sendPushNotificationToAll(title: string, body: string, relativePath?: string): Promise<boolean> {
  if (!adminApp) {
    console.warn('[FCM Push] Firebase Admin App is not initialized (mocked). Skipping push notification.');
    return false;
  }

  try {
    // 1. Fetch all tokens from Firestore 'fcm_tokens' collection
    const snapshot = await adminDb.collection('fcm_tokens').get();
    const tokens: string[] = [];
    
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });

    if (tokens.length === 0) {
      console.log('[FCM Push] No registered device tokens found in fcm_tokens collection.');
      return false;
    }

    const messaging = getMessaging(adminApp);
    const clickAction = relativePath ? `${getSiteUrl()}${relativePath.startsWith('/') ? '' : '/'}${relativePath}` : getSiteUrl();

    // Group into batches of 500 (Firebase multicast limit is 500)
    const batchSize = 500;
    const sendPromises = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize);
      
      const payload = {
        tokens: batchTokens,
        notification: {
          title,
          body,
        },
        data: {
          click_action: clickAction,
          url: clickAction,
        },
        webpush: {
          notification: {
            title,
            body,
            icon: '/pwa-icons/icon-256.png',
            click_action: clickAction,
          },
          fcmOptions: {
            link: clickAction,
          }
        }
      };

      sendPromises.push(messaging.sendEachForMulticast(payload));
    }

    const results = await Promise.all(sendPromises);
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach((res, batchIdx) => {
      successCount += res.successCount;
      failureCount += res.failureCount;
      
      // Clean up invalid/expired tokens from Firestore
      const startIdx = batchIdx * batchSize;
      if (res.responses && res.responses.length > 0) {
        res.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (errCode === 'messaging/invalid-registration-token' || errCode === 'messaging/registration-token-not-registered') {
              const badToken = tokens[startIdx + idx];
              if (badToken) {
                // Delete the expired token from database
                adminDb.collection('fcm_tokens').where('token', '==', badToken).get()
                  .then((badSnap: any) => {
                    badSnap.forEach((doc: any) => doc.ref.delete());
                  }).catch(() => {});
              }
            }
          }
        });
      }
    });

    console.log(`[FCM Push] Sent multicast notifications. Success: ${successCount}, Failure: ${failureCount}`);
    return true;
  } catch (err) {
    console.error('[FCM Push] Failed to send push notifications:', err);
    return false;
  }
}
