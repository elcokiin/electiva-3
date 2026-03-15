/**
 * IndexedDB Wrapper for Financial App
 * Database: finanzas_db
 * Stores: expenses, budgets, debts, settings
 */

const DB_NAME = 'finanzas_db';
const DB_VERSION = 1;

let dbInstance = null;

/**
 * Initialize and open the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Error al abrir la base de datos'));
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Expenses store
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', {
          keyPath: 'id',
          autoIncrement: true,
        });
        expenseStore.createIndex('category', 'category', { unique: false });
        expenseStore.createIndex('date', 'date', { unique: false });
        expenseStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Budgets store
      if (!db.objectStoreNames.contains('budgets')) {
        const budgetStore = db.createObjectStore('budgets', {
          keyPath: 'id',
          autoIncrement: true,
        });
        budgetStore.createIndex('monthYear', ['month', 'year'], {
          unique: false,
        });
        budgetStore.createIndex('category', 'category', { unique: false });
      }

      // Debts store
      if (!db.objectStoreNames.contains('debts')) {
        const debtStore = db.createObjectStore('debts', {
          keyPath: 'id',
          autoIncrement: true,
        });
        debtStore.createIndex('type', 'type', { unique: false });
        debtStore.createIndex('entity', 'entity', { unique: false });
        debtStore.createIndex('priority', 'priority', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get the database instance (must call initDB first)
 * @returns {Promise<IDBDatabase>}
 */
async function getDB() {
  if (!dbInstance) {
    await initDB();
  }
  return dbInstance;
}

// ─── Generic CRUD Helpers ───

function doTransaction(storeName, mode, callback) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = callback(store);

      if (result && result.onsuccess !== undefined) {
        result.onsuccess = () => resolve(result.result);
        result.onerror = () => reject(result.error);
      } else {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function getAllFromStore(storeName) {
  return doTransaction(storeName, 'readonly', (store) => store.getAll());
}

function addToStore(storeName, data) {
  return doTransaction(storeName, 'readwrite', (store) => store.add(data));
}

function putToStore(storeName, data) {
  return doTransaction(storeName, 'readwrite', (store) => store.put(data));
}

function deleteFromStore(storeName, id) {
  return doTransaction(storeName, 'readwrite', (store) => store.delete(id));
}

function getByIdFromStore(storeName, id) {
  return doTransaction(storeName, 'readonly', (store) => store.get(id));
}

function clearStore(storeName) {
  return doTransaction(storeName, 'readwrite', (store) => store.clear());
}

// ─── Expenses ───

/**
 * Add a new expense
 * @param {{ amount: number, category: string, description: string, date: string }} expense
 * @returns {Promise<number>} The new expense ID
 */
export function addExpense(expense) {
  return addToStore('expenses', {
    ...expense,
    amount: Number(expense.amount),
    createdAt: new Date().toISOString(),
  });
}

/**
 * Get all expenses, optionally filtered
 * @param {{ category?: string, startDate?: string, endDate?: string, month?: number, year?: number }} filters
 * @returns {Promise<Array>}
 */
export async function getExpenses(filters = {}) {
  let expenses = await getAllFromStore('expenses');

  if (filters.category) {
    expenses = expenses.filter((e) => e.category === filters.category);
  }
  if (filters.startDate) {
    expenses = expenses.filter((e) => e.date >= filters.startDate);
  }
  if (filters.endDate) {
    expenses = expenses.filter((e) => e.date <= filters.endDate);
  }
  if (filters.month !== undefined && filters.year !== undefined) {
    expenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === filters.month && d.getFullYear() === filters.year;
    });
  }

  // Sort by date descending (most recent first)
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  return expenses;
}

/**
 * Get a single expense by ID
 * @param {number} id
 * @returns {Promise<object>}
 */
export function getExpenseById(id) {
  return getByIdFromStore('expenses', id);
}

/**
 * Update an expense
 * @param {number} id
 * @param {object} data - Updated fields
 * @returns {Promise}
 */
export async function updateExpense(id, data) {
  const existing = await getExpenseById(id);
  if (!existing) throw new Error('Gasto no encontrado');
  return putToStore('expenses', { ...existing, ...data, id });
}

/**
 * Delete an expense
 * @param {number} id
 * @returns {Promise}
 */
export function deleteExpense(id) {
  return deleteFromStore('expenses', id);
}

// ─── Budgets ───

/**
 * Set/update a budget for a category in a given month/year
 * @param {{ category: string, amount: number, month: number, year: number }} budget
 * @returns {Promise<number>}
 */
export async function setBudget(budget) {
  // Check if a budget already exists for this category/month/year
  const existing = await getBudgets(budget.month, budget.year);
  const found = existing.find((b) => b.category === budget.category);

  if (found) {
    return putToStore('budgets', { ...found, amount: Number(budget.amount) });
  }
  return addToStore('budgets', {
    ...budget,
    amount: Number(budget.amount),
  });
}

/**
 * Get budgets for a specific month/year
 * @param {number} month - 0-indexed month
 * @param {number} year
 * @returns {Promise<Array>}
 */
export async function getBudgets(month, year) {
  const all = await getAllFromStore('budgets');
  return all.filter((b) => b.month === month && b.year === year);
}

/**
 * Get all budgets (all months)
 * @returns {Promise<Array>}
 */
export function getAllBudgets() {
  return getAllFromStore('budgets');
}

/**
 * Delete a budget
 * @param {number} id
 * @returns {Promise}
 */
export function deleteBudget(id) {
  return deleteFromStore('budgets', id);
}

// ─── Debts ───

/**
 * Add a new debt
 * @param {{ type: 'receivable'|'payable', entity: string, totalAmount: number, priority: 'baja'|'media'|'alta', createdDate: string, notes?: string }} debt
 * @returns {Promise<number>}
 */
export function addDebt(debt) {
  return addToStore('debts', {
    ...debt,
    totalAmount: Number(debt.totalAmount),
    payments: debt.payments || [],
    createdAt: new Date().toISOString(),
  });
}

/**
 * Get all debts, optionally filtered by type
 * @param {'receivable'|'payable'} [type]
 * @returns {Promise<Array>}
 */
export async function getDebts(type) {
  let debts = await getAllFromStore('debts');
  if (type) {
    debts = debts.filter((d) => d.type === type);
  }
  // Sort by createdDate descending
  debts.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  return debts;
}

/**
 * Get a single debt by ID
 * @param {number} id
 * @returns {Promise<object>}
 */
export function getDebtById(id) {
  return getByIdFromStore('debts', id);
}

/**
 * Update a debt
 * @param {number} id
 * @param {object} data
 * @returns {Promise}
 */
export async function updateDebt(id, data) {
  const existing = await getDebtById(id);
  if (!existing) throw new Error('Deuda no encontrada');
  return putToStore('debts', { ...existing, ...data, id });
}

/**
 * Add a payment (abono) to a debt
 * @param {number} debtId
 * @param {{ amount: number, date: string }} payment
 * @returns {Promise}
 */
export async function addPayment(debtId, payment) {
  const debt = await getDebtById(debtId);
  if (!debt) throw new Error('Deuda no encontrada');

  const payments = [...(debt.payments || []), { amount: Number(payment.amount), date: payment.date }];
  return putToStore('debts', { ...debt, payments });
}

/**
 * Delete a debt
 * @param {number} id
 * @returns {Promise}
 */
export function deleteDebt(id) {
  return deleteFromStore('debts', id);
}

/**
 * Calculate paid amount for a debt
 * @param {object} debt
 * @returns {number}
 */
export function getDebtPaidAmount(debt) {
  if (!debt.payments || debt.payments.length === 0) return 0;
  return debt.payments.reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Calculate remaining amount for a debt
 * @param {object} debt
 * @returns {number}
 */
export function getDebtRemainingAmount(debt) {
  return debt.totalAmount - getDebtPaidAmount(debt);
}

// ─── Settings ───

/**
 * Get a setting value
 * @param {string} key
 * @returns {Promise<*>}
 */
export async function getSetting(key) {
  const result = await getByIdFromStore('settings', key);
  return result ? result.value : null;
}

/**
 * Set a setting value
 * @param {string} key
 * @param {*} value
 * @returns {Promise}
 */
export function setSetting(key, value) {
  return putToStore('settings', { key, value });
}

// ─── Data Management ───

/**
 * Export all data as JSON
 * @returns {Promise<object>}
 */
export async function exportAllData() {
  const expenses = await getAllFromStore('expenses');
  const budgets = await getAllFromStore('budgets');
  const debts = await getAllFromStore('debts');
  const settings = await getAllFromStore('settings');

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { expenses, budgets, debts, settings },
  };
}

/**
 * Import data from JSON
 * @param {object} jsonData - The exported data object
 * @returns {Promise}
 */
export async function importData(jsonData) {
  if (!jsonData || !jsonData.data) {
    throw new Error('Formato de datos invalido');
  }

  const { expenses, budgets, debts, settings } = jsonData.data;

  // Clear all stores first
  await clearAllData();

  // Import each store
  if (expenses) {
    for (const item of expenses) {
      await addToStore('expenses', item);
    }
  }
  if (budgets) {
    for (const item of budgets) {
      await addToStore('budgets', item);
    }
  }
  if (debts) {
    for (const item of debts) {
      await addToStore('debts', item);
    }
  }
  if (settings) {
    for (const item of settings) {
      await putToStore('settings', item);
    }
  }
}

/**
 * Clear all data from all stores
 * @returns {Promise}
 */
export async function clearAllData() {
  await clearStore('expenses');
  await clearStore('budgets');
  await clearStore('debts');
  await clearStore('settings');
}
