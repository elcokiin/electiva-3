// ============================================================
// sw.js — Service Worker PWA Rick & Morty
//
// FASE 2: Ciclo de vida (install / activate)
// FASE 3: Intercepción de fetch con router de estrategias
//
// Estrategias implementadas:
//   • App Shell   → Cache First
//   • API JSON    → Network First
//   • Imágenes    → Stale While Revalidate
//   • Fallback    → offline.html cuando todo falla
// ============================================================

// ── FASE 2: Constantes de caché ──────────────────────────────
const CACHE_STATIC_NAME = 'static-v2';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';     // API JSON
const CACHE_IMAGES_NAME = 'images-v1';      // Imágenes/avatares
const CACHE_INMUTABLE_NAME = 'inmutable-v1';   // CDN (Bootstrap, jQuery)

const CACHE_DYNAMIC_LIMIT = 50;   // Máx. entradas en caché dinámico
const CACHE_IMAGES_LIMIT = 100;  // Máx. imágenes cacheadas

// URL de la página offline precacheada
const OFFLINE_URL = './pages/offline.html';

// ── Recursos del App Shell (precacheados en install) ─────────
const APP_SHELL_RESOURCES = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/personajes.js',
  './pages/offline.html',
  './pages/leer-despues.html',
  './pages/js/leer-despues.js',
  './img/logo.png'
];

const INMUTABLE_RESOURCES = [
  'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js',
  'https://code.jquery.com/jquery-3.3.1.slim.min.js'
];

// ── Utilidades ───────────────────────────────────────────────

/**
 * Limita el número de entradas en un caché (FIFO).
 */
function limpiarCache(cacheName, limite) {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > limite) {
        cache.delete(keys[0]).then(() => limpiarCache(cacheName, limite));
      }
    });
  });
}

// ── FASE 2: INSTALL ──────────────────────────────────────────
// Precachea el App Shell y los recursos inmutables.
self.addEventListener('install', event => {
  console.log('[SW] Install');

  const cacheShell = caches.open(CACHE_STATIC_NAME).then(cache => {
    console.log('[SW] Precacheando App Shell...');
    return cache.addAll(APP_SHELL_RESOURCES);
  });

  const cacheInmutable = caches.open(CACHE_INMUTABLE_NAME).then(cache => {
    console.log('[SW] Precacheando recursos inmutables (CDN)...');
    return cache.addAll(INMUTABLE_RESOURCES);
  });

  event.waitUntil(Promise.all([cacheShell, cacheInmutable]));
  // Activa el nuevo SW sin esperar a que se cierren las pestañas
  self.skipWaiting();
});

// ── FASE 2: ACTIVATE ─────────────────────────────────────────
// Elimina cachés que ya no pertenecen a esta versión.
self.addEventListener('activate', event => {
  console.log('[SW] Activate');

  const cachesPermitidos = [
    CACHE_STATIC_NAME,
    CACHE_DYNAMIC_NAME,
    CACHE_IMAGES_NAME,
    CACHE_INMUTABLE_NAME
  ];

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !cachesPermitidos.includes(k))
          .map(k => {
            console.log('[SW] Eliminando caché obsoleto:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FASE 3: FETCH — Router de estrategias ────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejamos GET
  if (req.method !== 'GET') return;

  // Ignorar extensiones del navegador y esquemas no HTTP
  if (!url.protocol.startsWith('http')) return;

  // Ignorar peticiones de extensiones de Chrome
  if (url.hostname === 'chrome-extension' || req.url.startsWith('chrome-extension')) return;

  // ── 1. CDN / Recursos inmutables ─────────────────────────
  // Estrategia: Cache Only (nunca cambian)
  if (
    url.hostname.includes('bootstrapcdn.com') ||
    url.hostname.includes('jquery.com')
  ) {
    event.respondWith(estrategiaCacheOnly(req));
    return;
  }

  // ── 2. Imágenes (avatares de la API) ─────────────────────
  // Estrategia: Stale While Revalidate
  if (
    req.destination === 'image' ||
    url.href.includes('rickandmortyapi.com/api/character/avatar') ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(estrategiaStaleWhileRevalidate(req, CACHE_IMAGES_NAME, CACHE_IMAGES_LIMIT));
    return;
  }

  // ── 3. Llamadas JSON a la API ─────────────────────────────
  // Estrategia: Network First
  if (url.hostname.includes('rickandmortyapi.com')) {
    event.respondWith(estrategiaNetworkFirst(req));
    return;
  }

  // ── 4. App Shell (archivos locales) ──────────────────────
  // Estrategia: Cache First con fallback a offline.html para HTML
  event.respondWith(estrategiaCacheFirst(req));
});

// ════════════════════════════════════════════════════════════
// IMPLEMENTACIONES DE LAS ESTRATEGIAS
// ════════════════════════════════════════════════════════════

// ── Estrategia A: Cache Only ──────────────────────────────
// Sirve siempre desde caché. Si no está → error.
// Ideal para recursos CDN que nunca cambian.
function estrategiaCacheOnly(req) {
  return caches.match(req).then(cached => {
    if (cached) return cached;
    // Si por alguna razón no está en caché (primer uso sin install correcto), va a la red
    return fetch(req).then(res => {
      return caches.open(CACHE_INMUTABLE_NAME).then(cache => {
        cache.put(req, res.clone());
        return res;
      });
    });
  });
}

// ── Estrategia B: Cache First ─────────────────────────────
// 1. Busca en caché → entrega de inmediato.
// 2. Si no hay caché → va a la red y guarda.
// 3. Si falla la red y es HTML → muestra offline.html.
function estrategiaCacheFirst(req) {
  return caches.match(req).then(cached => {
    if (cached) {
      console.log('[SW] Cache First — HIT:', req.url);
      return cached;
    }

    console.log('[SW] Cache First — MISS, yendo a la red:', req.url);
    return fetch(req)
      .then(res => {
        if (!res || !res.ok) return res;
        return caches.open(CACHE_STATIC_NAME).then(cache => {
          cache.put(req, res.clone());
          limpiarCache(CACHE_STATIC_NAME, 60);
          return res;
        });
      })
      .catch(() => {
        // Sin red y sin caché → fallback offline solo para páginas HTML
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          console.log('[SW] Sin red + sin caché HTML → offline.html');
          return caches.match(OFFLINE_URL);
        }
      });
  });
}

// ── Estrategia C: Network First ──────────────────────────
// 1. Va a la red primero.
// 2. Si responde bien → guarda en caché dinámico y entrega.
// 3. Si falla → busca en caché.
// 4. Si tampoco hay caché → offline.html (si es HTML).
function estrategiaNetworkFirst(req) {
  return fetch(req)
    .then(res => {
      if (!res || !res.ok) {
        // Respuesta errónea → intentar caché
        return caches.match(req).then(cached => cached || res);
      }

      // Red OK → guardar en caché dinámico
      return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
        cache.put(req, res.clone());
        limpiarCache(CACHE_DYNAMIC_NAME, CACHE_DYNAMIC_LIMIT);
        console.log('[SW] Network First — guardado en caché:', req.url);
        return res;
      });
    })
    .catch(() => {
      console.warn('[SW] Network First — sin red, buscando caché:', req.url);
      return caches.match(req).then(cached => {
        if (cached) return cached;
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
      });
    });
}

// ── Estrategia D: Stale While Revalidate ─────────────────
// 1. Si hay caché → entrega de inmediato (aunque sea antiguo).
// 2. Siempre lanza fetch en segundo plano para actualizar caché.
// 3. Si no hay caché y hay red → guarda y entrega.
// 4. Si no hay caché y no hay red → falla silenciosamente (imagen rota).
function estrategiaStaleWhileRevalidate(req, cacheName, limite) {
  // No intentar cachear recursos que no sean http/https
  if (!req.url.startsWith('http')) return fetch(req).catch(() => { });

  return caches.match(req).then(cached => {

    // Fetch en segundo plano para revalidar (siempre)
    const fetchEnFondo = fetch(req).then(res => {
      // Solo cachear respuestas válidas de tipo basic u opaque
      if (res && res.ok && (res.type === 'basic' || res.type === 'cors' || res.type === 'opaque')) {
        caches.open(cacheName).then(cache => {
          cache.put(req, res.clone());
          limpiarCache(cacheName, limite);
          console.log('[SW] SWR — caché actualizado:', req.url);
        });
      }
      return res;
    }).catch(() => {
      console.warn('[SW] SWR — sin red para revalidar:', req.url);
    });

    if (cached) {
      console.log('[SW] SWR — entregando desde caché (revalidando en fondo):', req.url);
      return cached;
    }

    // Sin caché → esperar la red
    console.log('[SW] SWR — sin caché, esperando red:', req.url);
    return fetchEnFondo;
  });
}