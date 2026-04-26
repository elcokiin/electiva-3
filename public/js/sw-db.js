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
                }).then( res => {

                    return db.remove( doc );

                });
            
            posteos.push( fetchPom );


        }); // fin del foreach

        return Promise.all( posteos );

    });





}

