import { precacheAndRoute } from 'workbox-precaching';

// Precaching pre-compiled assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Fuerza al navegador a usar el nuevo Service Worker inmediatamente (sin esperar a que se cierren las pestañas)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
  let title = 'Moodle Notifier';
  let body = 'Tienes una nueva notificación';
  let targetUrl = '/';

  if (event.data) {
    try {
      // Intentar leer como JSON
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      targetUrl = data.url || targetUrl;
    } catch (e) {
      // Si el formato es un texto simple y causa error el JSON parse, se rescata aquí (Evita el silencio en iOS)
      body = event.data.text();
    }
  }

  const options = {
    body: body,
    data: { url: targetUrl }
  };

  // iOS Safari exige terminar mostrar la notificación para no "matar" el proceso
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToNavigate = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === urlToNavigate && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToNavigate);
    })
  );
});
