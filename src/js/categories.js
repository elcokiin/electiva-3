/**
 * Predefined Expense Categories (Spanish)
 * Each category has: id, name, icon (SVG path), color (CSS variable reference)
 */

const CATEGORIES = [
  {
    id: 'alimentacion',
    name: 'Alimentacion',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/></svg>`,
    color: 'var(--chart-1)',
  },
  {
    id: 'transporte',
    name: 'Transporte',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
    color: 'var(--chart-2)',
  },
  {
    id: 'entretenimiento',
    name: 'Entretenimiento',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="3" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>`,
    color: 'var(--chart-3)',
  },
  {
    id: 'vivienda',
    name: 'Vivienda',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
    color: 'var(--chart-4)',
  },
  {
    id: 'servicios',
    name: 'Servicios',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2m0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8z"/></svg>`,
    color: 'var(--chart-5)',
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z"/></svg>`,
    color: 'oklch(0.65 0.18 150)',
  },
  {
    id: 'educacion',
    name: 'Educacion',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/></svg>`,
    color: 'oklch(0.55 0.15 230)',
  },
  {
    id: 'compras',
    name: 'Compras',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
    color: 'oklch(0.60 0.20 330)',
  },
  {
    id: 'ahorro',
    name: 'Ahorro',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2"/><path d="M2 9.1C1.9 9.7 2 10 2 10"/><circle cx="12.5" cy="11.5" r=".5" fill="currentColor"/></svg>`,
    color: 'oklch(0.70 0.15 160)',
  },
  {
    id: 'ropa',
    name: 'Ropa',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l4.5 3V21h7V7L20 4l-3-3-2.5 2h-5L7 1z"/></svg>`,
    color: 'oklch(0.65 0.12 60)',
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="8" x="5" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 18h2"/><path d="M12 18h6"/></svg>`,
    color: 'oklch(0.55 0.10 250)',
  },
  {
    id: 'otro',
    name: 'Otro',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
    color: 'oklch(0.50 0.05 100)',
  },
];

/**
 * Get all categories
 * @returns {Array} All predefined categories
 */
export function getCategories() {
  return CATEGORIES;
}

/**
 * Get a single category by id
 * @param {string} id - Category id
 * @returns {object|undefined} The category object
 */
export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id);
}

/**
 * Get category name by id
 * @param {string} id - Category id
 * @returns {string} Category name or 'Otro'
 */
export function getCategoryName(id) {
  const cat = getCategoryById(id);
  return cat ? cat.name : 'Otro';
}

/**
 * Get category color by id
 * @param {string} id - Category id
 * @returns {string} CSS color value
 */
export function getCategoryColor(id) {
  const cat = getCategoryById(id);
  return cat ? cat.color : 'var(--muted-foreground)';
}

export default CATEGORIES;
