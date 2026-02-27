
// 1. Creamos nuestro arreglo vacío donde vivirá la información
const misOrdenes = [];

// Obtenemos el nombre del café de la URL
const urlParams = new URLSearchParams(window.location.search);
const coffeeName = urlParams.get('coffee') || "Café Especial";

const guardarEnArray = (nuevaOrden) => {
    return new Promise((resolve) => {
        // 1. Traemos el arreglo actual (o creamos uno vacío)
        let misOrdenes = JSON.parse(localStorage.getItem('misOrdenesArray')) || [];

        // 2. Insertamos la nueva orden en el arreglo
        misOrdenes.push(nuevaOrden);

        // 3. Lo guardamos para que Menu.html pueda leerlo
        localStorage.setItem('misOrdenesArray', JSON.stringify(misOrdenes));

        console.log("Arreglo actualizado:", misOrdenes);
        resolve("Orden guardada exitosamente.");
    });
};

// =========================================================
// Capturar el envío del formulario de la orden
// =========================================================
const orderForm = document.getElementById('order-form');

if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Extraemos los datos del formulario
        const size = document.getElementById('size').value;
        const hasSugar = document.getElementById('sugar').checked;

        // Construimos el objeto de la orden
        const nuevaOrden = {
            id: Date.now(),
            cafe: coffeeName,
            tamaño: size,
            azucar: hasSugar,
            fecha: new Date().toLocaleString()
        };

        const resultDiv = document.getElementById('order-result');
        const btnSubmit = document.querySelector('.btn-submit');

        resultDiv.textContent = "Procesando tu orden...";
        resultDiv.className = 'success';
        resultDiv.style.display = 'block';
        btnSubmit.disabled = true;

        // Ejecutamos nuestra Promesa
        guardarEnArray(nuevaOrden)
            .then((mensaje) => {
                // Mostramos mensaje de éxito
                resultDiv.textContent = `¡Listo! ${mensaje}`;

                // IMPORTANTE: Para ver el arreglo en consola, 
                // vamos a comentar temporalmente la redirección.
                /*
                setTimeout(() => {
                    window.location.href = 'Menu.html';
                }, 3000);
                */

                // Reactivamos el botón por si quieres hacer otra orden
                setTimeout(() => {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Hacer otro pedido igual";
                }, 1000);
            })
            .catch((error) => {
                console.error(error);
            });
    });
}