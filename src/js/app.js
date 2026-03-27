// ============================================================
// app.js
// FASE 1: Registro del Service Worker + detección de red
// ============================================================

// --- Registro del Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js')
    .then(reg => {
      console.log('[SW] Registrado correctamente:', reg.scope);
    })
    .catch(err => {
      console.error('[SW] Error al registrar:', err);
    });
}

// --- Detección de estado de red ---
function actualizarEstadoRed() {
  const badge  = document.getElementById('status-badge');
  const banner = document.getElementById('offline-banner');

  if (navigator.onLine) {
    if (badge)  { badge.textContent = 'Online';  badge.className = 'badge badge-success'; }
    if (banner) { banner.classList.add('d-none'); }
  } else {
    if (badge)  { badge.textContent = 'Offline'; badge.className = 'badge badge-danger'; }
    if (banner) { banner.classList.remove('d-none'); }
  }
}

window.addEventListener('online',  actualizarEstadoRed);
window.addEventListener('offline', actualizarEstadoRed);

// Llamar al inicio
document.addEventListener('DOMContentLoaded', actualizarEstadoRed);
