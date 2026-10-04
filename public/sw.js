const CACHE_NAME = 'jarvis-pwa-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do not cache external AI API requests or our own API routes
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('openai.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Network-first with cache fallback for local files
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── PUSH NOTIFICATIONS (from server via QStash) ──────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Jarvis', body: event.data.text() };
  }

  const { title = 'Jarvis 🤖', body = '', icon, badge, tag, data: extraData } = data;

  const options = {
    body,
    icon: icon || '/icon-192.png',
    badge: badge || '/icon-192.png',
    tag: tag || 'jarvis-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: extraData || { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── IN-APP NOTIFICATION REQUEST (from main thread) ───────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }
});

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
