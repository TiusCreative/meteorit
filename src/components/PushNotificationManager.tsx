'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { landingText } from '@/lib/landingText';
import { useSiteLanguage } from '@/lib/useSiteLanguage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCgxsEmC4G-5n9VSl7uRhSRIOebReN7-BU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "meteorit-indonesia.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "meteorit-indonesia",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "meteorit-indonesia.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "83461705969",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:83461705969:web:778621d5f596662357d950"
};

export default function PushNotificationManager() {
  const language = useSiteLanguage();
  const t = landingText[language];

  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
      return;
    }

    // Don't show if already dismissed or already granted/denied
    let dismissed = null;
    try {
      dismissed = localStorage.getItem('fcm_banner_dismissed');
    } catch (err) {
      console.warn('Gagal membaca storage di PushNotificationManager:', err);
    }
    if (dismissed || Notification.permission === 'granted' || Notification.permission === 'denied') {
      if (Notification.permission === 'granted') {
        registerAndSaveToken(true);
      }
      return;
    }

    // Show banner after 4 seconds for better user experience
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const registerAndSaveToken = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Izin notifikasi ditolak.');
      }

      // 2. Register Service Worker explicitly
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      // 3. Initialize Firebase app and messaging
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      // 4. Get FCM Token
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BHG4GE88B9uwBvUevktVh_PiawkyPRTa-SnvpzUpqjVFXBg6IF4b-BWfoJtx28Abs0ZyG5urcTcvtOr7s8dPQ4o';
      let token = '';
      try {
        token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey
        });
      } catch (err: any) {
        if (err.name === 'VersionError' || String(err).includes('VersionError')) {
          console.warn('[Web Push] Terdeteksi VersionError di IndexedDB. Mencoba mereset Service Worker dan IndexedDB...');
          try {
            // 1. Unregister active service workers to unlock IndexedDB
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const reg of registrations) {
                await reg.unregister();
              }
            } catch (swErr) {
              console.warn('[Web Push] Gagal melepaskan Service Worker:', swErr);
            }

            // 2. Delete all Firebase Messaging IndexedDB databases
            window.indexedDB.deleteDatabase('fcm_token_details_db');
            window.indexedDB.deleteDatabase('firebase-messaging-database');
            window.indexedDB.deleteDatabase('firebase-messaging-store');

            // 3. Wait to ensure database locks are fully released
            await new Promise((resolve) => setTimeout(resolve, 800));

            // 4. Re-register Service Worker fresh
            const newRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            // 5. Try getting token again
            token = await getToken(messaging, {
              serviceWorkerRegistration: newRegistration,
              vapidKey
            });
          } catch (retryErr) {
            console.error('[Web Push] Gagal mengambil token setelah reset total:', retryErr);
            throw retryErr;
          }
        } else {
          throw err;
        }
      }

      if (token) {
        // 5. Check if token already exists in Firestore 'fcm_tokens'
        const q = query(collection(db, 'fcm_tokens'), where('token', '==', token));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          await addDoc(collection(db, 'fcm_tokens'), {
            token,
            createdAt: new Date().toISOString(),
            platform: 'web_pwa'
          });
        }
      }

      setShowBanner(false);
    } catch (err) {
      console.error('[Web Push] Gagal registrasi token:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('fcm_banner_dismissed', 'true');
    } catch (err) {
      console.warn('Gagal menulis storage di PushNotificationManager:', err);
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-cyan-400/50">
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Bell className="h-5 w-5 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-bold text-white">{t.pushTitle || 'Notifikasi Antariksa Live'}</h4>
            <button 
              onClick={handleDismiss} 
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            {t.pushDesc || 'Aktifkan notifikasi browser untuk info live asteroid dekat Bumi, gempa BMKG, dan galeri APOD NASA.'}
          </p>
          <div className="flex gap-2 mt-3 justify-end">
            <button 
              onClick={handleDismiss} 
              className="px-3 py-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
            >
              {t.pushDismiss || 'Nanti Saja'}
            </button>
            <button 
              onClick={() => registerAndSaveToken(false)}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold px-3 py-1.5 rounded-lg text-[11px] transition-all disabled:opacity-50"
            >
              {loading ? (t.pushLoading || 'Mengaktifkan...') : (t.pushAccept || 'Aktifkan')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
