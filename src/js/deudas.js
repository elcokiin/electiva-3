/**
 * Deudas (Debts) Page Logic
 * Handles: add/delete debts, payments (abonos), debt list rendering with tabs
 */

import {
  addDebt,
  getDebts,
  getDebtById,
  deleteDebt,
  addPayment,
  getDebtPaidAmount,
  getDebtRemainingAmount,
} from './db.js';
import { formatCOP } from './currency.js';
import { showToast, formatDate, getTodayISO } from './layout.js';

let deleteTargetId = null;
let currentPaymentDebt = null;

window.addEventListener('appReady', () => {
  initDeudasPage();
});

async function initDeudasPage() {
  setupDebtForm();
  setupPaymentForm();
  setupDeleteConfirmation();
  setDefaultDates();
  await loadDebts();
}

function setDefaultDates() {
  const debtDate = document.getElementById('debt-date');
  const paymentDate = document.getElementById('payment-date');
  if (debtDate) debtDate.value = getTodayISO();
  if (paymentDate) paymentDate.value = getTodayISO();
}

/**
 * Setup add debt form
 */
function setupDebtForm() {
  const saveBtn = document.getElementById('save-debt-btn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const type = document.getElementById('debt-type').value;
    const entity = document.getElementById('debt-entity').value.trim();
    const totalAmount = Number(document.getElementById('debt-amount').value);
    const priority = document.getElementById('debt-priority').value;
    const createdDate = document.getElementById('debt-date').value;
    const notes = document.getElementById('debt-notes').value.trim();

    // Validation
    if (!entity) {
      showToast('Error', 'Ingresa el nombre de la entidad o persona', 'error');
      return;
    }
    if (!totalAmount || totalAmount <= 0) {
      showToast('Error', 'El monto debe ser mayor a 0', 'error');
      return;
    }
    if (!createdDate) {
      showToast('Error', 'Selecciona la fecha de la deuda', 'error');
      return;
    }

    try {
      await addDebt({
        type,
        entity,
        totalAmount,
        priority,
        createdDate,
        notes,
        payments: [],
      });

      showToast(
        'Deuda registrada',
        `${formatCOP(totalAmount)} - ${entity}`
      );

      document.getElementById('add-debt-dialog').close();
      document.getElementById('add-debt-form').reset();
      document.getElementById('debt-date').value = getTodayISO();
      document.getElementById('debt-priority').value = 'media';
      await loadDebts();
    } catch (error) {
      showToast('Error', 'No se pudo registrar la deuda', 'error');
      console.error(error);
    }
  });
}

/**
 * Setup payment form
 */
function setupPaymentForm() {
  const saveBtn = document.getElementById('save-payment-btn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', async () => {
    const debtId = Number(document.getElementById('payment-debt-id').value);
    const amount = Number(document.getElementById('payment-amount').value);
    const date = document.getElementById('payment-date').value;

    if (!amount || amount <= 0) {
      showToast('Error', 'El monto del abono debe ser mayor a 0', 'error');
      return;
    }
    if (!date) {
      showToast('Error', 'Selecciona la fecha del abono', 'error');
      return;
    }

    // Check that payment doesn't exceed remaining amount
    if (currentPaymentDebt) {
      const remaining = getDebtRemainingAmount(currentPaymentDebt);
      if (amount > remaining) {
        showToast('Error', `El abono no puede ser mayor al saldo restante (${formatCOP(remaining)})`, 'error');
        return;
      }
    }

    try {
      await addPayment(debtId, { amount, date });
      showToast('Abono registrado', `${formatCOP(amount)} abonado exitosamente`);
      document.getElementById('payment-dialog').close();
      document.getElementById('payment-amount').value = '';
      document.getElementById('payment-date').value = getTodayISO();
      await loadDebts();
    } catch (error) {
      showToast('Error', 'No se pudo registrar el abono', 'error');
      console.error(error);
    }
  });
}

/**
 * Setup delete confirmation
 */
function setupDeleteConfirmation() {
  const confirmBtn = document.getElementById('confirm-delete-debt-btn');
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', async () => {
    if (deleteTargetId == null) return;

    try {
      await deleteDebt(deleteTargetId);
      showToast('Deuda eliminada', 'La deuda se elimino correctamente');
      document.getElementById('delete-debt-dialog').close();
      deleteTargetId = null;
      await loadDebts();
    } catch (error) {
      showToast('Error', 'No se pudo eliminar la deuda', 'error');
      console.error(error);
    }
  });
}

/**
 * Load and render all debts
 */
async function loadDebts() {
  try {
    const receivable = await getDebts('receivable');
    const payable = await getDebts('payable');

    // Update summary cards
    const receivableTotal = receivable.reduce(
      (sum, d) => sum + getDebtRemainingAmount(d),
      0
    );
    const payableTotal = payable.reduce(
      (sum, d) => sum + getDebtRemainingAmount(d),
      0
    );

    const rTotalEl = document.getElementById('debt-receivable-total');
    const pTotalEl = document.getElementById('debt-payable-total');
    const rCountEl = document.getElementById('debt-receivable-count');
    const pCountEl = document.getElementById('debt-payable-count');

    if (rTotalEl) rTotalEl.textContent = formatCOP(receivableTotal);
    if (pTotalEl) pTotalEl.textContent = formatCOP(payableTotal);
    if (rCountEl) rCountEl.textContent = `${receivable.length} deuda${receivable.length !== 1 ? 's' : ''}`;
    if (pCountEl) pCountEl.textContent = `${payable.length} deuda${payable.length !== 1 ? 's' : ''}`;

    renderDebtList(receivable, 'receivable');
    renderDebtList(payable, 'payable');
  } catch (error) {
    console.error('Error loading debts:', error);
  }
}

/**
 * Render debt list for a given type
 * @param {Array} debts
 * @param {'receivable'|'payable'} type
 */
function renderDebtList(debts, type) {
  const tableBody = document.getElementById(`${type}-table-body`);
  const cardsContainer = document.getElementById(`${type}-cards`);
  const empty = document.getElementById(`${type}-empty`);

  if (debts.length === 0) {
    if (tableBody) tableBody.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    return;
  }

  if (empty) empty.style.display = 'none';

  // Desktop table rows
  if (tableBody) {
    tableBody.innerHTML = debts
      .map((debt) => {
        const paid = getDebtPaidAmount(debt);
        const remaining = getDebtRemainingAmount(debt);
        const lastPayment = debt.payments?.length
          ? debt.payments[debt.payments.length - 1]
          : null;

        return `
        <tr>
          <td class="font-medium">${debt.entity}</td>
          <td>${formatCOP(debt.totalAmount)}</td>
          <td>${formatCOP(paid)}</td>
          <td class="font-semibold">${formatCOP(remaining)}</td>
          <td>
            <span class="badge badge-sm priority-${debt.priority}">${capitalizeFirst(debt.priority)}</span>
          </td>
          <td class="text-muted-foreground">${formatDate(debt.createdDate)}</td>
          <td>
            <div class="flex gap-1">
              <button class="btn-ghost btn-sm payment-btn" data-id="${debt.id}" aria-label="Abonar">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </button>
              <button class="btn-ghost btn-sm delete-debt-btn" data-id="${debt.id}" aria-label="Eliminar">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    attachDebtEventListeners(tableBody);
  }

  // Mobile cards
  if (cardsContainer) {
    cardsContainer.innerHTML = debts
      .map((debt) => {
        const paid = getDebtPaidAmount(debt);
        const remaining = getDebtRemainingAmount(debt);

        return `
        <div class="debt-card">
          <div class="debt-card-header">
            <span class="debt-card-entity">${debt.entity}</span>
            <span class="badge badge-sm priority-${debt.priority}">${capitalizeFirst(debt.priority)}</span>
          </div>
          <div class="debt-card-grid">
            <div>
              <div class="debt-card-label">Monto Total</div>
              <div class="font-medium">${formatCOP(debt.totalAmount)}</div>
            </div>
            <div>
              <div class="debt-card-label">Abonado</div>
              <div>${formatCOP(paid)}</div>
            </div>
            <div>
              <div class="debt-card-label">Restante</div>
              <div class="font-semibold">${formatCOP(remaining)}</div>
            </div>
            <div>
              <div class="debt-card-label">Fecha</div>
              <div class="text-muted-foreground">${formatDate(debt.createdDate)}</div>
            </div>
          </div>
          <div class="flex gap-2 mt-3">
            <button class="btn-outline btn-sm flex-1 payment-btn" data-id="${debt.id}">
              Abonar
            </button>
            <button class="btn-ghost btn-sm delete-debt-btn" data-id="${debt.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    attachDebtEventListeners(cardsContainer);
  }
}

/**
 * Attach event listeners to debt action buttons
 */
function attachDebtEventListeners(container) {
  container.querySelectorAll('.payment-btn').forEach((btn) => {
    btn.addEventListener('click', () => openPaymentDialog(Number(btn.dataset.id)));
  });

  container.querySelectorAll('.delete-debt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteTargetId = Number(btn.dataset.id);
      document.getElementById('delete-debt-dialog').showModal();
    });
  });
}

/**
 * Open payment dialog for a debt
 */
async function openPaymentDialog(debtId) {
  try {
    const debt = await getDebtById(debtId);
    if (!debt) return;

    currentPaymentDebt = debt;
    const remaining = getDebtRemainingAmount(debt);

    document.getElementById('payment-debt-id').value = debtId;
    document.getElementById('payment-dialog-subtitle').textContent =
      `${debt.entity} - Restante: ${formatCOP(remaining)}`;
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-amount').max = remaining;
    document.getElementById('payment-date').value = getTodayISO();

    // Show payment history
    const historySection = document.getElementById('payment-history-section');
    const historyList = document.getElementById('payment-history-list');

    if (debt.payments && debt.payments.length > 0) {
      historySection.style.display = 'block';
      historyList.innerHTML = debt.payments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(
          (p) => `
        <div class="flex justify-between py-1 border-b border-border last:border-b-0">
          <span class="text-muted-foreground">${formatDate(p.date)}</span>
          <span class="font-medium">${formatCOP(p.amount)}</span>
        </div>
      `
        )
        .join('');
    } else {
      historySection.style.display = 'none';
    }

    document.getElementById('payment-dialog').showModal();
  } catch (error) {
    console.error('Error opening payment dialog:', error);
  }
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
