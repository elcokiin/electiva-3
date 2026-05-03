
const fs = require('fs');


const urlsafeBase64 = require('urlsafe-base64');
const vapid = require('./vapid.json');

const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:juan.albornoz@uptc.edu.co',
    vapid.publicKey,
    vapid.privateKey
);




let suscripciones = require('./subs-db.json');


module.exports.getKey = () => {
    return urlsafeBase64.decode(vapid.publicKey);
};



module.exports.addSubscription = (suscripcion, username) => {
    suscripciones.push({
        sus: suscripcion,
        username: username || 'general'
    });

    fs.writeFileSync(`${__dirname}/subs-db.json`, JSON.stringify(suscripciones));
    console.log('Nueva suscripción agregada, usuario:', username);
};


module.exports.sendPush = (post) => {
    console.log('Mandando PUSHES');
    const notificacionesEnviadas = [];

    suscripciones.forEach((suscripcionObj, i) => {

        // Si el post indica un objetivo especifico y no somos nosotros, salta
        if (post.targetUser && post.targetUser !== suscripcionObj.username && post.targetUser !== 'all') {
            return;
        }

        const pushProm = webpush.sendNotification(suscripcionObj.sus, JSON.stringify(post))
            .then(() => console.log('Notificacion enviada '))
            .catch(err => {
                console.log('Notificación falló');
                if (err.statusCode === 410) { // GONE
                    suscripciones[i].borrar = true;
                }
            });

        notificacionesEnviadas.push(pushProm);
    });

    Promise.all(notificacionesEnviadas).then(() => {
        suscripciones = suscripciones.filter(subs => !subs.borrar);
        fs.writeFileSync(`${__dirname}/subs-db.json`, JSON.stringify(suscripciones));
    });
}

