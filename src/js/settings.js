/**
 * Settings Page Logic
 * Handles: theme toggle, data export/import, clear data, PWA install
 */

import { exportAllData, importData, clearAllData } from './db.js';
import { showToast } from './layout.js';

let deferredPrompt = null;

window.addEventListener('appReady', () => {
  initSettingsPage();
});

function initSettingsPage() {
  setupThemeToggle();
  setupExportButton();
  setupImportButton();
  setupClearDataButton();
  setupPWAInstall();
}

/**
 * Setup dark/light mode toggle switch
 */
function setupThemeToggle() {
  const toggle = document.getElementById('theme-switch');
  if (!toggle) return;

  // Set initial state
  toggle.checked = document.documentElement.classList.contains('dark');

  toggle.addEventListener('change', () => {
    const mode = toggle.checked ? 'dark' : 'light';
    document.dispatchEvent(
      new CustomEvent('basecoat:theme', { detail: { mode } })
    );
  });

  // Listen for external theme changes
  window.addEventListener('themeChanged', () => {
    toggle.checked = document.documentElement.classList.contains('dark');
  });
}

/**
 * Setup export button
 */
function setupExportButton() {
  const btn = document.getElementById('export-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `control-financiero-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Datos exportados', 'El archivo se descargo correctamente');
    } catch (error) {
      showToast('Error', 'No se pudieron exportar los datos', 'error');
      console.error(error);
    }
  });
}

/**
 * Setup import button
 */
function setupImportButton() {
  const fileInput = document.getElementById('import-file');
  if (!fileInput) return;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.data) {
        showToast('Error', 'El archivo no tiene el formato correcto', 'error');
        return;
      }

      await importData(data);
      showToast('Datos importados', 'Los datos se importaron correctamente. Recarga la pagina para ver los cambios.');

      // Reset file input
      fileInput.value = '';

      // Reload after a brief delay
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showToast('Error', 'No se pudieron importar los datos. Verifica el formato del archivo.', 'error');
      console.error(error);
      fileInput.value = '';
    }
  });
}

/**
 * Setup clear data button with confirmation dialog
 */
function setupClearDataButton() {
  const btn = document.getElementById('clear-data-btn');
  const confirmBtn = document.getElementById('confirm-clear-btn');

  if (btn) {
    btn.addEventListener('click', () => {
      document.getElementById('clear-data-dialog').showModal();
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      try {
        await clearAllData();
        showToast('Datos eliminados', 'Todos los datos fueron eliminados correctamente');
        document.getElementById('clear-data-dialog').close();

        // Reload after a brief delay
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        showToast('Error', 'No se pudieron eliminar los datos', 'error');
        console.error(error);
      }
    });
  }
}

/**
 * Setup PWA install prompt
 */
function setupPWAInstall() {
  const installCard = document.getElementById('install-card');
  const installBtn = document.getElementById('install-btn');

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installCard) installCard.style.display = 'block';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        showToast('Instalada', 'La aplicacion se instalo correctamente');
        if (installCard) installCard.style.display = 'none';
      }

      deferredPrompt = null;
    });
  }

  // Hide install card if already installed
  window.addEventListener('appinstalled', () => {
    if (installCard) installCard.style.display = 'none';
    deferredPrompt = null;
  });
}
