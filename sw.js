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
  // The push payload's `open` field is a routing hint set server-side
  // (see send-transfer-push) — right now it's always "transfers", but
  // keeping it data-driven means a future notification type can carry
  // a different destination without touching this file again.
  const openTarget = (event.notification.data && event.notification.data.open) || null;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focusing an already-open tab (rather than always opening a new
      // one) is what lets the page's own visibilitychange handler fire
      // forceResync() — that's the actual "get fresh data" step; this
      // service worker's only job is getting the app back in front of
      // the person as fast as possible.
      for (const client of clientList) {
        if ('focus' in client) {
          // App is already open — tell its own script where to jump to
          // instead of navigating/reloading the SPA out from under it.
          if (openTarget && 'postMessage' in client) client.postMessage({ type: 'push-open', open: openTarget });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        const url = openTarget ? new URL('?fromPush=' + openTarget, self.registration.scope).href : self.registration.scope;
        return self.clients.openWindow(url);
      }
    })
  );
});
