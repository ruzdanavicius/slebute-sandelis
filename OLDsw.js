/* ============================================================
   Šlebutė Sandėlis — service worker
   Upload this file to the SAME folder as index.html so it's reachable
   at a sibling path (e.g. https://your-host/sandelis/sw.js if that's
   where index.html lives). It does two things only:
     1. Show a system notification when a push message arrives.
     2. Focus (or open) the app when that notification is tapped.
   No caching, no offline shell — this app is read-mostly and already
   handles its own data refresh; this worker exists purely so push
   notifications can reach a closed app.
   ============================================================ */

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: 'Šlebutė Sandėlis', body: event.data ? event.data.text() : '' };
    }

    const title = data.title || 'Nauja persiuntimo užklausa';
    const options = {
        body: data.body || '',
        tag: data.tag || 'transfer-request',
        renotify: true,
        data: { url: data.url || './' }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || './';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) return client.focus();
            }
            if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
        })
    );
});
