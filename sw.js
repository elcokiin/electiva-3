'use strict';

importScripts('./js/sw-utils.js');

const CACHE_NAME = 'twittor-static-v1';
const DYNAMIC_CACHE = 'twittor-dynamic-v1';
const INMUTABLE_CACHE = 'twittor-immutable-v1';

const APP_SHELL = [
    '/',
    '/index.html',
    'css/style.css',
    'css/animate.css',
    'js/app.js',
    'js/libs/jquery.js',
    'img/avatars/spiderman.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/wolverine.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/hulk.jpg',
    'img/favicon.ico'
];

const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css'
];

self.addEventListener('install', event => {
    const assureStatic = caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(APP_SHELL);
    });

    const assureImmutable = caches.open(INMUTABLE_CACHE).then(cache => {
        return cache.addAll(APP_SHELL_INMUTABLE);
    });

    event.waitUntil(Promise.all([assureStatic, assureImmutable]));
});

self.addEventListener('activate', event => {
    const assureVersion = caches.keys().then(keys => {
        keys.forEach(key => {
            if (key !== CACHE_NAME && key !== DYNAMIC_CACHE && key !== INMUTABLE_CACHE) {
                return caches.delete(key);
            }
        });
    });

    event.waitUntil(assureVersion);
});

self.addEventListener('fetch', event => {
    const response = caches.match(event.request).then(res => {
        if (res) {
            return res;
        } else {
            return fetch(event.request).then(networkRes => {
                return actualizaCacheDinamico(DYNAMIC_CACHE, event.request, networkRes);
            });
        }
    });

    event.respondWith(response);
});