/**
 * Service Worker for Control Financiero PWA
 * Handles: install, activate, fetch lifecycle events
 * Strategy: Cache-first for App Shell, Network-first for dynamic content
 */

const CACHE_NAME = 'finanzas-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/expenses.html',
  '/budget.html',
  '/deudas.html',
  '/settings.html',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
];

// ─── Install Event ───
// Pre-cache App Shell resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching App Shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[SW] App Shell cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching App Shell:', error);
      })
  );
});

// ─── Activate Event ───
// Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// ─── Fetch Event ───
// Cache-first for App Shell, Network-first for other requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // If found in cache, return cached version
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate for assets)
        fetchAndCache(request);
        return cachedResponse;
      }

      // Not in cache, try network
      return fetchAndCache(request).catch(() => {
        // If network fails and it's a navigation request, show offline page
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Sin conexion', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    })
  );
});

/**
 * Fetch a request and cache the response
 * @param {Request} request
 * @returns {Promise<Response>}
 */
function fetchAndCache(request) {
  return fetch(request).then((response) => {
    // Don't cache non-successful responses or opaque responses
    if (!response || response.status !== 200) {
      return response;
    }

    // Clone the response since it can only be consumed once
    const responseClone = response.clone();

    caches.open(CACHE_NAME).then((cache) => {
      cache.put(request, responseClone);
    });

    return response;
  });
}
