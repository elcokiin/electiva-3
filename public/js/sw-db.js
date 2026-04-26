// Utilidades para grabar PouchDB
const db = new PouchDB('mensajes');

function obtenerSiguienteId() {
    return db.get('contador').catch(() => ({ _id: 'contador', valor: 0 }))
        .then(doc => {
            const nuevoId = doc.valor + 1;
            doc.valor = nuevoId;
            return db.put(doc).then(() => nuevoId);
        });
}

function guardarMensaje( mensaje ) {

    return obtenerSiguienteId().then(id => {
        mensaje._id = id.toString();

        return db.put( mensaje ).then( () => {

            self.registration.sync.register('nuevo-post');

            const newResp = { ok: true, offline: true };

            return new Response( JSON.stringify(newResp) );

        }).catch(err => {
            console.error('Error al guardar en PouchDB:', err);
            return new Response( JSON.stringify({ ok: false, error: 'Error al almacenar mensaje' }), {
                status: 500
            });
        });
    }).catch(err => {
        console.error('Error al obtener ID:', err);
        return new Response( JSON.stringify({ ok: false, error: 'Error al generar ID' }), {
            status: 500
        });
    });

}


// Postear mensajes a la API
function postearMensajes() {

    const posteos = [];

    return db.allDocs({ include_docs: true }).then( docs => {


        docs.rows.forEach( row => {

            const doc = row.doc;

            const fetchPom =  fetch('api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify( doc )
                }).then( res => res.json() )
                .then( data => {
                    if (!data.ok) {
                        console.error('Error al subir mensaje:', data.error);
                        throw new Error(data.error || 'Error al subir mensaje');
                    }
                    return db.remove( doc );
                })
                .catch(err => {
                    console.error('Error al sincronizar mensaje:', err);
                    clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'SYNC_ERROR',
                                error: err.message || 'Error al sincronizar mensaje'
                            });
                        });
                    });
                    throw err;
                });
            
            posteos.push( fetchPom );


        }); // fin del foreach

        return Promise.all( posteos );

    });



}

