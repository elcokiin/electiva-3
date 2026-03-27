// ============================================================
// leer-despues.js
// FASE 4: Página de elementos guardados para leer después
// Lee del LocalStorage y renderiza las tarjetas guardadas.
// ============================================================

const LS_KEY = 'pwa_leer_despues';

function obtenerGuardados() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}

function eliminarGuardado(id) {
  const guardados = obtenerGuardados().filter(g => g.id !== id);
  localStorage.setItem(LS_KEY, JSON.stringify(guardados));
  renderizarGuardados();
}

function limpiarTodo() {
  if (confirm('¿Eliminar todos los personajes guardados?')) {
    localStorage.removeItem(LS_KEY);
    renderizarGuardados();
  }
}

function renderizarGuardados() {
  const lista   = document.getElementById('lista-guardados');
  const emptyMsg = document.getElementById('empty-msg');
  const guardados = obtenerGuardados();

  if (guardados.length === 0) {
    lista.innerHTML = '';
    emptyMsg.classList.remove('d-none');
    return;
  }

  emptyMsg.classList.add('d-none');
  lista.innerHTML = '';

  guardados.forEach(p => {
    const badgeClass = {
      'Alive':   'badge-success',
      'Dead':    'badge-danger',
      'unknown': 'badge-secondary'
    }[p.status] || 'badge-secondary';

    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3 mb-4';
    col.innerHTML = `
      <div class="card card-guardado h-100 position-relative">
        <button class="btn btn-danger btn-eliminar-guardado"
                onclick="eliminarGuardado(${p.id})" title="Eliminar">✕</button>
        <img src="${p.image}" alt="${p.name}" />
        <div class="card-body p-2">
          <h6 class="card-title font-weight-bold mb-1">${p.name}</h6>
          <span class="badge ${badgeClass} mb-1">${p.status}</span>
          <table class="table table-sm table-borderless mb-0" style="font-size:0.8rem;">
            <tr><td class="text-muted p-0">Especie</td><td class="p-0">${p.species}</td></tr>
            <tr><td class="text-muted p-0">Origen</td>
                <td class="p-0" style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                    title="${p.origin}">${p.origin}</td></tr>
            <tr><td class="text-muted p-0">Episodios</td><td class="p-0">${p.episodes}</td></tr>
          </table>
          <small class="text-muted d-block mt-1">Guardado: ${p.savedAt}</small>
        </div>
      </div>`;
    lista.appendChild(col);
  });
}

// Renderizar al cargar la página
document.addEventListener('DOMContentLoaded', renderizarGuardados);
