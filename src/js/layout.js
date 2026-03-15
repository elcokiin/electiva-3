/**
 * Shared Layout System
 * Injects consistent header, navigation, and footer across all pages
 */

const NAV_ITEMS = [
  {
    id: 'inicio',
    label: 'Inicio',
    href: '/',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
  },
  {
    id: 'gastos',
    label: 'Gastos',
    href: '/expenses.html',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  },
  {
    id: 'presupuesto',
    label: 'Presupuesto',
    href: '/budget.html',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  },
  {
    id: 'deudas',
    label: 'Deudas',
    href: '/deudas.html',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    id: 'config',
    label: 'Ajustes',
    href: '/settings.html',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
];

/**
 * Get the current active nav item based on URL
 * @returns {string} The nav item id
 */
function getActiveNav() {
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') return 'inicio';
  if (path.includes('expenses')) return 'gastos';
  if (path.includes('budget')) return 'presupuesto';
  if (path.includes('deudas')) return 'deudas';
  if (path.includes('settings')) return 'config';
  return 'inicio';
}

/**
 * Create the header HTML
 * @returns {string}
 */
function createHeader() {
  return `
    <header class="app-header">
      <div class="app-header-inner">
        <a href="/" class="app-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Control Financiero</span>
        </a>
        <div class="app-header-actions">
          <span class="offline-badge" id="offline-badge" style="display:none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 12.86a10 10 0 0 1 5.59-2.68"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>
            Sin conexion
          </span>
          <button type="button"
            aria-label="Cambiar tema"
            onclick="document.dispatchEvent(new CustomEvent('basecoat:theme'))"
            class="btn-ghost btn-sm theme-toggle-btn">
            <span class="hidden dark:block">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </span>
            <span class="block dark:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  `;
}

/**
 * Create the desktop sidebar navigation HTML
 * @returns {string}
 */
function createDesktopNav() {
  const active = getActiveNav();

  const items = NAV_ITEMS.map(
    (item) => `
    <li>
      <a href="${item.href}" class="desktop-nav-link ${active === item.id ? 'active' : ''}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    </li>
  `
  ).join('');

  return `
    <nav class="desktop-nav" aria-label="Navegacion principal">
      <ul>${items}</ul>
    </nav>
  `;
}

/**
 * Create the mobile bottom navigation HTML
 * @returns {string}
 */
function createMobileNav() {
  const active = getActiveNav();

  const items = NAV_ITEMS.map(
    (item) => `
    <a href="${item.href}" class="mobile-nav-link ${active === item.id ? 'active' : ''}" aria-label="${item.label}">
      ${item.icon}
      <span>${item.label}</span>
    </a>
  `
  ).join('');

  return `
    <nav class="mobile-nav" aria-label="Navegacion principal">
      ${items}
    </nav>
  `;
}

/**
 * Inject the layout into the page
 * Wraps existing body content in the proper layout structure
 */
export function injectLayout() {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  // Create layout wrapper
  const layoutWrapper = document.createElement('div');
  layoutWrapper.className = 'app-layout';
  layoutWrapper.innerHTML = `
    ${createHeader()}
    <div class="app-body">
      ${createDesktopNav()}
      <main class="app-main">
        ${pageContent.innerHTML}
      </main>
    </div>
    ${createMobileNav()}
  `;

  // Replace page content
  pageContent.innerHTML = '';
  pageContent.appendChild(layoutWrapper);
}

/**
 * Show a toast notification
 * @param {string} title
 * @param {string} description
 * @param {'success'|'info'|'warning'|'error'} category
 */
export function showToast(title, description, category = 'success') {
  document.dispatchEvent(
    new CustomEvent('basecoat:toast', {
      detail: {
        config: {
          category,
          title,
          description,
          duration: category === 'error' ? 5000 : 3000,
          cancel: { label: 'Cerrar' },
        },
      },
    })
  );
}

/**
 * Setup online/offline indicators
 */
export function setupConnectivityIndicator() {
  const badge = document.getElementById('offline-badge');
  if (!badge) return;

  function updateStatus() {
    badge.style.display = navigator.onLine ? 'none' : 'flex';
    if (!navigator.onLine) {
      showToast('Sin conexion', 'Estas trabajando sin conexion a internet', 'warning');
    }
  }

  window.addEventListener('online', () => {
    badge.style.display = 'none';
    showToast('Conectado', 'Conexion a internet restablecida', 'success');
  });

  window.addEventListener('offline', updateStatus);
  updateStatus();
}

/**
 * Get current month and year
 * @returns {{ month: number, year: number, label: string }}
 */
export function getCurrentMonthYear() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return { month, year, label: `${monthNames[month]} ${year}` };
}

/**
 * Format a date string to locale display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string}
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}
