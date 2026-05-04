importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyCJX0prT18UJDn-hPsUWxVkXMdWAVrjgeM",
    authDomain: "chscommunication.firebaseapp.com",
    databaseURL: "https://chscommunication-default-rtdb.firebaseio.com",
    projectId: "chscommunication",
    storageBucket: "chscommunication.firebasestorage.app",
    messagingSenderId: "61899173277",
    appId: "1:61899173277:web:330ad28d8de3c0527a5374"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
