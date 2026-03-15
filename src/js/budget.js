/**
 * Budget Page Logic
 * Handles: budget setting per category, budget vs actual overview, chart
 */

import { setBudget, getBudgets, getExpenses } from './db.js';
import { getCategories, getCategoryById } from './categories.js';
import { formatCOP } from './currency.js';
import { showToast, getCurrentMonthYear } from './layout.js';
import {
  createBarChart,
  destroyChart,
  getThemeColors,
  setAlpha,
} from './charts.js';

let budgetChart = null;

window.addEventListener('appReady', () => {
  initBudgetPage();
});

async function initBudgetPage() {
  setupMonthYearSelector();
  setupBudgetForm();
  await loadBudgetData();

  // Re-render chart on theme change
  window.addEventListener('themeChanged', () => {
    loadBudgetData();
  });
}

/**
 * Setup month/year selector
 */
function setupMonthYearSelector() {
  const monthSelect = document.getElementById('budget-month');
  const yearSelect = document.getElementById('budget-year');

  if (!monthSelect || !yearSelect) return;

  const { month, year } = getCurrentMonthYear();

  // Populate years (current year - 1 to current year + 1)
  for (let y = year - 1; y <= year + 1; y++) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    if (y === year) option.selected = true;
    yearSelect.appendChild(option);
  }

  monthSelect.value = month;

  monthSelect.addEventListener('change', loadBudgetData);
  yearSelect.addEventListener('change', loadBudgetData);
}

/**
 * Get selected month and year
 */
function getSelectedPeriod() {
  const month = Number(document.getElementById('budget-month')?.value ?? new Date().getMonth());
  const year = Number(document.getElementById('budget-year')?.value ?? new Date().getFullYear());
  return { month, year };
}

/**
 * Setup budget form with all category fields
 */
function setupBudgetForm() {
  const fieldsContainer = document.getElementById('budget-fields');
  const form = document.getElementById('budget-form');
  if (!fieldsContainer || !form) return;

  const categories = getCategories();

  fieldsContainer.innerHTML = categories
    .map(
      (cat) => `
    <div class="flex items-center gap-3 py-2">
      <div class="flex items-center gap-2 w-36 flex-shrink-0">
        <span style="color: ${cat.color}">${cat.icon}</span>
        <span class="text-sm font-medium">${cat.name}</span>
      </div>
      <input
        type="number"
        min="0"
        step="1000"
        placeholder="0"
        class="input text-sm h-9 flex-1"
        id="budget-${cat.id}"
        data-category="${cat.id}"
      />
    </div>
  `
    )
    .join('');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveBudgets();
  });
}

/**
 * Save all budget values
 */
async function saveBudgets() {
  const { month, year } = getSelectedPeriod();
  const categories = getCategories();
  let savedCount = 0;

  try {
    for (const cat of categories) {
      const input = document.getElementById(`budget-${cat.id}`);
      const amount = Number(input?.value || 0);

      if (amount > 0) {
        await setBudget({ category: cat.id, amount, month, year });
        savedCount++;
      }
    }

    if (savedCount > 0) {
      showToast('Presupuesto guardado', `Se guardaron ${savedCount} categorias`);
    } else {
      showToast('Aviso', 'No se establecio ningun presupuesto', 'warning');
    }

    await loadBudgetData();
  } catch (error) {
    showToast('Error', 'No se pudo guardar el presupuesto', 'error');
    console.error(error);
  }
}

/**
 * Load budget data and render overview + chart
 */
async function loadBudgetData() {
  const { month, year } = getSelectedPeriod();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const summaryPeriod = document.getElementById('budget-summary-period');
  if (summaryPeriod) {
    summaryPeriod.textContent = `${monthNames[month]} ${year}`;
  }

  try {
    const budgets = await getBudgets(month, year);
    const expenses = await getExpenses({ month, year });

    // Fill form fields with existing budgets
    const categories = getCategories();
    categories.forEach((cat) => {
      const input = document.getElementById(`budget-${cat.id}`);
      const budget = budgets.find((b) => b.category === cat.id);
      if (input) {
        input.value = budget ? budget.amount : '';
      }
    });

    // Calculate spent per category
    const spentByCategory = {};
    expenses.forEach((e) => {
      spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
    });

    renderBudgetOverview(budgets, spentByCategory);
    renderBudgetChart(budgets, spentByCategory);
  } catch (error) {
    console.error('Error loading budget data:', error);
  }
}

/**
 * Render budget overview with progress bars
 */
function renderBudgetOverview(budgets, spentByCategory) {
  const list = document.getElementById('budget-overview-list');
  const empty = document.getElementById('budget-empty');

  if (!list) return;

  if (budgets.length === 0) {
    list.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    return;
  }

  list.style.display = 'block';
  if (empty) empty.style.display = 'none';

  list.innerHTML = budgets
    .map((budget) => {
      const cat = getCategoryById(budget.category);
      const spent = spentByCategory[budget.category] || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
      const colorClass = percentage < 75 ? 'green' : percentage < 90 ? 'yellow' : 'red';

      return `
      <div class="py-3 border-b border-border last:border-b-0">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <span style="color: ${cat?.color || 'var(--muted-foreground)'}">${cat?.icon || ''}</span>
            <span class="text-sm font-medium">${cat?.name || budget.category}</span>
          </div>
          <span class="text-sm font-semibold ${remaining < 0 ? 'text-red-500' : ''}">${formatCOP(remaining)}</span>
        </div>
        <div class="budget-progress-bar">
          <div class="budget-progress-fill ${colorClass}" style="width: ${percentage}%"></div>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-xs text-muted-foreground">Gastado: ${formatCOP(spent)}</span>
          <span class="text-xs text-muted-foreground">Presupuesto: ${formatCOP(budget.amount)}</span>
        </div>
      </div>
    `;
    })
    .join('');
}

/**
 * Render budget vs actual bar chart
 */
function renderBudgetChart(budgets, spentByCategory) {
  const canvas = document.getElementById('chart-budget-comparison');
  if (!canvas) return;

  destroyChart(budgetChart);

  if (budgets.length === 0) {
    canvas.style.display = 'none';
    return;
  }
  canvas.style.display = 'block';

  const colors = getThemeColors();
  const labels = budgets.map((b) => getCategoryById(b.category)?.name || b.category);
  const budgetData = budgets.map((b) => b.amount);
  const actualData = budgets.map((b) => spentByCategory[b.category] || 0);

  budgetChart = createBarChart(canvas, {
    labels,
    datasets: [
      {
        label: 'Presupuesto',
        data: budgetData,
        backgroundColor: setAlpha(colors.chart2, 0.7),
        borderColor: colors.chart2,
        borderWidth: 1,
      },
      {
        label: 'Gastado',
        data: actualData,
        backgroundColor: setAlpha(colors.chart1, 0.7),
        borderColor: colors.chart1,
        borderWidth: 1,
      },
    ],
  }, {
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: colors.foreground,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCOP(ctx.raw)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCOP(value),
        },
      },
    },
  });
}
