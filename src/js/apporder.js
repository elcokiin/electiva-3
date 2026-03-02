// =========================================================
// Arreglo donde vivirá la información de las órdenes
// =========================================================
const misOrdenes = [];

// Obtenemos el nombre del café de la URL
const urlParams = new URLSearchParams(window.location.search);
const coffeeName = urlParams.get("coffee") || "Café Especial";

// =========================================================
// Referencias a elementos del DOM
// =========================================================
const ordersList = document.getElementById("orders-list");
const ordersStatus = document.getElementById("orders-status");
const ordersConfirm = document.getElementById("orders-confirm");
const ordersReject = document.getElementById("orders-reject");
const editForm = document.getElementById("edit-form");
const editOrderSelect = document.getElementById("edit-order");
const editSizeSelect = document.getElementById("edit-size");
const editSugarCheckbox = document.getElementById("edit-sugar");
const editStatus = document.getElementById("edit-status");
const editConfirm = document.getElementById("edit-confirm");
const editReject = document.getElementById("edit-reject");
const paymentForm = document.getElementById("payment-form");
const paymentOrderSelect = document.getElementById("payment-order");
const paymentStatus = document.getElementById("payment-status");
const paymentConfirm = document.getElementById("payment-confirm");
const paymentReject = document.getElementById("payment-reject");
const cashFields = document.getElementById("cash-fields");
const cardFields = document.getElementById("card-fields");
const paymentMethodInputs = document.querySelectorAll(
  'input[name="payment-method"]',
);

// =========================================================
// Función auxiliar para actualizar estado visual
// =========================================================
const actualizarEstado = (elemento, mensaje, estado) => {
  if (!elemento) return;
  elemento.textContent = mensaje;
  elemento.classList.remove("status--approved", "status--rejected");
  if (estado === "approved") elemento.classList.add("status--approved");
  if (estado === "rejected") elemento.classList.add("status--rejected");
};

// =========================================================
// Promesa 1: Guardar una nueva orden en localStorage
// =========================================================
const guardarEnArray = (nuevaOrden) => {
  return new Promise((resolve, reject) => {
    try {
      let misOrdenes =
        JSON.parse(localStorage.getItem("misOrdenesArray")) || [];
      misOrdenes.push(nuevaOrden);
      localStorage.setItem("misOrdenesArray", JSON.stringify(misOrdenes));
      console.log("Arreglo actualizado:", misOrdenes);
      resolve("Orden guardada exitosamente.");
    } catch (error) {
      reject("Error al guardar la orden: " + error.message);
    }
  });
};

// =========================================================
// Promesa 2: Obtener las órdenes desde localStorage
// Simula un retraso de red y rechaza si no hay órdenes
// =========================================================
const obtenerOrdenes = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const ordenes =
          JSON.parse(localStorage.getItem("misOrdenesArray")) || [];
        if (ordenes.length > 0) {
          resolve(ordenes);
        } else {
          reject("No hay ordenes registradas actualmente.");
        }
      } catch (error) {
        reject("Error al obtener las ordenes: " + error.message);
      }
    }, 500);
  });
};

// =========================================================
// Promesa 3: Renderizar las órdenes en el DOM
// =========================================================
const renderizarOrdenes = (ordenes) => {
  return new Promise((resolve, reject) => {
    if (!ordersList) {
      reject("Error: No se encontro el contenedor de ordenes en el DOM.");
      return;
    }
    if (!ordenes || ordenes.length === 0) {
      ordersList.innerHTML = "<p>No hay ordenes registradas.</p>";
      reject("No hay ordenes para renderizar.");
      return;
    }
    ordersList.innerHTML = ordenes
      .map((orden) => {
        const azucarTexto = orden.azucar ? "Con azucar" : "Sin azucar";
        return `
            <div class="order-card">
                <h3>${orden.cafe}</h3>
                <p>Tamano: ${orden.tamaño} | ${azucarTexto}</p>
                <p>Fecha: ${orden.fecha}</p>
            </div>
        `;
      })
      .join("");
    resolve("Ordenes renderizadas correctamente. Total: " + ordenes.length);
  });
};

// =========================================================
// Promesa 4: Poblar los selects de órdenes
// =========================================================
const poblarSelectOrdenes = (ordenes) => {
  return new Promise((resolve, reject) => {
    if (!ordenes || ordenes.length === 0) {
      reject("No hay ordenes para poblar los selectores.");
      return;
    }
    const opcionesHTML = ordenes
      .map(
        (orden) =>
          `<option value="${orden.id}">${orden.cafe} - ${orden.tamaño}</option>`,
      )
      .join("");

    if (editOrderSelect) editOrderSelect.innerHTML = opcionesHTML;
    if (paymentOrderSelect) paymentOrderSelect.innerHTML = opcionesHTML;
    resolve("Selectores de ordenes poblados correctamente.");
  });
};

// =========================================================
// Promesa 5: Actualizar la orden seleccionada en el form de edición
// =========================================================
const actualizarOrdenSeleccionada = (ordenes) => {
  return new Promise((resolve, reject) => {
    if (!editOrderSelect) {
      reject("Error: No se encontro el selector de ordenes para editar.");
      return;
    }
    const orden = ordenes.find(
      (item) => item.id === Number(editOrderSelect.value),
    );
    if (!orden) {
      reject("No se encontro la orden seleccionada.");
      return;
    }
    if (editSizeSelect) editSizeSelect.value = orden.tamaño;
    if (editSugarCheckbox) editSugarCheckbox.checked = Boolean(orden.azucar);
    resolve("Formulario de edicion actualizado con la orden seleccionada.");
  });
};

// =========================================================
// Promesa 6: Configurar la visibilidad del método de pago
// =========================================================
const configurarMetodoPago = () => {
  return new Promise((resolve, reject) => {
    if (!paymentMethodInputs.length) {
      reject("Error: No se encontraron los inputs de metodo de pago.");
      return;
    }
    const seleccionado = document.querySelector(
      'input[name="payment-method"]:checked',
    );
    const metodo = seleccionado ? seleccionado.value : "cash";
    if (cashFields)
      cashFields.style.display = metodo === "cash" ? "block" : "none";
    if (cardFields) cardFields.classList.toggle("is-visible", metodo === "card");
    resolve("Metodo de pago configurado: " + metodo);
  });
};

// =========================================================
// Promesa 7: Modificar una orden existente
// Valida que la orden exista y aplica los cambios
// =========================================================
const modificarOrden = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const ordenes =
          JSON.parse(localStorage.getItem("misOrdenesArray")) || [];

        if (ordenes.length === 0) {
          reject("No hay ordenes disponibles para modificar.");
          return;
        }

        const ordenId = Number(editOrderSelect.value);
        const ordenIndex = ordenes.findIndex((item) => item.id === ordenId);

        if (ordenIndex === -1) {
          reject("Error: La orden seleccionada no fue encontrada.");
          return;
        }

        // Aplicamos las modificaciones
        const nuevoTamaño = editSizeSelect.value;
        const nuevaAzucar = editSugarCheckbox.checked;

        ordenes[ordenIndex].tamaño = nuevoTamaño;
        ordenes[ordenIndex].azucar = nuevaAzucar;

        localStorage.setItem("misOrdenesArray", JSON.stringify(ordenes));

        resolve({
          mensaje: `Orden de "${ordenes[ordenIndex].cafe}" modificada exitosamente. Nuevo tamaño: ${nuevoTamaño}, Azucar: ${nuevaAzucar ? "Si" : "No"}.`,
          ordenes: ordenes,
        });
      } catch (error) {
        reject("Error al modificar la orden: " + error.message);
      }
    }, 500);
  });
};

// =========================================================
// Promesa 8: Validar y procesar el pago en efectivo
// =========================================================
const procesarPagoEfectivo = (ordenId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const ordenes =
        JSON.parse(localStorage.getItem("misOrdenesArray")) || [];
      const orden = ordenes.find((item) => item.id === Number(ordenId));

      if (!orden) {
        reject("Error: No se encontro la orden para procesar el pago.");
        return;
      }

      const cashAmountInput = document.getElementById("cash-amount");
      const montoRecibido = parseFloat(cashAmountInput.value);

      // Determinamos el precio según el tamaño
      const precios = { Pequeño: 4000, Mediano: 6000, Grande: 8000 };
      const precioOrden = precios[orden.tamaño] || 6000;

      if (isNaN(montoRecibido) || montoRecibido <= 0) {
        reject("Pago rechazado: Debe ingresar un monto valido.");
        return;
      }

      if (montoRecibido < precioOrden) {
        reject(
          `Pago rechazado: Monto insuficiente. El precio es $${precioOrden} COP y recibio $${montoRecibido} COP.`,
        );
        return;
      }

      const cambio = montoRecibido - precioOrden;

      // Eliminar la orden pagada del localStorage
      const ordenesActualizadas = ordenes.filter((item) => item.id !== Number(ordenId));
      localStorage.setItem("misOrdenesArray", JSON.stringify(ordenesActualizadas));

      resolve(
        `Pago en efectivo confirmado. Precio: $${precioOrden} COP. Recibido: $${montoRecibido} COP. Cambio: $${cambio} COP. Entrega aprobada.`,
      );
    }, 800);
  });
};

// =========================================================
// Promesa 9: Validar y procesar el pago con tarjeta
// =========================================================
const procesarPagoTarjeta = (ordenId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const ordenes =
        JSON.parse(localStorage.getItem("misOrdenesArray")) || [];
      const orden = ordenes.find((item) => item.id === Number(ordenId));

      if (!orden) {
        reject("Error: No se encontro la orden para procesar el pago.");
        return;
      }

      const cardName = document.getElementById("card-name").value.trim();
      const cardNumber = document.getElementById("card-number").value.trim();
      const cardExp = document.getElementById("card-exp").value.trim();
      const cardCvv = document.getElementById("card-cvv").value.trim();

      // Validaciones de tarjeta
      if (!cardName) {
        reject("Pago rechazado: Debe ingresar el nombre del titular.");
        return;
      }

      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
        reject(
          "Pago rechazado: Numero de tarjeta invalido. Debe tener al menos 13 digitos.",
        );
        return;
      }

      if (!cardExp || !/^\d{2}\/\d{2}$/.test(cardExp)) {
        reject(
          "Pago rechazado: Fecha de vencimiento invalida. Use el formato MM/AA.",
        );
        return;
      }

      if (!cardCvv || cardCvv.length < 3) {
        reject("Pago rechazado: CVV invalido. Debe tener al menos 3 digitos.");
        return;
      }

      const precios = { Pequeño: 4000, Mediano: 6000, Grande: 8000 };
      const precioOrden = precios[orden.tamaño] || 6000;

      // Eliminar la orden pagada del localStorage
      const ordenesActualizadas = ordenes.filter((item) => item.id !== Number(ordenId));
      localStorage.setItem("misOrdenesArray", JSON.stringify(ordenesActualizadas));

      resolve(
        `Pago con tarjeta confirmado. Titular: ${cardName}. Monto cobrado: $${precioOrden} COP. Tarjeta terminada en ...${cardNumber.slice(-4)}. Entrega aprobada.`,
      );
    }, 1000);
  });
};

// =========================================================
// Promesa 10: Capturar confirmación o rechazo del listado de órdenes
// Devuelve una promesa que se resuelve con "confirmar"
// o se rechaza con "rechazar" según el botón presionado
// Se limpia el listener contrario para evitar fugas de memoria
// =========================================================
const capturarConfirmacionOrdenes = () => {
  return new Promise((resolve, reject) => {
    if (!ordersConfirm || !ordersReject) {
      reject("Error: Botones de confirmacion de ordenes no encontrados.");
      return;
    }
    function onConfirm() {
      ordersConfirm.removeEventListener("click", onConfirm);
      ordersReject.removeEventListener("click", onReject);
      resolve("Operacion confirmada. Ordenes visibles.");
    }
    function onReject() {
      ordersConfirm.removeEventListener("click", onConfirm);
      ordersReject.removeEventListener("click", onReject);
      reject("Operacion rechazada. Ordenes no disponibles.");
    }
    ordersConfirm.addEventListener("click", onConfirm);
    ordersReject.addEventListener("click", onReject);
  });
};

// =========================================================
// Promesa 11: Capturar confirmación o rechazo de la edición
// Se limpia el listener contrario para evitar fugas de memoria
// =========================================================
const capturarConfirmacionEdicion = () => {
  return new Promise((resolve, reject) => {
    if (!editConfirm || !editReject) {
      reject("Error: Botones de confirmacion de edicion no encontrados.");
      return;
    }
    function onConfirm() {
      editConfirm.removeEventListener("click", onConfirm);
      editReject.removeEventListener("click", onReject);
      resolve("confirmar");
    }
    function onReject() {
      editConfirm.removeEventListener("click", onConfirm);
      editReject.removeEventListener("click", onReject);
      reject("Modificacion rechazada por el usuario.");
    }
    editConfirm.addEventListener("click", onConfirm);
    editReject.addEventListener("click", onReject);
  });
};

// =========================================================
// Promesa 12: Capturar confirmación o rechazo del pago
// Se limpia el listener contrario para evitar fugas de memoria
// =========================================================
const capturarConfirmacionPago = () => {
  return new Promise((resolve, reject) => {
    if (!paymentConfirm || !paymentReject) {
      reject("Error: Botones de confirmacion de pago no encontrados.");
      return;
    }
    function onConfirm() {
      paymentConfirm.removeEventListener("click", onConfirm);
      paymentReject.removeEventListener("click", onReject);
      resolve("confirmar");
    }
    function onReject() {
      paymentConfirm.removeEventListener("click", onConfirm);
      paymentReject.removeEventListener("click", onReject);
      reject("Pago rechazado por el usuario.");
    }
    paymentConfirm.addEventListener("click", onConfirm);
    paymentReject.addEventListener("click", onReject);
  });
};

// =========================================================
// Capturar el envío del formulario de la orden (Promesa)
// =========================================================
const orderForm = document.getElementById("order-form");

if (orderForm) {
  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const size = document.getElementById("size").value;
    const hasSugar = document.getElementById("sugar").checked;

    const nuevaOrden = {
      id: Date.now(),
      cafe: coffeeName,
      tamaño: size,
      azucar: hasSugar,
      fecha: new Date().toLocaleString(),
    };

    const resultDiv = document.getElementById("order-result");
    const btnSubmit = document.querySelector(".btn-submit");

    resultDiv.textContent = "Procesando tu orden...";
    resultDiv.className = "success";
    resultDiv.style.display = "block";
    btnSubmit.disabled = true;

    // Encadenamiento de promesas para guardar y luego refrescar vistas
    guardarEnArray(nuevaOrden)
      .then((mensaje) => {
        console.log("1. " + mensaje);
        resultDiv.textContent = `¡Listo! ${mensaje}`;
        // Después de guardar, obtenemos las órdenes actualizadas
        return obtenerOrdenes();
      })
      .then((ordenes) => {
        console.log("2. Ordenes obtenidas para refrescar la vista.");
        return renderizarOrdenes(ordenes).then(() => ordenes);
      })
      .then((ordenes) => {
        console.log("3. Vista de ordenes actualizada.");
        return poblarSelectOrdenes(ordenes);
      })
      .then((mensajeSelect) => {
        console.log("4. " + mensajeSelect);
        setTimeout(() => {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Hacer otro pedido igual";
        }, 1000);
      })
      .catch((error) => {
        console.error("Error en el flujo de orden:", error);
        resultDiv.textContent = "Error: " + error;
        resultDiv.className = "error";
        btnSubmit.disabled = false;
      });
  });
}

// =========================================================
// Configurar cambio dinámico de método de pago (con Promesa)
// =========================================================
if (paymentMethodInputs.length) {
  paymentMethodInputs.forEach((input) => {
    input.addEventListener("change", () => {
      configurarMetodoPago()
        .then((msg) => console.log(msg))
        .catch((err) => console.error(err));
    });
  });
}

// =========================================================
// Cambio de orden seleccionada en edición (con Promesa)
// =========================================================
if (editOrderSelect) {
  editOrderSelect.addEventListener("change", () => {
    obtenerOrdenes()
      .then((ordenes) => actualizarOrdenSeleccionada(ordenes))
      .then((msg) => console.log(msg))
      .catch((err) => console.error(err));
  });
}

// =========================================================
// Inicialización principal con encadenamiento de Promesas
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("=== Inicializando PWA Coffee Shop - Ordenes ===");

  // -------------------------------------------------------
  // Cadena de Promesas Punto 2: Ver lista de órdenes
  // Obtener -> Renderizar -> Poblar selects -> Esperar confirmación
  // -------------------------------------------------------
  obtenerOrdenes()
    .then((ordenes) => {
      console.log("1. Ordenes obtenidas:", ordenes.length);
      return renderizarOrdenes(ordenes).then(() => ordenes);
    })
    .then((ordenes) => {
      console.log("2. Ordenes renderizadas en la vista.");
      return poblarSelectOrdenes(ordenes).then(() => ordenes);
    })
    .then((ordenes) => {
      console.log("3. Selectores poblados correctamente.");
      return actualizarOrdenSeleccionada(ordenes);
    })
    .then((msg) => {
      console.log("4. " + msg);
      return configurarMetodoPago();
    })
    .then((msg) => {
      console.log("5. " + msg);
      console.log(
        "=== Vista inicializada. Esperando interaccion del usuario ===",
      );
    })
    .catch((error) => {
      console.warn("Inicializacion parcial:", error);
      if (ordersList)
        ordersList.innerHTML = "<p>No hay ordenes registradas.</p>";
    });

  // -------------------------------------------------------
  // Cadena de Promesas Punto 2: Confirmación/Rechazo de órdenes
  // Se re-registra después de cada operación para permitir múltiples usos
  // -------------------------------------------------------
  const iniciarConfirmacionOrdenes = () => {
    capturarConfirmacionOrdenes()
      .then((mensaje) => {
        console.log("Ordenes - " + mensaje);
        actualizarEstado(ordersStatus, mensaje, "approved");
        // Re-registrar para permitir otro click
        iniciarConfirmacionOrdenes();
      })
      .catch((error) => {
        console.log("Ordenes - " + error);
        actualizarEstado(ordersStatus, error, "rejected");
        // Re-registrar para permitir otro click
        iniciarConfirmacionOrdenes();
      });
  };
  iniciarConfirmacionOrdenes();

  // -------------------------------------------------------
  // Cadena de Promesas Punto 3: Modificar orden
  // Esperar click confirmar -> Ejecutar modificación -> Refrescar vista
  // Se re-registra después de cada operación para permitir múltiples ediciones
  // -------------------------------------------------------
  const iniciarConfirmacionEdicion = () => {
    capturarConfirmacionEdicion()
      .then(() => {
        console.log("Edicion confirmada. Procesando modificacion...");
        actualizarEstado(editStatus, "Procesando modificacion...", "approved");
        return modificarOrden();
      })
      .then((resultado) => {
        console.log("Modificacion exitosa:", resultado.mensaje);
        actualizarEstado(editStatus, resultado.mensaje, "approved");
        // Refrescar la vista con promesas encadenadas
        return renderizarOrdenes(resultado.ordenes).then(
          () => resultado.ordenes,
        );
      })
      .then((ordenes) => {
        return poblarSelectOrdenes(ordenes);
      })
      .then((msg) => {
        console.log("Vista actualizada despues de la modificacion.");
        // Re-registrar para permitir otra edición
        iniciarConfirmacionEdicion();
      })
      .catch((error) => {
        console.log("Edicion - " + error);
        actualizarEstado(editStatus, error, "rejected");
        // Re-registrar para permitir otro intento
        iniciarConfirmacionEdicion();
      });
  };
  iniciarConfirmacionEdicion();

  // -------------------------------------------------------
  // Cadena de Promesas Punto 4: Simular pago
  // Esperar click confirmar -> Determinar método -> Procesar pago -> Mostrar resultado
  // Se re-registra después de cada operación para permitir múltiples pagos
  // -------------------------------------------------------
  const iniciarConfirmacionPago = () => {
    capturarConfirmacionPago()
      .then(() => {
        console.log("Pago confirmado. Procesando...");
        actualizarEstado(paymentStatus, "Procesando pago...", "approved");

        const metodoSeleccionado = document.querySelector(
          'input[name="payment-method"]:checked',
        );
        const metodo = metodoSeleccionado ? metodoSeleccionado.value : "cash";
        const ordenId = paymentOrderSelect.value;

        // Seleccionamos la promesa de pago según el método
        if (metodo === "cash") {
          return procesarPagoEfectivo(ordenId);
        } else {
          return procesarPagoTarjeta(ordenId);
        }
      })
      .then((mensajePago) => {
        console.log("Pago exitoso:", mensajePago);
        actualizarEstado(paymentStatus, mensajePago, "approved");
        // Refrescar la vista de órdenes después del pago exitoso
        return obtenerOrdenes()
          .then((ordenes) => {
            return renderizarOrdenes(ordenes).then(() => ordenes);
          })
          .then((ordenes) => {
            return poblarSelectOrdenes(ordenes);
          })
          .catch(() => {
            // Si no quedan órdenes, limpiar la vista
            if (ordersList) ordersList.innerHTML = "<p>No hay ordenes registradas.</p>";
            if (editOrderSelect) editOrderSelect.innerHTML = "";
            if (paymentOrderSelect) paymentOrderSelect.innerHTML = "";
          });
      })
      .then(() => {
        // Re-registrar para permitir otro pago
        iniciarConfirmacionPago();
      })
      .catch((error) => {
        console.log("Pago - " + error);
        actualizarEstado(paymentStatus, error, "rejected");
        // Re-registrar para permitir otro intento
        iniciarConfirmacionPago();
      });
  };
  iniciarConfirmacionPago();
});
