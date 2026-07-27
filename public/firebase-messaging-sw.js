importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCgxsEmC4G-5n9VSl7uRhSRIOebReN7-BU",
  authDomain: "meteorit-indonesia.firebaseapp.com",
  projectId: "meteorit-indonesia",
  storageBucket: "meteorit-indonesia.firebasestorage.app",
  messagingSenderId: "83461705969",
  appId: "1:83461705969:web:778621d5f596662357d950"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Meteorit Indonesia';
  const clickAction = payload.data?.click_action || payload.data?.url || '/';
  
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/pwa-icons/icon-256.png',
    badge: '/pwa-icons/icon-256.png',
    data: {
      click_action: clickAction
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
