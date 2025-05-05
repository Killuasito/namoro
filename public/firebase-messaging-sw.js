importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCk4nzkwe_frQDG3IIPtIF2YJWbHvmO3GQ",
  authDomain: "namoro-5256c.firebaseapp.com",
  projectId: "namoro-5256c",
  storageBucket: "namoro-5256c.firebasestorage.app",
  messagingSenderId: "915577104850",
  appId: "1:915577104850:web:7684c219dbe451b8a3000b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: payload.data,
    vibrate: [200, 100, 200],
    tag: "notification",
    renotify: true,
    actions: [
      { action: "open", title: "Abrir" },
      { action: "close", title: "Fechar" },
    ],
    requireInteraction: true,
  };

  return self.registration.showNotification(
    payload.notification.title,
    notificationOptions
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "open") {
    clients.openWindow("/");
  }
});
