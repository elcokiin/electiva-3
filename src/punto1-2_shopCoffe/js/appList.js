// =========================================================
// Tabla de precios base por tamaño
// =========================================================
const preciosPorTamano = {
  "Pequeño":  4000,
  "Mediano":  6000,
  "Grande":   8000
};

// =========================================================
// Promesa: Mostrar modal de confirmación/rechazo
// =========================================================
const mostrarModal = (titulo, mensaje) => {
  return new Promise((resolve, reject) => {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const btnConfirm = document.getElementById('modal-confirm');
    const btnCancel = document.getElementById('modal-cancel');

    modalTitle.textContent = titulo;
    modalMessage.textContent = mensaje;
    overlay.style.display = 'flex';

    const onConfirm = () => {
      overlay.style.display = 'none';
      btnConfirm.removeEventListener('click', onConfirm);
      btnCancel.removeEventListener('click', onCancel);
      resolve("Confirmado por el usuario.");
    };

    const onCancel = () => {
      overlay.style.display = 'none';
      btnConfirm.removeEventListener('click', onConfirm);
      btnCancel.removeEventListener('click', onCancel);
      reject("Operación cancelada por el usuario.");
    };

    btnConfirm.addEventListener('click', onConfirm);
    btnCancel.addEventListener('click', onCancel);
  });
};

// =========================================================
// Promesa: Actualizar el contador de órdenes
// =========================================================
const actualizarContador = () => {
  return new Promise((resolve) => {
    const misOrdenes = JSON.parse(localStorage.getItem('misOrdenesArray')) || [];
    const contadorElemento = document.getElementById('counter-value');
    if (contadorElemento) {
      contadorElemento.textContent = misOrdenes.length;
    }
    resolve(misOrdenes.length);
  });
};

// =========================================================
// Promesa: Obtener las órdenes desde localStorage
// =========================================================
const obtenerOrdenes = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const misOrdenes = JSON.parse(localStorage.getItem('misOrdenesArray')) || [];
      if (Array.isArray(misOrdenes)) {
        resolve(misOrdenes);
      } else {
        reject("Error: No se pudo leer la lista de órdenes.");
      }
    }, 800);
  });
};

// =========================================================
// Calcular precio total de una orden
// =========================================================
const calcularPrecio = (orden) => {
  const precioBase = preciosPorTamano[orden.tamaño] || 0;
  return precioBase;
};

// =========================================================
// Promesa: Renderizar las tarjetas de órdenes
// =========================================================
const renderizarOrdenes = (ordenes) => {
  return new Promise((resolve) => {
    const container = document.getElementById('orders-container');

    if (ordenes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span>☕</span>
          <h2>No hay órdenes aún</h2>
          <p>Ve al menú y haz tu primer pedido!</p>
          <a href="index.html" class="card--link" style="margin-top:1rem; display:inline-block;">Ver menú</a>
        </div>
      `;
      resolve("Sin órdenes para mostrar.");
      return;
    }

    let output = "";
    ordenes.forEach((orden, index) => {
      const azucarBadge = orden.azucar
        ? '<span class="badge">Con azúcar</span>'
        : '<span class="badge" style="background:#aaa;">Sin azúcar</span>';

      const precio = calcularPrecio(orden);

      output += `
        <div class="order-card" data-id="${orden.id}" data-index="${index}">
          <button class="btn-delete" title="Eliminar orden">✕</button>
          <h3>☕ ${orden.cafe}</h3>
          <p><strong>Tamaño:</strong> ${orden.tamaño}</p>
          <p>${azucarBadge}</p>
          <p class="order-price">💰 Total: $${precio.toLocaleString()}</p>
          <p class="order-date">📅 ${orden.fecha}</p>
        </div>
      `;
    });

    container.innerHTML = output;
    resolve("Órdenes renderizadas correctamente.");
  });
};

// =========================================================
// Promesa: Eliminar una orden por índice
// =========================================================
const eliminarOrden = (index) => {
  return new Promise((resolve, reject) => {
    const misOrdenes = JSON.parse(localStorage.getItem('misOrdenesArray')) || [];

    if (index < 0 || index >= misOrdenes.length) {
      reject("Error: Índice de orden inválido.");
      return;
    }

    misOrdenes.splice(index, 1);
    localStorage.setItem('misOrdenesArray', JSON.stringify(misOrdenes));
    console.log("Arreglo actualizado tras eliminar:", misOrdenes);
    resolve(misOrdenes);
  });
};

// =========================================================
// Promesa: Limpiar todas las órdenes
// =========================================================
const limpiarOrdenes = () => {
  return new Promise((resolve) => {
    localStorage.setItem('misOrdenesArray', JSON.stringify([]));
    console.log("Todas las órdenes eliminadas.");
    resolve([]);
  });
};

// =========================================================
// Capturar click en botón eliminar individual
// =========================================================
const capturarEliminarIndividual = () => {
  const container = document.getElementById('orders-container');

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-delete')) {
      const card = e.target.closest('.order-card');
      const index = parseInt(card.getAttribute('data-index'));
      const nombreCafe = card.querySelector('h3').textContent;

      mostrarModal(
        "¿Eliminar orden?",
        `¿Seguro que deseas eliminar la orden de "${nombreCafe.replace('☕ ', '')}"?`
      )
        .then((mensaje) => {
          console.log(`Eliminación confirmada: ${mensaje}`);
          return eliminarOrden(index);
        })
        .then((ordenesActualizadas) => {
          console.log("Orden eliminada. Recargando lista...");
          return renderizarOrdenes(ordenesActualizadas);
        })
        .then(() => {
          return actualizarContador();
        })
        .then(() => {
          console.log("Lista y contador actualizados.");
          capturarEliminarIndividual();
        })
        .catch((motivo) => {
          console.log(`Cancelado o error: ${motivo}`);
        });
    }
  });
};

// =========================================================
// Capturar click en botón "Limpiar todo"
// =========================================================
const capturarLimpiarTodo = () => {
  const btnClear = document.getElementById('btn-clear');

  btnClear.addEventListener('click', () => {
    mostrarModal(
      "¿Limpiar todas las órdenes?",
      "Esta acción eliminará permanentemente todas tus órdenes. ¿Deseas continuar?"
    )
      .then((mensaje) => {
        console.log(`Limpieza confirmada: ${mensaje}`);
        return limpiarOrdenes();
      })
      .then((ordenesVacias) => {
        return renderizarOrdenes(ordenesVacias);
      })
      .then(() => {
        return actualizarContador();
      })
      .then(() => {
        console.log("Todas las órdenes eliminadas y vista actualizada.");
      })
      .catch((motivo) => {
        console.log(`Cancelado: ${motivo}`);
      });
  });
};

// =========================================================
// Encadenamiento de Promesas principal
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('orders-container');
  container.innerHTML = "<h2 style='text-align:center;'>Cargando tus órdenes...</h2>";

  actualizarContador()
    .then((total) => {
      console.log(`1. Contador actualizado. Total de órdenes: ${total}`);
      return obtenerOrdenes();
    })
    .then((ordenes) => {
      console.log(`2. Órdenes obtenidas: ${ordenes.length}`);
      return renderizarOrdenes(ordenes);
    })
    .then((mensaje) => {
      console.log(`3. ${mensaje}`);
      console.log("-> Vista de órdenes lista.");
      capturarEliminarIndividual();
      capturarLimpiarTodo();
    })
    .catch((error) => {
      console.error("Error en el flujo de órdenes:", error);
      const container = document.getElementById('orders-container');
      container.innerHTML = "<h2>Lo sentimos, ocurrió un error al cargar las órdenes.</h2>";
    });
});