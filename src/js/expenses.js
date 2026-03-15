/**
 * Expenses Page Logic
 * Handles: add/edit/delete expenses, filtering, expense list rendering
 */

import { addExpense, getExpenses, updateExpense, deleteExpense } from './db.js';
import { getCategories, getCategoryById } from './categories.js';
import { formatCOP } from './currency.js';
import { showToast, formatDate, getTodayISO } from './layout.js';

let currentExpenses = [];
let deleteTargetId = null;

window.addEventListener('appReady', () => {
  initExpensesPage();
});

async function initExpensesPage() {
  populateCategorySelects();
  setupForm();
  setupFilters();
  setupEditForm();
  setupDeleteConfirmation();
  await loadExpenses();
}

/**
 * Populate all category select dropdowns
 */
function populateCategorySelects() {
  const categories = getCategories();
  const selects = ['expense-category', 'edit-category', 'filter-category'];

  selects.forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;

    // Keep existing first option (placeholder)
    const firstOption = select.querySelector('option');

    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      select.appendChild(option);
    });
  });

  // Set default date to today
  const dateInput = document.getElementById('expense-date');
  if (dateInput) {
    dateInput.value = getTodayISO();
    dateInput.max = getTodayISO();
  }
}

/**
 * Setup the add expense form
 */
function setupForm() {
  const form = document.getElementById('expense-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value;
    const date = document.getElementById('expense-date').value;

    // Validation
    if (!amount || Number(amount) <= 0) {
      showToast('Error', 'El monto debe ser mayor a 0', 'error');
      return;
    }
    if (!category) {
      showToast('Error', 'Selecciona una categoria', 'error');
      return;
    }
    if (!date) {
      showToast('Error', 'Selecciona una fecha', 'error');
      return;
    }

    try {
      await addExpense({
        amount: Number(amount),
        category,
        description: description.trim(),
        date,
      });

      showToast('Gasto agregado', `${formatCOP(Number(amount))} en ${getCategoryById(category)?.name || category}`);
      form.reset();
      document.getElementById('expense-date').value = getTodayISO();
      await loadExpenses();
    } catch (error) {
      showToast('Error', 'No se pudo agregar el gasto', 'error');
      console.error(error);
    }
  });
}

/**
 * Setup filter controls
 */
function setupFilters() {
  const filterCategory = document.getElementById('filter-category');
  const filterStart = document.getElementById('filter-date-start');
  const filterEnd = document.getElementById('filter-date-end');
  const filterClear = document.getElementById('filter-clear');

  [filterCategory, filterStart, filterEnd].forEach((el) => {
    if (el) el.addEventListener('change', loadExpenses);
  });

  if (filterClear) {
    filterClear.addEventListener('click', () => {
      if (filterCategory) filterCategory.value = '';
      if (filterStart) filterStart.value = '';
      if (filterEnd) filterEnd.value = '';
      loadExpenses();
    });
  }
}

/**
 * Load and render expenses
 */
async function loadExpenses() {
  const filters = {};

  const filterCategory = document.getElementById('filter-category');
  const filterStart = document.getElementById('filter-date-start');
  const filterEnd = document.getElementById('filter-date-end');

  if (filterCategory?.value) filters.category = filterCategory.value;
  if (filterStart?.value) filters.startDate = filterStart.value;
  if (filterEnd?.value) filters.endDate = filterEnd.value;

  try {
    currentExpenses = await getExpenses(filters);
    renderExpenseList(currentExpenses);
  } catch (error) {
    console.error('Error loading expenses:', error);
    showToast('Error', 'No se pudieron cargar los gastos', 'error');
  }
}

/**
 * Render the expense list
 * @param {Array} expenses
 */
function renderExpenseList(expenses) {
  const list = document.getElementById('expense-list');
  const empty = document.getElementById('expense-empty');
  const count = document.getElementById('expense-count');

  if (!list) return;

  if (expenses.length === 0) {
    list.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    if (count) count.textContent = '0 gastos';
    return;
  }

  list.style.display = 'block';
  if (empty) empty.style.display = 'none';
  if (count) count.textContent = `${expenses.length} gasto${expenses.length !== 1 ? 's' : ''}`;

  list.innerHTML = expenses
    .map((expense) => {
      const cat = getCategoryById(expense.category);
      return `
      <div class="expense-item" data-id="${expense.id}">
        <div class="expense-icon" style="color: ${cat?.color || 'var(--muted-foreground)'}">
          ${cat?.icon || ''}
        </div>
        <div class="expense-info">
          <div class="expense-title">${expense.description || cat?.name || 'Sin descripcion'}</div>
          <div class="expense-meta">${cat?.name || ''} · ${formatDate(expense.date)}</div>
        </div>
        <div class="expense-amount">${formatCOP(expense.amount)}</div>
        <div class="expense-actions">
          <button class="btn-ghost btn-sm edit-expense-btn" data-id="${expense.id}" aria-label="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
          </button>
          <button class="btn-ghost btn-sm delete-expense-btn" data-id="${expense.id}" aria-label="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
    })
    .join('');

  // Attach event listeners
  list.querySelectorAll('.edit-expense-btn').forEach((btn) => {
    btn.addEventListener('click', () => openEditDialog(Number(btn.dataset.id)));
  });

  list.querySelectorAll('.delete-expense-btn').forEach((btn) => {
    btn.addEventListener('click', () => openDeleteDialog(Number(btn.dataset.id)));
  });
}

/**
 * Open edit expense dialog
 */
function openEditDialog(id) {
  const expense = currentExpenses.find((e) => e.id === id);
  if (!expense) return;

  document.getElementById('edit-expense-id').value = id;
  document.getElementById('edit-amount').value = expense.amount;
  document.getElementById('edit-category').value = expense.category;
  document.getElementById('edit-description').value = expense.description || '';
  document.getElementById('edit-date').value = expense.date;
  document.getElementById('edit-date').max = getTodayISO();

  document.getElementById('edit-expense-dialog').showModal();
}

/**
 * Setup edit form
 */
function setupEditForm() {
  const saveBtn = document.getElementById('save-edit-btn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const id = Number(document.getElementById('edit-expense-id').value);
    const amount = document.getElementById('edit-amount').value;
    const category = document.getElementById('edit-category').value;
    const description = document.getElementById('edit-description').value;
    const date = document.getElementById('edit-date').value;

    if (!amount || Number(amount) <= 0) {
      showToast('Error', 'El monto debe ser mayor a 0', 'error');
      return;
    }

    try {
      await updateExpense(id, {
        amount: Number(amount),
        category,
        description: description.trim(),
        date,
      });

      showToast('Gasto actualizado', 'Los cambios se guardaron correctamente');
      document.getElementById('edit-expense-dialog').close();
      await loadExpenses();
    } catch (error) {
      showToast('Error', 'No se pudo actualizar el gasto', 'error');
      console.error(error);
    }
  });
}

/**
 * Open delete confirmation dialog
 */
function openDeleteDialog(id) {
  deleteTargetId = id;
  document.getElementById('delete-dialog').showModal();
}

/**
 * Setup delete confirmation
 */
function setupDeleteConfirmation() {
  const confirmBtn = document.getElementById('confirm-delete-btn');
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', async () => {
    if (deleteTargetId == null) return;

    try {
      await deleteExpense(deleteTargetId);
      showToast('Gasto eliminado', 'El gasto se elimino correctamente');
      document.getElementById('delete-dialog').close();
      deleteTargetId = null;
      await loadExpenses();
    } catch (error) {
      showToast('Error', 'No se pudo eliminar el gasto', 'error');
      console.error(error);
    }
  });
}
