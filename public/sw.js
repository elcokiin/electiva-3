// imports
importScripts('https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js')

importScripts('js/sw-db.js');
importScripts('js/sw-utils.js');


const STATIC_CACHE    = 'static-v2';
const DYNAMIC_CACHE   = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';


const APP_SHELL = [
    '/',
    'index.html',
    'css/style.css',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg',
    'js/app.js',
    'js/sw-utils.js',
    'js/libs/plugins/mdtoast.min.js',
    'js/libs/plugins/mdtoast.min.css'
];

const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    //'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js',
    'https://cdn.jsdelivr.net/npm/pouchdb@7.0.0/dist/pouchdb.min.js'
];



self.addEventListener('install', e => {


    const cacheStatic = caches.open( STATIC_CACHE ).then(cache => 
        cache.addAll( APP_SHELL ));

    const cacheInmutable = caches.open( INMUTABLE_CACHE ).then(cache => 
        cache.addAll( APP_SHELL_INMUTABLE ));



    e.waitUntil( Promise.all([ cacheStatic, cacheInmutable ])  );

});


self.addEventListener('activate', e => {

    const respuesta = caches.keys().then( keys => {

        keys.forEach( key => {

            if (  key !== STATIC_CACHE && key.includes('static') ) {
                return caches.delete(key);
            }

            if (  key !== DYNAMIC_CACHE && key.includes('dynamic') ) {
                return caches.delete(key);
            }

        });

    });

    e.waitUntil( respuesta );

});





self.addEventListener( 'fetch', e => {

    let respuesta;

    if ( e.request.url.includes('/api') ) {

        // return respuesta????
        respuesta = manejoApiMensajes( DYNAMIC_CACHE, e.request );

    } else {

        respuesta = caches.match( e.request ).then( res => {

            if ( res ) {
                
                actualizaCacheStatico( STATIC_CACHE, e.request, APP_SHELL_INMUTABLE );
                return res;
                
            } else {
    
                return fetch( e.request ).then( newRes => {
    
                    return actualizaCacheDinamico( DYNAMIC_CACHE, e.request, newRes );
    
                });
    
            }
    
        });

    }

    e.respondWith( respuesta );

});


// tareas asíncronas
self.addEventListener('sync', e => {

    console.log('SW: Sync');

    if ( e.tag === 'nuevo-post' ) {

        // postear a BD cuando hay conexión
        const respuesta = postearMensajes();
        
        e.waitUntil( respuesta );
    }

});

// Escuchar PUSH
self.addEventListener('push', e => {

    let data;
    try {
        // Intenta parsear como JSON si viene del servidor
        data = JSON.parse( e.data.text() );
    } catch(err) {
        // Si falla, significa que es texto plano (como el test de DevTools)
        data = {
            titulo: 'Notificación PUSH',
            cuerpo: e.data.text(),
            usuario: 'spiderman' // Parche de test
        };
    }


    const title = data.titulo;
    const options = {
        body: data.cuerpo,
        // icon: 'img/icons/icon-72x72.png',
        icon: `img/avatars/${ data.usuario }.jpg`,
        badge: 'img/favicon.ico',
        image: 'https://vignette.wikia.nocookie.net/marvelcinematicuniverse/images/5/5b/Torre_de_los_Avengers.png/revision/latest?cb=20150626220613&path-prefix=es',
        
        // Patrón de Vibración
        // Ejemplo 1 (Actual): Ritmo de marcha/musical [125,75,125,275,200,275,125... ]

        // vibrate: [125, 75, 125, 275, 200, 275, 125],

        // Ejemplo 2 (SOS): [100, 30, 100, 30, 100, 30, 200, 30, 200, 30, 200, 30, 100, 30, 100, 30, 100]
        // vibrate: [100, 30, 100, 30, 100, 30, 200, 30, 200, 30, 200, 30, 100, 30, 100, 30, 100],
        
        // Ejemplo 3 (Doble pulso rápido): [200, 100, 200]
        vibrate: [100, 50, 100, 50, 100], // Escogiendo un patrón llamativo y corto
        
        // Sonidos Personalizados
        // Ojo: Actualmente, en muchos navegadores modernos (Chrome Desktop) no reproducen el sonido custom o está desaconsejado,
        // pero la propiedad se define enviando la ruta al audio.
        // Ejemplo 1: Sonido corto tipo cristal (ej. 'audio/alerta-mensaje.mp3')

        // sound: 'audio/alerta-suave.mp3',

        // Ejemplo 2: Sonido de alerta fuerte (ej. 'audio/alerta-fuerte.mp3')
        sound: 'audio/alerta.mp3',
        
        openUrl: '/',
        data: {
            // url: 'https://google.com',
            url: '/',
            id: data.usuario
        },
        
        // Botones Personalizados con Acciones
        actions: [
            {
                action: 'responder-action',
                title: 'Responder 💬',
                icon: 'img/avatars/spiderman.jpg'
            },
            {
                action: 'like-action',
                title: 'Dar Me Gusta 👍',
                icon: 'img/avatars/ironman.jpg'
            }
        ],
        // Nuevas propiedades aplicadas
        dir: 'ltr', // Dirección del texto (Left to Right)
        lang: 'es-CO', // Idioma de la notificación
        tag: 'mensaje-nuevo', // Agrupa notificaciones con el mismo tag (las reemplaza)
        renotify: true, // Si es true, vibra/suena de nuevo aunque ya exista una con el mismo tag
        requireInteraction: true, // Obliga al usuario a interactuar con la notificación (no se cierra sola)
        timestamp: Date.now(), // Fecha y hora de creación de la notificación
        // silent: false // Si es true, silencia la notificación (sin sonido/vibración)
    };


    e.waitUntil( self.registration.showNotification( title, options) );

});

// Escuchar cambios en la suscripcion push (ej. cuando expira y el navegador la regenera)
self.addEventListener('pushsubscriptionchange', e => {
    e.waitUntil(
        self.registration.pushManager.subscribe(e.oldSubscription.options)
            .then(newSubscription => {
                return fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSubscription)
                });
            })
    );
});


// Cierra la notificacion
self.addEventListener('notificationclose', e => {
    console.log('Notificación cerrada', e);
});


/* self.addEventListener('notificationclick', e => {


    const notificacion = e.notification;
    const accion = e.action;


    console.log({ notificacion, accion });
    // console.log(notificacion);
    // console.log(accion);
    

    const respuesta = clients.matchAll()
    .then( clientes => {

        let cliente = clientes.find( c => {
            return c.visibilityState === 'visible';
        });

        if ( cliente !== undefined ) {
            cliente.navigate( notificacion.data.url );
            cliente.focus();
        } else {
            clients.openWindow( notificacion.data.url );
        }

        return notificacion.close();

    });

    e.waitUntil( respuesta );


}); */

self.addEventListener('notificationclick', e => {
    const notificacion = e.notification;
    const url = notificacion.data && notificacion.data.url ? notificacion.data.url : '/';

    e.notification.close();

    const respuesta = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(clientes => {

        for (const cliente of clientes) {
            if ('focus' in cliente) {
                if (cliente.url.includes(url) || cliente.visibilityState === 'visible') {
                    return cliente.focus();
                }
            }
        }

        if (clients.openWindow) {
            return clients.openWindow(url);
        }
    });

    e.waitUntil(respuesta);
});