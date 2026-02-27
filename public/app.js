// Referencias al DOM
const form = document.getElementById('payment-form');
const btnPay = document.getElementById('pay-button');
const spinner = document.getElementById('loading-spinner');
const offlineToggle = document.getElementById('offline-toggle');
const logsContainer = document.getElementById('logs');
const btnClearLogs = document.getElementById('clear-logs');

// Función de utilidad para agregar logs visuales
function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const time = new Date().toLocaleTimeString();
    logEntry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight; // Auto-scroll
}

btnClearLogs.addEventListener('click', () => {
    logsContainer.innerHTML = '';
});

// --- LÓGICA DE PROMESAS ---

/**
 * 1. Simula la verificación de la conexión a internet.
 * Usa Promise.resolve() o Promise.reject() inmediatamente.
 */
function verificarConexion() {
    return new Promise((resolve, reject) => {
        addLog("Iniciando validación: Verificando conexión de red...", "info");
        const isOffline = offlineToggle.checked; // Leemos el estado del toggle
        
        if (isOffline) {
            reject(new Error("Sin conexión a internet. Por favor revisa tu red."));
        } else {
            resolve("Conexión a internet establecida.");
        }
    });
}

/**
 * 2. Simula la validación de los datos de la tarjeta.
 * Usa Promise.resolve() o Promise.reject() basado en el input.
 */
function validarDatosTarjeta(datos) {
    return new Promise((resolve, reject) => {
        addLog("Iniciando validación: Revisando integridad de datos...", "info");
        
        // Simulación: Si la tarjeta empieza con 1111, consideramos los datos como inválidos
        if (datos.tarjeta.startsWith('1111')) {
            reject(new Error("Datos de tarjeta incorrectos o no verificados por la entidad."));
        } else if (datos.tarjeta.length < 16) {
             reject(new Error("Longitud de tarjeta inválida."));
        } else {
            resolve("Datos de tarjeta válidos.");
        }
    });
}

/**
 * 3. Simula una pasarela de pago (Pasarela A) con retraso aleatorio.
 */
function pasarelaPagoA(datos) {
    return new Promise((resolve, reject) => {
        addLog("Enviando solicitud a [Pasarela A]...", "warning");
        const tiempo = Math.random() * 3000 + 1000; // 1 a 4 segundos
        
        setTimeout(() => {
            // Simulamos que la Pasarela A falla a veces (20% de probabilidad)
            if (Math.random() < 0.2) {
                reject(new Error("Pasarela A: Error interno del servidor."));
            } else {
                resolve(`Pago procesado vía [Pasarela A] en ${Math.round(tiempo)}ms. ID Transacción: TXN-${Math.floor(Math.random()*10000)}`);
            }
        }, tiempo);
    });
}

/**
 * 4. Simula otra pasarela de pago (Pasarela B) como respaldo.
 */
function pasarelaPagoB(datos) {
    return new Promise((resolve, reject) => {
        addLog("Enviando solicitud a [Pasarela B]...", "warning");
        const tiempo = Math.random() * 4000 + 500; // 0.5 a 4.5 segundos
        
        setTimeout(() => {
            resolve(`Pago procesado vía [Pasarela B] en ${Math.round(tiempo)}ms. ID Transacción: PAY-${Math.floor(Math.random()*10000)}`);
        }, tiempo);
    });
}

/**
 * 5. Tarea en segundo plano (Promesa auxiliar)
 */
function enviarCorreoConfirmacion(correo) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Correo de confirmación enviado exitosamente.`);
        }, 1500);
    });
}

/**
 * 6. Tarea en segundo plano (Promesa auxiliar que puede fallar)
 */
function registrarAnaliticas() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simular un fallo ocasional en el registro de analíticas
            if (Math.random() > 0.5) resolve("Registro de métricas de compra guardado.");
            else reject(new Error("Error conectando al servidor de analíticas."));
        }, 1000);
    });
}


// --- FLUJO PRINCIPAL DE PAGO ---

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Obtener datos del formulario
    const datosPago = {
        nombre: document.getElementById('nombre').value,
        cedula: document.getElementById('cedula').value,
        tarjeta: document.getElementById('tarjeta').value,
        expiracion: document.getElementById('expiracion').value,
        cvv: document.getElementById('cvv').value
    };

    // UI Updates
    btnPay.disabled = true;
    spinner.classList.remove('hidden');
    addLog("=== NUEVO INTENTO DE PAGO INICIADO ===", "info");

    // PASO 1: Promise.all() - Validar Conexión Y Datos simultáneamente.
    // Si alguna de estas falla, no seguimos adelante.
    Promise.all([
        verificarConexion(),
        validarDatosTarjeta(datosPago)
    ])
    .then((resultadosValidacion) => {
        // resultadosValidacion es un array con las respuestas de ambas promesas
        addLog(`Validaciones exitosas: ${resultadosValidacion.join(' | ')}`, "success");
        addLog("Iniciando procesamiento con pasarelas...", "info");

        // PASO 2: Promise.any() - Intentar con múltiples pasarelas, la primera que responda éxito gana.
        // PASO 3: Promise.race() - Envolver esto con un Timeout para que no espere eternamente.
        
        const procesoPago = Promise.any([
            pasarelaPagoA(datosPago),
            pasarelaPagoB(datosPago)
        ]);

        const timeout = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Timeout: El servidor tardó demasiado en responder (Timeout 5s)."));
            }, 5000); // 5 segundos de límite
        });

        // Hacemos una carrera entre el proceso de pago (que a su vez es un Any de pasarelas) y el Timeout
        return Promise.race([procesoPago, timeout]);
    })
    .then((resultadoPago) => {
        // Escenario A: Compra registrada exitosamente
        addLog(`¡ÉXITO! ${resultadoPago}`, "success");
        alert("¡Pago realizado con éxito!\n" + resultadoPago);
        form.reset();

        // PASO 4: Promise.allSettled() - Tareas post-pago que no deben bloquear la respuesta al usuario.
        addLog("Iniciando tareas en segundo plano (Correo, Analíticas)...", "info");
        return Promise.allSettled([
            enviarCorreoConfirmacion(),
            registrarAnaliticas()
        ]);
    })
    .then((resultadosPostPago) => {
        // Se ejecuta solo si llegamos a allSettled
        if (resultadosPostPago) {
             resultadosPostPago.forEach(resultado => {
                if (resultado.status === 'fulfilled') {
                    addLog(`Tarea Background: ${resultado.value}`, "success");
                } else {
                    addLog(`Tarea Background Falló: ${resultado.reason.message}`, "warning");
                }
            });
            addLog("Proceso de compra finalizado completamente.", "info");
        }
    })
    .catch((error) => {
        // Manejador centralizado de errores
        // Atrapa: Escenario B (Sin conexión), Escenario C (Datos incorrectos), Timeouts o fallos totales de pasarelas.
        addLog(`ERROR EN EL PROCESO: ${error.message}`, "error");
        
        // Manejo específico para mostrar alertas según el tipo de error simulado
        if (error.message.includes("Sin conexión")) {
             alert(`[Error de Red]\nNo se pudo procesar la compra. ${error.message}`);
        } else if (error.message.includes("Datos de tarjeta")) {
             alert(`[Error de Validación]\nNo se pudo procesar la compra. ${error.message}`);
        } else if (error.name === "AggregateError") {
             // Error específico cuando Promise.any() falla en todas sus promesas
             addLog("Todas las pasarelas de pago fallaron.", "error");
             alert(`[Error de Pasarelas]\nTodas las opciones de pago fallaron. Intente de nuevo más tarde.`);
        } else {
             alert(`[Error General]\n${error.message}`);
        }
    })
    .finally(() => {
        // PASO 5: .finally() - Siempre se ejecuta al terminar (éxito o error) para limpiar UI.
        addLog("Limpiando estado de la interfaz...", "info");
        btnPay.disabled = false;
        spinner.classList.add('hidden');
    });

});