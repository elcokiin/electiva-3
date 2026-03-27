// ============================================================
// personajes.js
// FASE 3 (cliente): Consumo de API + renderizado + Leer después
// API usada: https://rickandmortyapi.com/api/character
// ============================================================

const API_URL      = 'https://rickandmortyapi.com/api/character';
const LS_KEY       = 'pwa_leer_despues';
let   paginaActual = 1;
let   totalPaginas = 1;
let   personajeActual = null;

// ---- Carga de personajes desde la API ---- //
async function cargarPersonajes(pagina = paginaActual) {
  const grid    = document.getElementById('personajes-grid');
  const spinner = document.getElementById('spinner');

  spinner.classList.remove('d-none');
  grid.innerHTML = '';

  try {
    const resp = await fetch(`${API_URL}?page=${pagina}`);
    if (!resp.ok) throw new Error('Error de red');

    const data = await resp.json();
    totalPaginas  = data.info.pages;
    paginaActual  = pagina;

    renderizarPersonajes(data.results);
    actualizarPaginacion();

  } catch (err) {
    console.warn('[personajes] Sin red, buscando en caché...', err);
    // El SW ya intentó el caché — si llega aquí es que tampoco había caché
    grid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          No hay conexión y no se encontraron datos en caché para esta página.
          <a href="./pages/leer-despues.html" class="alert-link">Ver guardados offline →</a>
        </div>
      </div>`;
  } finally {
    spinner.classList.add('d-none');
  }
}

// ---- Renderiza las tarjetas ---- //
function renderizarPersonajes(personajes) {
  const grid = document.getElementById('personajes-grid');
  grid.innerHTML = '';

  personajes.forEach(p => {
    const badgeClass = {
      'Alive':   'badge-alive',
      'Dead':    'badge-dead',
      'unknown': 'badge-unknown'
    }[p.status] || 'badge-unknown';

    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3 mb-4';
    col.innerHTML = `
      <div class="card card-personaje h-100" onclick="abrirModal(${p.id})">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <div class="card-body">
          <h6 class="card-title">${p.name}</h6>
          <span class="badge ${badgeClass}">${p.status}</span>
          <small class="text-muted d-block mt-1">${p.species}</small>
        </div>
      </div>`;
    grid.appendChild(col);
  });
}

// ---- Paginación ---- //
function cambiarPagina(delta) {
  const nueva = paginaActual + delta;
  if (nueva >= 1 && nueva <= totalPaginas) cargarPersonajes(nueva);
}

function actualizarPaginacion() {
  document.getElementById('pagina-info').textContent =
    `Página ${paginaActual} / ${totalPaginas}`;
  document.getElementById('btn-prev').disabled = (paginaActual === 1);
  document.getElementById('btn-next').disabled = (paginaActual === totalPaginas);
}

// ---- Modal de detalle ---- //
async function abrirModal(id) {
  try {
    const resp = await fetch(`${API_URL}/${id}`);
    const p    = await resp.json();
    personajeActual = p;

    document.getElementById('modal-nombre').textContent = p.name;
    document.getElementById('modal-img').src = p.image;
    document.getElementById('modal-img').alt = p.name;

    document.getElementById('modal-detalle').innerHTML = `
      <tr><th>Estado</th>    <td>${p.status}</td></tr>
      <tr><th>Especie</th>   <td>${p.species}</td></tr>
      <tr><th>Género</th>    <td>${p.gender}</td></tr>
      <tr><th>Origen</th>    <td>${p.origin.name}</td></tr>
      <tr><th>Ubicación</th> <td>${p.location.name}</td></tr>
      <tr><th>Episodios</th> <td>${p.episode.length}</td></tr>
    `;

    // Verificar si ya está guardado
    const guardados = obtenerGuardados();
    const yaGuardado = guardados.some(g => g.id === p.id);
    const btnGuardar = document.getElementById('btn-guardar-despues');
    btnGuardar.textContent = yaGuardado ? '✅ Ya guardado' : '📚 Guardar para leer después';
    btnGuardar.disabled    = yaGuardado;

    $('#modalPersonaje').modal('show');

  } catch (err) {
    console.error('[modal] Error al cargar detalle:', err);
  }
}

// ---- Fase 4: Leer después (LocalStorage) ---- //
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-guardar-despues');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!personajeActual) return;
      guardarParaDespues(personajeActual);
      btn.textContent = '✅ Ya guardado';
      btn.disabled    = true;
    });
  }

  // Cargar al iniciar
  cargarPersonajes(1);
});

function obtenerGuardados() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}

function guardarParaDespues(personaje) {
  const guardados = obtenerGuardados();
  if (guardados.some(g => g.id === personaje.id)) return; // no duplicar

  // Guardar solo los campos necesarios
  guardados.push({
    id:       personaje.id,
    name:     personaje.name,
    status:   personaje.status,
    species:  personaje.species,
    gender:   personaje.gender,
    origin:   personaje.origin.name,
    location: personaje.location.name,
    episodes: personaje.episode.length,
    image:    personaje.image,
    savedAt:  new Date().toLocaleString('es-CO')
  });

  localStorage.setItem(LS_KEY, JSON.stringify(guardados));
  console.log(`[leer-después] Guardado: ${personaje.name}`);

  // Notificación visual
  mostrarToast(`"${personaje.name}" guardado para leer después 📚`);
}

function mostrarToast(mensaje) {
  // Toast simple sin dependencias
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #333; color: #fff; padding: 12px 24px; border-radius: 8px;
    z-index: 9999; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: opacity 0.4s;
  `;
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2500);
}
