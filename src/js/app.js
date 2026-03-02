const container = document.querySelector(".container");
const coffees = [
  {
    name: "Latte",
    image: "images/coffee1.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  },
  {
    name: "Expresso",
    image: "images/coffee2.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  },
  {
    name: "Capuchino",
    image: "images/coffee3.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  },
  {
    name: "Mokachino",
    image: "images/coffee4.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  },
  {
    name: "Chocolate",
    image: "images/coffee5.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  },
  {
    name: " Cafe con leche",
    image: "images/coffee6.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  },
  {
    name: "Capuchino con chocolate",
    image: "images/coffee7.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  },
  {
    name: "Tradicional",
    image: "images/coffee8.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  },
  {
    name: "Capuchino Vienes",
    image: "images/coffee9.jpg",
    prices: { pequeno: 4000, mediano: 6000, grande: 8000 }
  }
];

// =========================================================
// Promesa: Actualizar el contador de ordenes en la vista
// =========================================================
const actualizarContador = () => {
  return new Promise((resolve, reject) => {
    const misOrdenes = JSON.parse(localStorage.getItem('misOrdenesArray')) || [];
    const contadorElemento = document.getElementById('counter-value');
    if (contadorElemento) {
      contadorElemento.textContent = misOrdenes.length;
    }
    resolve(contadorElemento);
  });
};
// =========================================================
// Promesa: Simular la obtención de datos del arreglo de cafés y su información
// =========================================================
const obtenerDatos = () => {
  return new Promise((resolve, reject) => {
    // Simulamos un retraso de red de 1 segundo
    setTimeout(() => {
      if (coffees.length > 0) {
        resolve(coffees);
      } else {
        reject("Error: No hay cafés disponibles en la base de datos.");
      }
    }, 1000);
  });
};

// =========================================================
// Promesa: Renderizar los componentes en el DOM
// =========================================================
const renderizarCafes = (datosCafe) => {
  return new Promise((resolve) => {
    let output = "";
    datosCafe.forEach(({ name, image, prices }) => {
      const priceLine = prices
        ? `Pequeño $${prices.pequeno} COP | Mediano $${prices.mediano} COP | Grande $${prices.grande} COP`
        : "";
      output += `
        <div class="card">
          <img class="card--avatar" src="${image}" alt="${name}" />
          <h1 class="card--title">${name}</h1>
          <p class="card--prices">${priceLine}</p>
          <a class="card--link" href="order.html?coffee=${name}">Taste</a>
        </div>
      `;
    });
    container.innerHTML = output;
    resolve("Los componentes HTML han sido inyectados en el contenedor.");
  });
};

// =========================================================
// Promesa: Esperar a que las imágenes carguen visualmente
// =========================================================
const esperarImagenes = () => {
  return new Promise((resolve) => {
    const images = document.querySelectorAll('.card--avatar');
    let loadedCount = 0;
    if (images.length === 0) resolve("No hay imágenes para cargar.");
    images.forEach((img) => {
      if (img.complete) {
        loadedCount++;
        if (loadedCount === images.length) resolve("Todas las imágenes están listas.");
      } else {
        img.addEventListener('load', () => {
          loadedCount++;
          if (loadedCount === images.length) resolve("Todas las imágenes están listas.");
        });
        img.addEventListener('error', () => {
          loadedCount++;
          if (loadedCount === images.length) resolve("Las imágenes terminaron de procesarse (algunas con error).");
        });
      }
    });
  });
};

// =========================================================
// Promesa: Capturar la primera interacción del usuario
// =========================================================
const capturarPrimerClick = () => {
  return new Promise((resolve) => {
    const botones = document.querySelectorAll('.card--link');
    botones.forEach(btn => {
      btn.addEventListener('click', function manejadorClick(e) {
        e.preventDefault();
        const nombreCafe = e.target.previousElementSibling.textContent.trim();
        resolve(nombreCafe);
      });
    });
  });
};

// =========================================================
//  Encadenamiento de las Promesas
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  container.innerHTML = "<h2 style='text-align:center;'>Preparando tu café...</h2>";

  const productsStatus = document.getElementById("products-status");
  const productsConfirm = document.getElementById("products-confirm");
  const productsReject = document.getElementById("products-reject");

  if (productsConfirm && productsReject && productsStatus) {
    productsConfirm.addEventListener("click", () => {
      productsStatus.textContent = "Operacion confirmada. Lista de productos disponible.";
      productsStatus.classList.remove("status--rejected");
      productsStatus.classList.add("status--approved");
    });

    productsReject.addEventListener("click", () => {
      productsStatus.textContent = "Operacion rechazada. Lista de productos no disponible.";
      productsStatus.classList.remove("status--approved");
      productsStatus.classList.add("status--rejected");
    });
  }

  actualizarContador()
    .then(() => {
      console.log("1. Contador ordenes actualizado");
      return obtenerDatos();
    })
    .then((datos) => {
      console.log("2. Datos obtenidos con éxito.");
      return renderizarCafes(datos);
    })
    .then((mensajeRender) => {
      console.log(`2. ${mensajeRender}`);
      return esperarImagenes();
    })
    .then((mensajeImagenes) => {
      console.log(`3. ${mensajeImagenes}`);
      console.log("-> La interfaz está 100% lista para usarse.");
      // Aquí empieza a esperar que el usuario haga click
      return capturarPrimerClick();
    })
    .then((nombreCafe) => {
      console.log(`4. Usuario eligió: ${nombreCafe}. Redirigiendo...`);
      // Redirigimos a la página de la orden pasando el nombre en la URL
      window.location.href = `order.html?coffee=${encodeURIComponent(nombreCafe)}`;
    })
    .catch((error) => {
      console.error(error);
      container.innerHTML = "<h2>Lo sentimos, ocurrió un error al cargar los cafés.</h2>";
    });
});

// =========================================================
// Registro del Service Worker
// =========================================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js")
      .then(res => console.log("Service worker registrado"))
      .catch(err => console.log("Service worker no registrado", err));
  });
}
