/**
 * Service Worker for Control Financiero PWA
 * Handles: install, activate, fetch lifecycle events
 * Strategy: Cache-first for App Shell, Network-first for dynamic content
 */

const CACHE_NAME = 'finanzas-v2';
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
// Navigation: network-first with cache fallback
// Assets (css/js/fonts/images): stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

/**
 * Determines if request is a static asset likely needed for paint/perceived performance
 * @param {Request} request
 * @returns {boolean}
 */
function isStaticAsset(request) {
  const destination = request.destination;
  return (
    destination === 'style' ||
    destination === 'script' ||
    destination === 'font' ||
    destination === 'image'
  );
}

/**
 * Network-first strategy with cache fallback
 * @param {Request} request
 * @param {string} [fallbackPath]
 * @returns {Promise<Response>}
 */
function networkFirst(request, fallbackPath) {
  return fetchAndCache(request)
    .then((response) => response)
    .catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      if (fallbackPath) {
        const fallback = await caches.match(fallbackPath);
        if (fallback) return fallback;
      }

      return new Response('Sin conexion', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    });
}

/**
 * Stale-while-revalidate strategy for static assets
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkPromise = fetchAndCache(request).catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response('Sin conexion', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

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
