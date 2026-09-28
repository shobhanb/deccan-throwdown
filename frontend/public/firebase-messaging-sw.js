/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: 'deccan-throwdown',
  appId: '1:1049028653381:web:6c84ace588b23b4ecace2c',
  storageBucket: 'deccan-throwdown.firebasestorage.app',
  apiKey: 'AIzaSyAL9eMHBkuqs-1LgBwOc3835epOjAAG4D4',
  authDomain: 'deccan-throwdown.firebaseapp.com',
  messagingSenderId: '1049028653381',
  measurementId: 'G-LGS3X9TW9T',
});

const messaging = firebase.messaging();

function pushDisplayFields(payload) {
  const data = payload.data || {};
  return {
    title: data.title || payload.notification?.title || 'Deccan Throwdown',
    body: data.body || payload.notification?.body || '',
    route: data.route || '/',
  };
}

messaging.onBackgroundMessage((payload) => {
  const { title, body, route } = pushDisplayFields(payload);
  self.registration.showNotification(title, {
    body,
    data: { route },
    icon: '/icons/logo_192.jpg',
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(route);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(route);
      }
    }),
  );
});

importScripts('./ngsw-worker.js');
