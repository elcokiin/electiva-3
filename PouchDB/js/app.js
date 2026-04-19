// ============================================================
// TALLER POUCHDB - Electiva I/II PWA
// ============================================================
// PouchDB se incluye via CDN en index.html
// La base de datos usará IndexedDB internamente en el navegador

// ============================================================
// 1. CREAR LA BASE DE DATOS
// ============================================================
const db = new PouchDB('heroes');

console.log("✅ Base de datos 'heroes' creada/abierta:", db.name);

// ============================================================
// 2. ASYNC / AWAIT - Función principal que ejecuta todo
// ============================================================
const ejecutarTaller = async () => {

    // ----------------------------------------------------------
    // 3. CREAR CLAVE PRIMARIA MANUAL (_id es la clave en PouchDB)
    // ----------------------------------------------------------
    console.log("\n--- INSERTAR con ID manual (clave primaria) ---");
    try {
        await db.put({
            _id: "heroe_1",
            nombre: "Spider-Man",
            poder: "Trepar paredes",
            nivel: 8
        });
        console.log("✅ Héroe con _id 'heroe_1' insertado.");
    } catch (err) {
        if (err.name === 'conflict') {
            console.warn("⚠️ heroe_1 ya existe, se omite inserción.");
        } else {
            console.error("❌ Error:", err);
        }
    }

    // ----------------------------------------------------------
    // 4. INSERTAR CON ID AUTOGENERADO (usando post)
    // ----------------------------------------------------------
    console.log("\n--- INSERTAR con ID autogenerado (post) ---");
    try {
        const respuesta = await db.post({
            nombre: "Iron Man",
            poder: "Armadura tecnológica",
            nivel: 10
        });
        console.log("✅ Héroe insertado con ID autogenerado:", respuesta.id);
    } catch (err) {
        console.error("❌ Error al insertar:", err);
    }

    // ----------------------------------------------------------
    // 5. INSERTAR MEDIANTE OBJETO JSON con ID manual
    // ----------------------------------------------------------
    console.log("\n--- INSERTAR objeto JSON con ID manual ---");
    const nuevoHeroe = {
        _id: "heroe_2",
        nombre: "Thor",
        poder: "Control del rayo",
        nivel: 9
    };
    try {
        await db.put(nuevoHeroe);
        console.log("✅ Thor insertado correctamente.");
    } catch (err) {
        if (err.name === 'conflict') {
            console.warn("⚠️ heroe_2 ya existe, se omite inserción.");
        } else {
            console.error("❌ Error:", err);
        }
    }

    // ----------------------------------------------------------
    // 6. INSERTAR CON ARCHIVO BLOB (imagen adjunta)
    // ----------------------------------------------------------
    console.log("\n--- INSERTAR con adjunto BLOB (imagen) ---");
    try {
        // Crear un blob de ejemplo (imagen PNG de 1x1 pixel transparente)
        const base64Img = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        const byteChars = atob(base64Img);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteArr[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArr], { type: "image/png" });

        // Primero insertamos el héroe
        try {
            await db.put({ _id: "heroe_3", nombre: "Capitán América", nivel: 7 });
        } catch (e) {
            if (e.name !== 'conflict') { throw e; }
        }

        // Obtenemos el doc para tener el _rev actualizado
        const docBlob = await db.get("heroe_3");

        // Adjuntamos la imagen al documento
        await db.putAttachment("heroe_3", "foto.png", docBlob._rev, blob, "image/png");
        console.log("✅ Imagen BLOB adjuntada a heroe_3 (Capitán América).");
    } catch (err) {
        console.error("❌ Error al adjuntar BLOB:", err);
    }

    // ----------------------------------------------------------
    // 7. EDITAR REGISTRO (put con _rev)
    // ----------------------------------------------------------
    console.log("\n--- EDITAR registro por documento ---");
    try {
        const doc = await db.get("heroe_1");
        doc.nivel = 10;
        doc.poder = "Trepar paredes y sentido arácnido";
        await db.put(doc);
        console.log("✅ heroe_1 actualizado:", doc);
    } catch (err) {
        console.error("❌ Error al editar:", err);
    }

    console.log("\n--- EDITAR registro por objeto JSON ---");
    try {
        const docThor = await db.get("heroe_2");
        const thorActualizado = {
            _id: docThor._id,
            _rev: docThor._rev,
            nombre: docThor.nombre,
            poder: "Control del rayo y volar con Mjolnir",
            nivel: 10
        };
        await db.put(thorActualizado);
        console.log("✅ heroe_2 (Thor) actualizado por objeto JSON.");
    } catch (err) {
        console.error("❌ Error al editar por JSON:", err);
    }

    // ----------------------------------------------------------
    // 8. RETORNAR TODOS LOS REGISTROS
    // ----------------------------------------------------------
    console.log("\n--- RETORNAR TODOS LOS REGISTROS ---");
    try {
        const resultado = await db.allDocs({ include_docs: true });
        console.log(`✅ Total de documentos: ${resultado.rows.length}`);
        resultado.rows.forEach(row => {
            console.log(" →", row.doc._id, "|", row.doc.nombre, "| Nivel:", row.doc.nivel);
        });
    } catch (err) {
        console.error("❌ Error al listar:", err);
    }

    // ----------------------------------------------------------
    // 9. ELIMINAR REGISTRO POR DOCUMENTO
    // ----------------------------------------------------------
    console.log("\n--- ELIMINAR registro por documento ---");
    try {
        const docEliminar = await db.get("heroe_1");
        await db.remove(docEliminar);
        console.log("✅ heroe_1 (Spider-Man) eliminado por documento.");
    } catch (err) {
        if (err.name === 'not_found') {
            console.warn("⚠️ heroe_1 no encontrado para eliminar.");
        } else {
            console.error("❌ Error al eliminar:", err);
        }
    }

    // ELIMINAR POR OBJETO JSON
    console.log("\n--- ELIMINAR registro por objeto JSON ---");
    try {
        const docThorElim = await db.get("heroe_2");
        await db.remove(docThorElim._id, docThorElim._rev);
        console.log("✅ heroe_2 (Thor) eliminado por objeto JSON (_id + _rev).");
    } catch (err) {
        if (err.name === 'not_found') {
            console.warn("⚠️ heroe_2 no encontrado para eliminar.");
        } else {
            console.error("❌ Error al eliminar:", err);
        }
    }

    // ----------------------------------------------------------
    // 10. ESTADO FINAL - TODOS LOS REGISTROS
    // ----------------------------------------------------------
    console.log("\n--- ESTADO FINAL DE LA BASE DE DATOS ---");
    try {
        const final = await db.allDocs({ include_docs: true });
        console.log(`✅ Documentos restantes: ${final.rows.length}`);
        final.rows.forEach(row => {
            console.log(" →", row.doc._id, "|", row.doc.nombre);
        });
    } catch (err) {
        console.error("❌ Error al listar estado final:", err);
    }

    // ----------------------------------------------------------
    // 11. MANEJO DE ERRORES
    // ----------------------------------------------------------
    console.log("\n--- MANEJO DE ERRORES ---");
    try {
        // Intentar obtener un documento que no existe
        await db.get("heroe_inexistente");
    } catch (err) {
        if (err.name === 'not_found') {
            console.warn("⚠️ Error controlado: Documento no encontrado (not_found).");
        } else if (err.name === 'conflict') {
            console.warn("⚠️ Error controlado: Conflicto de revisión (conflict).");
        } else {
            console.error("❌ Error no controlado:", err.name, err.message);
        }
    }


    console.log("\n✅ Taller PouchDB finalizado correctamente.");
};


// Ejecutar el taller
ejecutarTaller();
