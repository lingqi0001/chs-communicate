const CACHE_NAME = 'chs-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/resources/favicon.svg',
  '/resources/apple-touch-icon.svg',
  '/badge.png',
  '/js/core.js',
  '/js/config.js',
  '/js/db.js',
  '/js/user.js',
  '/js/view.js',
  '/js/chat.js',
  '/js/auth.js',
  '/js/security.js',
  '/js/sync.js',
  '/js/sidebar.js',
  '/js/search.js',
  '/js/settings.js',
  '/js/admin.js',
  '/js/modal.js',
  '/js/notify_v2.js',
  '/js/utils.js',
  '/js/ui-components.js',
  '/js/content.js',
  '/js/extensions.js',
  '/js/gallery.js',
  '/js/bridge.js',
  '/js/app-bridge.js',
  '/js/news.js',
  '/js/club.js',
  '/extensions/eagletime.js',
  '/extensions/cafeteria.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.pathname.startsWith('/messages/') || url.pathname.startsWith('/user_chats/') || url.pathname.startsWith('/user_notifications/') || url.pathname.startsWith('/.info/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
