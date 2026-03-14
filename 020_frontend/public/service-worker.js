
// Service Worker for Musig Elgg Push Notifications

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing Service Worker ...', event);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating Service Worker ...', event);
    return self.clients.claim();
});

self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    let data = { title: 'Musig Elgg', body: 'Neue Benachrichtigung', url: '/' };

    if (event.data) {
        try {
            data = JSON.parse(event.data.text());
        } catch (e) {
            console.error('[Service Worker] Error parsing push data', e);
            data.body = event.data.text();
        }
    }

    const title = data.title || 'Musig Elgg';
    // Simplified options for debugging - removed icon/badge (potential size issue)
    const options = {
        body: data.body,
        icon: data.icon || '/logo_red.png',
        badge: data.badge || '/logo_red.png',
        data: data.data || { url: '/' },
        tag: data.tag,
        requireInteraction: true
    };

    console.log('[Service Worker] Showing notification with options:', options);

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => console.log('[Service Worker] Notification shown successfully'))
            .catch(err => console.error('[Service Worker] Error showing notification:', err))
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window open with this URL
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
