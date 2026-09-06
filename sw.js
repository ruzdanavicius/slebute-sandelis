/* Šlebutė Sandėlis — service worker
   Handles two things only: showing a push notification when one arrives,
   and focusing (or opening) the app when that notification is tapped.
   Deliberately minimal — no caching/offline-asset strategy here, that's
   handled separately by the app's own offline queue (see index.html). */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { /* non-JSON payload — show with defaults */ }

  const title = data.title || 'Šlebutė Sandėlis';
  const options = {
    body: data.body || '',
    tag: data.tag || undefined,       // same tag replaces an older not-yet-seen notification instead of stacking
    data: data,                       // carried through to notificationclick — no separate lookup needed
    vibrate: [40, 60, 40],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focusing an already-open tab (rather than always opening a new
      // one) is what lets the page's own visibilitychange handler fire
      // forceResync() — that's the actual "get fresh data" step; this
      // service worker's only job is getting the app back in front of
      // the person as fast as possible.
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
