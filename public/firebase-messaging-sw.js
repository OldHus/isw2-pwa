importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

console.log("[sw] firebase-messaging-sw.js cargado, config:", {
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
});

const messaging = firebase.messaging();

self.addEventListener("push", (event) => {
  console.log("[sw] evento push recibido, hay datos:", event.data ? event.data.text() : "(sin datos)");
});

messaging.onBackgroundMessage((payload) => {
  console.log("[sw] onBackgroundMessage:", payload);
  const title = (payload.notification && payload.notification.title) || "Ingesoft II";
  const body = (payload.notification && payload.notification.body) || "";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: (payload.data && payload.data.type) || "ingesoft",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const type = (event.notification.data && event.notification.data.type) || "";
  const pathByType = {
    post: "/muro",
    poll: "/encuestas",
    quiz: "/quiz",
  };
  const targetPath = pathByType[type] || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetPath);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});