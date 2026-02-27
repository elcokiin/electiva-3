// =========================================================
// Datos del menú (mismos que app.js)
// =========================================================
const coffees = [
  { name: "Latte",                  image: "images/coffee1.jpg" },
  { name: "Expresso",               image: "images/coffee2.jpg" },
  { name: "Capuchino",              image: "images/coffee3.jpg" },
  { name: "Mokachino",              image: "images/coffee4.jpg" },
  { name: "Chocolate",              image: "images/coffee5.jpg" },
  { name: "Cafe con leche",         image: "images/coffee6.jpg" },
  { name: "Capuchino con chocolate",image: "images/coffee7.jpg" },
  { name: "Tradicional",            image: "images/coffee8.jpg" },
  { name: "Capuchino Vienes",       image: "images/coffee9.jpg" }
];

const precios = {
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
    resolve(contadorElemento);
  });
};

// =========================================================
// Promesa: Obtener datos del menú
// =========================================================
const obtenerDatos = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (coffees.length > 0) {
        resolve(coffees);
      } else {
        reject("Error: No hay cafés disponibles.");
      }
    }, 1000);
  });
};

// =========================================================
// Promesa: Renderizar las tarjetas del menú con precios
// =========================================================
const renderizarMenu = (datosCafe) => {
  return new Promise((resolve) => {
    const container = document.getElementById('menu-container');
    let output = "";

    datosCafe.forEach(({ name, image }) => {
      output += `
        <div class="card">
          <img class="card--avatar" src="${image}" alt="${name}" />
          <h1 class="card--title">${name}</h1>
          <table class="price-table">
            <thead>
              <tr>
                <th>Tamaño</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Pequeño (8 oz)</td><td>$${precios["Pequeño"].toLocaleString()}</td></tr>
              <tr><td>Mediano (12 oz)</td><td>$${precios["Mediano"].toLocaleString()}</td></tr>
              <tr><td>Grande (16 oz)</td><td>$${precios["Grande"].toLocaleString()}</td></tr>
            </tbody>
          </table>
          <button class="card--order-btn" data-coffee="${name}">Ordenar</button>
        </div>
      `;
    });

    container.innerHTML = output;
    resolve("Menú renderizado correctamente.");
  });
};

// =========================================================
// Promesa: Capturar click en botón "Ordenar" con confirmación
// =========================================================
const capturarOrden = () => {
  return new Promise((resolve) => {
    const container = document.getElementById('menu-container');

    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('card--order-btn')) {
        const nombreCafe = e.target.getAttribute('data-coffee');

        mostrarModal(
          "¿Confirmar pedido?",
          `¿Deseas ordenar un "${nombreCafe}"? Serás redirigido para personalizar tu orden.`
        )
          .then((mensaje) => {
            console.log(`Confirmado: ${mensaje}`);
            window.location.href = `order.html?coffee=${encodeURIComponent(nombreCafe)}`;
            resolve(nombreCafe);
          })
          .catch((motivo) => {
            console.log(`Cancelado: ${motivo}`);
          });
      }
    });
  });
};

// =========================================================
// Encadenamiento de Promesas
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('menu-container');
  container.innerHTML = "<h2 style='text-align:center;'>Preparando el menú...</h2>";

  actualizarContador()
    .then(() => {
      console.log("1. Contador actualizado.");
      return obtenerDatos();
    })
    .then((datos) => {
      console.log("2. Datos del menú obtenidos.");
      return renderizarMenu(datos);
    })
    .then((mensaje) => {
      console.log(`3. ${mensaje}`);
      console.log("-> Menú listo. Esperando selección del usuario.");
      return capturarOrden();
    })
    .then((nombreCafe) => {
      console.log(`4. Pedido confirmado: ${nombreCafe}`);
    })
    .catch((error) => {
      console.error("Error en el flujo del menú:", error);
      const container = document.getElementById('menu-container');
      container.innerHTML = "<h2>Lo sentimos, ocurrió un error al cargar el menú.</h2>";
    });
});