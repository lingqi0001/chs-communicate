importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

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

