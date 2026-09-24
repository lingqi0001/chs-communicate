importScripts('./vendor/firebase/10.7.1/firebase-app-compat.js');
importScripts('./vendor/firebase/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCJX0prT18UJDn-hPsUWxVkXMdWAVrjgeM",
    authDomain: "chschat.xyz",
    databaseURL: "https://chscommunication-default-rtdb.firebaseio.com",
    projectId: "chscommunication",
    storageBucket: "chscommunication.firebasestorage.app",
    messagingSenderId: "61899173277",
    appId: "1:61899173277:web:330ad28d8de3c0527a5374"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const data = payload.data || payload.notification || {};
  const title = data.title || 'Notification';
  const options = {
    body: data.body,
    icon: data.icon || '/resources/favicon.svg',
    badge: data.badge || '/badge.png',
    data: { url: data.url }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // Use URL from notification data if provided, otherwise fallback to origin root
    const targetUrl = (event.notification.data && event.notification.data.url) || (self.location.origin + '/');
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url === targetUrl && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

/* ===== Offline shell =====
   This is the only SW at the root scope (FCM requires it), so the offline
   cache lives here rather than in a second registration: swapping the
   script URL would rotate the PushSubscription and every stored FCM token.
   Network-first everywhere, so a deploy is live on the next load; the cache
   is only what a user sees when the network is gone. */
const OFFLINE_CACHE = 'chs-offline-v1';

// Version-free only: every ?v= / Date.now() asset is captured by the
// runtime pass below, so this list never needs editing on deploy.
const PRECACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/vendor/tailwind-play.js',
    '/vendor/firebase/10.7.1/firebase-app.js',
    '/vendor/firebase/10.7.1/firebase-auth.js',
    '/vendor/firebase/10.7.1/firebase-database.js',
    '/vendor/firebase/10.7.1/firebase-storage.js',
    '/vendor/firebase/10.7.1/firebase-functions.js',
    '/vendor/firebase/10.7.1/firebase-messaging.js',
    '/resources/favicon.svg',
    '/resources/apple-touch-icon.svg',
    '/badge.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(OFFLINE_CACHE)
            .then(cache => cache.addAll(PRECACHE))
            .catch(err => console.warn('[SW] Precache incomplete:', err))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== OFFLINE_CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Cache keys carry a version query (?v=… or ?t=Date.now()), so one file can
// otherwise accumulate an entry per release forever. Keep only the newest.
async function putFresh(cache, request, response) {
    const url = new URL(request.url);
    if (url.search) {
        const stale = await cache.keys(request);
        await Promise.all(stale.map(entry => {
            if (entry.url === request.url) return undefined;
            if (new URL(entry.request.url).pathname !== url.pathname) return undefined;
            return cache.delete(entry.request);
        }));
    }
    await cache.put(request, response);
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // RTDB / Storage / push are useless offline and must never be answered
    // from a stale cache: let them fail fast so the app's own timeout guards
    // and the offline banners do their job.
    if (url.origin !== self.location.origin) return;

    // Extension pages carry no ?v= version, so the browser HTTP cache could
    // hand back an old tool after a deploy. Ask the network outright for those
    // paths; the rest of the app is versioned by query and can keep using the
    // HTTP cache between releases.
    const mustRevalidate = url.pathname.startsWith('/extensions/');

    event.respondWith(
        fetch(request.clone(), mustRevalidate ? { cache: 'reload' } : {}).then(response => {
            if (response.ok) {
                const copy = response.clone();
                caches.open(OFFLINE_CACHE).then(cache => putFresh(cache, request, copy));
            }
            return response;
        }).catch(async () => {
            const cached = await caches.match(request);
            if (cached) return cached;
            if (request.mode === 'navigate') {
                const shell = await caches.match('/index.html');
                if (shell) return shell;
            }
            return new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
});

