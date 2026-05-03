var url = window.location.href;
var swLocation = '/sw.js';

var swReg;
window.enviarNotificacion = enviarNotificacion;

if ( navigator.serviceWorker ) {

    if ( url.includes('localhost') ) {
        swLocation = '/sw.js';
    }

    window.addEventListener('load', function() {

        navigator.serviceWorker.register( swLocation ).then( function(reg){

            swReg = reg;
            swReg.pushManager.getSubscription().then( verificaSuscripcion );

        });

    });

}

// Referencias de jQuery
var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');
var loginContainer = $('#login-container');
var btnEntrar = $('#login-btn');
var loginUser = $('#login-username');
var loginPass = $('#login-password');
var loginError = $('#login-error');
var loginFail = $('#login-fail');

var modal       = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns  = $('.seleccion-avatar');
var txtMensaje  = $('#txtMensaje');

var btnActivadas    = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');

// El usuario, contiene el ID del héroe seleccionado
var usuario;

// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje) {

    var content =`
    <li class="animated fadeIn fast">
        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
            </div>
            
            <div class="arrow"></div>
        </div>
    </li>
    `;

    timeline.prepend(content);
    cancelarBtn.click();

}



// Globals

function showCharacterSelection() {
    loginContainer.addClass('oculto');
    nuevoBtn.addClass('oculto');
    salirBtn.removeClass('oculto');
    timeline.addClass('oculto');
    
    avatarSel.removeClass('oculto');
    avatarSel.addClass('animated fadeIn fast');

    titulo.text('Seleccione Personaje');
}

function showTimeline() {
    loginContainer.addClass('oculto');
    avatarSel.addClass('oculto');

    nuevoBtn.removeClass('oculto');
    salirBtn.removeClass('oculto');
    timeline.removeClass('oculto');
    
    titulo.text('@' + usuario);
    modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
}

function logOut() {
    nuevoBtn.addClass('oculto');
    salirBtn.addClass('oculto');
    timeline.addClass('oculto');
    avatarSel.addClass('oculto');
    
    loginContainer.removeClass('oculto');
    loginContainer.addClass('animated fadeIn fast');
    
    loginUser.val('');
    loginPass.val('');
    loginError.hide();
    loginFail.hide();

    titulo.text('Autenticación');
}

// Base de datos de IndexedDB a través de PouchDB
// 'usuarios_db' guardará los registros de forma persistente: id, password, y el personaje favorito.
var usersDB = new PouchDB('usuarios_db');
// 'login_state' guardará quién está activo ahora mismo en el navegador.
var loginDB = new PouchDB('login_state');

// Buscar si el usuario ya inicio sesion antes
loginDB.get('current_user').then(function (doc) {
    if (doc.user && doc.auth) {
        usuario = doc.character; // El superhéroe que eligió
        showTimeline();
    } else {
        logOut();
    }
}).catch(function (err) {
    console.log('No hay usuario auto-logueado');
    logOut();
});

// Login de la aplicacion
btnEntrar.on('click', function() {
    var username = loginUser.val().toLowerCase();
    var password = loginPass.val();

    if (username.trim() === '' || password.trim() === '') {
        loginError.show();
        loginFail.hide();
        return;
    }
    
    loginError.hide();
    loginFail.hide();

    // Comprobamos si el usuario ya existe en nuestra base de datos de usuarios
    usersDB.get(username).then(function(userDoc) {
        // Usuario existe: validamos contraseña
        if (userDoc.password === password) {
            // Contraseña correcta -> iniciar sesión
            guardarLoginActivo(username, userDoc.character);
        } else {
            // Contraseña incorrecta
            loginFail.show();
        }
    }).catch(function(err) {
        if (err.name === 'not_found') {
            // El usuario no existe: lo registramos automáticamente
            usersDB.put({
                _id: username,
                password: password, // En un entorno real esto se haría con un hash, pero esto es local
                character: null // Aun no ha elegido superhéroe
            }).then(function() {
                // Y procedemos a iniciar su sesión
                guardarLoginActivo(username, null);
            }).catch(console.log);
        }
    });
});

function guardarLoginActivo(username, character) {
    // Guardar inicio de sesion activo
    loginDB.get('current_user').then(function(doc) {
        return loginDB.put({
            _id: 'current_user',
            _rev: doc._rev,
            auth: true,
            user: username,
            character: character
        });
    }).catch(function(err) {
        if (err.name === 'not_found') {
            return loginDB.put({
                _id: 'current_user',
                auth: true,
                user: username,
                character: character
            });
        }
    }).then(function() {
        if (character) {
            // Ya tiene personaje, ir al timeline
            usuario = character;
            showTimeline();
        } else {
            // No tiene personaje, pedir que lo elija la primera vez
            showCharacterSelection();
        }
    });
}

// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    // Recuperamos la sesión local para saber QUIEN es
    loginDB.get('current_user').then(function(sessionDoc) {
        
        // Actualizamos primero la BDD de usuarios
        usersDB.get(sessionDoc.user).then(function(userDoc) {
            return usersDB.put({
                _id: userDoc._id,
                _rev: userDoc._rev,
                password: userDoc.password,
                character: usuario
            });
        }).then(function() {
            // Ahora actualizamos la sesión local para recordar el personaje
            return loginDB.put({
                _id: 'current_user',
                _rev: sessionDoc._rev,
                auth: true,
                user: sessionDoc.user,
                character: usuario
            });
        }).then(function() {
            showTimeline();
        });

    });

});

// Boton de salir
salirBtn.on('click', function() {
    
    // Borrar la sesión
    loginDB.get('current_user').then(function(doc) {
        return loginDB.remove(doc);
    }).catch(function(err) {
        console.log(err);
    });

    logOut();

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );

});


// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             txtMensaje.val('');
         });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if ( mensaje.length === 0 ) {
        cancelarBtn.click();
        return;
    }

    var data = {
        mensaje: mensaje,
        user: usuario
    };


    fetch('api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
    })
    .then( res => res.json() )
    .then( res => console.log( 'app.js', res ))
    .catch( err => console.log( 'app.js error:', err ));



    crearMensajeHTML( mensaje, usuario );

});



// Obtener mensajes del servidor
function getMensajes() {

    fetch('api')
        .then( res => res.json() )
        .then( posts => {

            console.log(posts);
            posts.forEach( post =>
                crearMensajeHTML( post.mensaje, post.user ));


        });


}

getMensajes();



// Detectar cambios de conexión
function isOnline() {

    if ( navigator.onLine ) {
        // tenemos conexión
        // console.log('online');
        $.mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });


    } else{
        // No tenemos conexión
        $.mdtoast('Offline', {
            interaction: true,
            actionText: 'OK',
            type: 'warning'
        });
    }

}

window.addEventListener('online', isOnline );
window.addEventListener('offline', isOnline );

isOnline();


// Notificaciones
function verificaSuscripcion( activadas ) {

    if ( activadas ) {
        
        btnActivadas.removeClass('oculto');
        btnDesactivadas.addClass('oculto');

    } else {
        btnActivadas.addClass('oculto');
        btnDesactivadas.removeClass('oculto');
    }

}



async function enviarNotificacion() {

    if (!swReg) {
        console.log('No hay registro de Service Worker');
        return;
    }
     if (!('Notification' in window)) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    if (Notification.permission !== 'granted') {
        console.log('No hay permiso para mostrar notificaciones');
        return;
    }
    try {
        console.log('Mostrando notificación de prueba...');
        await swReg.showNotification('Notificación de prueba', {
            body: 'Las notificaciones funcionan correctamente en Chrome',
            icon: 'img/icons/icon-192x192.png',
            badge: 'img/favicon.ico',
            data: {
                url: '/index.html'
            },
            requireInteraction: true
        });
    } catch (err) {
        console.log('Error mostrando notificación de prueba:', err);
    }

}

async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('El permiso para las notificaciones se ha concedido!');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('El usuario bloqueó las notificaciones');
    return false;
  }

  const permiso = await Notification.requestPermission();
  updatePermissionIndicator();
  return permiso === 'granted';
}



// Get Key
function getPublicKey() {

    // fetch('api/key')
    //     .then( res => res.text())
    //     .then( console.log );

    return fetch('api/key')
        .then( res => res.arrayBuffer())
        // returnar arreglo, pero como un Uint8array
        .then( key => new Uint8Array(key) );


}

// getPublicKey().then( console.log );
/* btnDesactivadas.on( 'click', function() {

    if ( !swReg ) return console.log('No hay registro de SW');

    getPublicKey().then( function( key ) {

        swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        })
        .then( res => res.toJSON() )
        .then( suscripcion => {

            // console.log(suscripcion);
            fetch('api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( suscripcion )
            })
            .then( verificaSuscripcion )
            .catch( cancelarSuscripcion );


        });


    });


});
 */

btnDesactivadas.on('click', async function() {

    try {
        if (!swReg) return;

        const permitido = await solicitarPermisoNotificaciones();
        if (!permitido) return;

        const key = await getPublicKey();

        const subscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        });

        // Obtener usuario actual del IndexedDB para identificar de quien es el telefono/navegador
        loginDB.get('current_user').then(function(doc) {
            fetch('api/subscribe', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Username': doc.user // Identifica el payload Push en el servidor
                },
                body: JSON.stringify(subscription)
            }).then(() => verificaSuscripcion(subscription));
        }).catch(function(err) {
            // Por si no esta logueado pero activa push
            fetch('api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            }).then(() => verificaSuscripcion(subscription));
        });

    } catch (err) {
        console.error('Error al activar notificaciones push:', err);
    }
});


function cancelarSuscripcion() {

    swReg.pushManager.getSubscription().then( subs => {

        subs.unsubscribe().then( () =>  verificaSuscripcion(false) );

    });


}

btnActivadas.on( 'click', function() {

    cancelarSuscripcion();


});


// --- Lógica del Indicador de Permisos ---
var permissionStatusSpan = $('#permission-status');

function updatePermissionIndicator() {
    if (!('Notification' in window)) {
        permissionStatusSpan.text('Not Supported');
        return;
    }
    
    var status = Notification.permission;
    // Capitalizar la primera letra
    status = status.charAt(0).toUpperCase() + status.slice(1);
    permissionStatusSpan.text(status);
    
    // Cambiar color según estado
    if (status === 'Granted') {
        permissionStatusSpan.css('color', 'green');
    } else if (status === 'Denied') {
        permissionStatusSpan.css('color', 'red');
    } else {
        permissionStatusSpan.css('color', 'orange');
    }
}

// Inicializar estado al cargar
updatePermissionIndicator();

// Intentar escuchar cambios automáticamente si la API lo permite
if ('permissions' in navigator) {
    navigator.permissions.query({ name: 'notifications' }).then(function(permissionStatus) {
        permissionStatus.onchange = function() {
            updatePermissionIndicator();
        };
    });
}
