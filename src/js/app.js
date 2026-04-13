let req = indexedDB.open("HeroDB", 1);

req.onupgradeneeded = event => {
    let db = event.target.result;
    if (!db.objectStoreNames.contains("heroes")) {
        db.createObjectStore("heroes", { 
            keyPath: "id"
         });
    }
};

req.onsuccess = event => {
    let db = event.target.result;

    // 1. Iniciamos la transacción en modo 'readwrite'
    let transaction = db.transaction("heroes", "readwrite");

    transaction.oncomplete = event => {
        console.log("Transacción de eliminación terminada.");
    };

    transaction.onerror = event => {
        console.error("Error en la transacción", event);
    };

    // 2. Accedemos al almacén de objetos
    let heroesStore = transaction.objectStore("heroes");

    // 3. Ejecutamos la eliminación del registro con ID: 1
    // Nota: El parámetro es el valor de la 'keyPath' (llave primaria)
    let request = heroesStore.delete(2);

    request.onsuccess = event => {
        console.log("Registro con ID 1 eliminado correctamente.");
    };

    request.onerror = event => {
        console.error("No se pudo eliminar el registro", event);
    };
};

req.onerror = e => {
    console.error("Error en la transaccion: ", e);
}
