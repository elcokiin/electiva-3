/**
 * Main entry point for the Financial App
 * Handles: imports, service worker registration, DB initialization, layout injection
 */

import 'basecoat-css/all';
import './styles.css';
import { initDB } from './js/db.js';
import { injectLayout, setupConnectivityIndicator } from './js/layout.js';

// ─── Theme Switcher (must run early to prevent FOUC) ───
(() => {
  try {
    const stored = localStorage.getItem('themeMode');
    if (
      stored
        ? stored === 'dark'
        : matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      document.documentElement.classList.add('dark');
    }
  } catch (_) {}

  const apply = (dark) => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('themeMode', dark ? 'dark' : 'light');
    } catch (_) {}
    // Dispatch event for charts to re-render
    window.dispatchEvent(new CustomEvent('themeChanged'));
  };

  document.addEventListener('basecoat:theme', (event) => {
    const mode = event.detail?.mode;
    apply(
      mode === 'dark'
        ? true
        : mode === 'light'
          ? false
          : !document.documentElement.classList.contains('dark')
    );
  });
})();

// ─── Service Worker Registration ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.error('[App] Error al registrar Service Worker:', error);
      });
  });
}

// ─── App Initialization ───
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize database
  try {
    await initDB();
    console.log('[App] Base de datos inicializada');
  } catch (error) {
    console.error('[App] Error al inicializar base de datos:', error);
  }

  // Inject shared layout
  injectLayout();

  // Setup online/offline indicator
  setupConnectivityIndicator();

  // Dispatch event for page-specific scripts
  window.dispatchEvent(new CustomEvent('appReady'));
});
