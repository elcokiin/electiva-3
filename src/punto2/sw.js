const CACHE = 'galeria-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './fallback.svg',
  './resources/imagen1.svg',
  './resources/imagen2.svg',
  './resources/imagen3.svg',
  './resources/imagen4.svg',
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)))
);

self.addEventListener('activate', e =>
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
);

self.addEventListener('fetch', e =>
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
);