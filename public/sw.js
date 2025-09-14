// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim()); // Become available to all pages
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Hotel Manager PWA';
  const options = {
    body: event.data.text(),
    icon: '/pwa-192x192.png', // Using an existing icon
    badge: '/pwa-192x192.png' // Can use the same for badge
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
