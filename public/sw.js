// ============================================================
//  Firebase Cloud Messaging – background / closed-app handler
//  Must use the compat (importScripts) build inside a SW context
// ============================================================
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA_8-RdhF_UuxLeXFDKNwOcl9awFRrz6qU",
  authDomain: "loyalty-e883f.firebaseapp.com",
  projectId: "loyalty-e883f",
  storageBucket: "loyalty-e883f.firebasestorage.app",
  messagingSenderId: "603261005182",
  appId: "1:603261005182:web:f1da0df6b659e8b99c172f",
  measurementId: "G-CC6YZ3GSYR",
});

const messaging = firebase.messaging();

/**
 * Handle background messages (app closed / minimised).
 * FCM automatically shows the notification from payload.notification,
 * but you can customise it here if needed.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  // If the payload already has a `notification` field, Firebase automatically
  // shows the OS notification — calling showNotification here would cause a
  // duplicate. Only handle data-only messages manually.
  if (payload.notification) return;

  const notificationTitle = payload.data?.title ?? 'Stamp Loyalty';
  const notificationOptions = {
    body: payload.data?.body ?? '',
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    // `url` comes from the message's data field so the click handler can
    // deep-link to the right page (e.g. '/rewards', '/home', etc.).
    data: {
      ...( payload.data ?? {} ),
      url: payload.data?.url ?? '/',
    },
    tag: 'stamp-notification',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================================
//  PWA Cache – Stamp Loyalty
// ============================================================
const CACHE_NAME = 'stamp-loyalty-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin and non-GET requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.method !== 'GET') return;

  // Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed – return cached or undefined
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Open / focus the app and navigate to the deep-link URL when user taps a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Prefer a URL embedded in the notification data, fall back to '/'
  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it and navigate to the target URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window at the target URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
