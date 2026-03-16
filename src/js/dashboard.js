/**
 * Dashboard Page Logic
 * Handles: summary cards, charts (budget vs actual, distribution, trend)
 */

import { getExpenses, getBudgets, getDebts, getDebtRemainingAmount } from './db.js';
import { getCategories, getCategoryById } from './categories.js';
import { formatCOP, formatCOPCompact } from './currency.js';
import { getCurrentMonthYear } from './layout.js';
import {
  createBarChart,
  createDoughnutChart,
  createLineChart,
  destroyChart,
  getThemeColors,
  setAlpha,
  getChartColorPalette,
} from './charts.js';

let chartBudgetVsActual = null;
let chartDistribution = null;
let chartTrend = null;

window.addEventListener('appReady', () => {
  initDashboard();
});

async function initDashboard() {
  await loadDashboardData();

  // Re-render charts on theme change
  window.addEventListener('themeChanged', () => {
    loadDashboardData();
  });
}

/**
 * Load all dashboard data and render
 */
async function loadDashboardData() {
  const { month, year, label } = getCurrentMonthYear();

  // Update period label
  const periodEl = document.getElementById('current-period');
  if (periodEl) periodEl.textContent = label;

  try {
    const [expenses, budgets, receivableDebts, payableDebts] = await Promise.all([
      getExpenses({ month, year }),
      getBudgets(month, year),
      getDebts('receivable'),
      getDebts('payable'),
    ]);

    updateSummaryCards(expenses, budgets);
    updateDebtSummary(receivableDebts, payableDebts);
    renderBudgetVsActualChart(budgets, expenses);
    renderDistributionChart(expenses);
    await renderTrendChart();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

/**
 * Update the summary cards
 */
function updateSummaryCards(expenses, budgets) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const remaining = totalBudget - totalSpent;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const dailyAvg = currentDay > 0 ? totalSpent / currentDay : 0;

  const totalSpentEl = document.getElementById('total-spent');
  const budgetRemainingEl = document.getElementById('budget-remaining');
  const dailyAvgEl = document.getElementById('daily-avg');
  const txCountEl = document.getElementById('tx-count');

  if (totalSpentEl) totalSpentEl.textContent = formatCOP(totalSpent);
  if (budgetRemainingEl) {
    budgetRemainingEl.textContent = totalBudget > 0 ? formatCOP(remaining) : 'Sin presupuesto';
    if (remaining < 0 && totalBudget > 0) {
      budgetRemainingEl.style.color = 'oklch(0.55 0.20 25)';
    }
  }
  if (dailyAvgEl) dailyAvgEl.textContent = formatCOP(Math.round(dailyAvg));
  if (txCountEl) txCountEl.textContent = expenses.length.toString();
}

/**
 * Update debt summary cards on dashboard
 */
function updateDebtSummary(receivable, payable) {
  const receivableTotal = receivable.reduce(
    (sum, d) => sum + getDebtRemainingAmount(d),
    0
  );
  const payableTotal = payable.reduce(
    (sum, d) => sum + getDebtRemainingAmount(d),
    0
  );

  const rEl = document.getElementById('total-receivable');
  const pEl = document.getElementById('total-payable');
  const rCount = document.getElementById('receivable-count');
  const pCount = document.getElementById('payable-count');

  if (rEl) rEl.textContent = formatCOP(receivableTotal);
  if (pEl) pEl.textContent = formatCOP(payableTotal);
  if (rCount) rCount.textContent = `${receivable.length} deuda${receivable.length !== 1 ? 's' : ''} pendiente${receivable.length !== 1 ? 's' : ''}`;
  if (pCount) pCount.textContent = `${payable.length} deuda${payable.length !== 1 ? 's' : ''} pendiente${payable.length !== 1 ? 's' : ''}`;
}

/**
 * Render Budget vs Actual bar chart
 */
function renderBudgetVsActualChart(budgets, expenses) {
  const canvas = document.getElementById('chart-budget-vs-actual');
  const emptyState = document.getElementById('budget-chart-empty');
  if (!canvas) return;

  destroyChart(chartBudgetVsActual);

  if (budgets.length === 0 && expenses.length === 0) {
    canvas.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  canvas.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  // Get categories that have either budget or expenses
  const spentByCategory = {};
  expenses.forEach((e) => {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
  });

  const categoryIds = new Set([
    ...budgets.map((b) => b.category),
    ...Object.keys(spentByCategory),
  ]);

  const labels = [];
  const budgetData = [];
  const actualData = [];

  categoryIds.forEach((catId) => {
    const cat = getCategoryById(catId);
    labels.push(cat?.name || catId);
    budgetData.push(budgets.find((b) => b.category === catId)?.amount || 0);
    actualData.push(spentByCategory[catId] || 0);
  });

  const colors = getThemeColors();

  chartBudgetVsActual = createBarChart(canvas, {
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
          callback: (value) => formatCOPCompact(value),
        },
      },
    },
  });
}

/**
 * Render expense distribution doughnut chart
 */
function renderDistributionChart(expenses) {
  const canvas = document.getElementById('chart-distribution');
  const emptyState = document.getElementById('distribution-chart-empty');
  if (!canvas) return;

  destroyChart(chartDistribution);

  if (expenses.length === 0) {
    canvas.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  canvas.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  // Aggregate by category
  const byCategory = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const labels = entries.map(([catId]) => getCategoryById(catId)?.name || catId);
  const data = entries.map(([, amount]) => amount);
  const chartColors = entries.map(([catId]) => {
    const cat = getCategoryById(catId);
    const rawColor = cat?.color || 'var(--muted-foreground)';

    if (!rawColor.startsWith('var(')) return rawColor;

    const varName = rawColor.slice(4, -1).trim();
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();

    return resolved || rawColor;
  });

  const totalAmount = data.reduce((sum, amount) => sum + amount, 0);
  const colors = getThemeColors();

  chartDistribution = createDoughnutChart(canvas, {
    labels,
    data,
    colors: chartColors,
  }, {
    cutout: '58%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: colors.foreground,
          usePointStyle: true,
          pointStyleWidth: 10,
          padding: 14,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = totalAmount > 0 ? ((ctx.raw / totalAmount) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: ${formatCOP(ctx.raw)} (${pct}%)`;
          },
        },
      },
    },
  });
}

/**
 * Render monthly trend line chart (last 6 months)
 */
async function renderTrendChart() {
  const canvas = document.getElementById('chart-trend');
  const emptyState = document.getElementById('trend-chart-empty');
  if (!canvas) return;

  destroyChart(chartTrend);

  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  const now = new Date();
  const labels = [];
  const spentData = [];
  const budgetData = [];
  let hasData = false;

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = date.getMonth();
    const y = date.getFullYear();

    labels.push(`${monthNames[m]} ${y.toString().slice(-2)}`);

    try {
      const expenses = await getExpenses({ month: m, year: y });
      const budgets = await getBudgets(m, y);

      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

      spentData.push(totalSpent);
      budgetData.push(totalBudget);

      if (totalSpent > 0 || totalBudget > 0) hasData = true;
    } catch {
      spentData.push(0);
      budgetData.push(0);
    }
  }

  if (!hasData) {
    canvas.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  canvas.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  const colors = getThemeColors();

  chartTrend = createLineChart(canvas, {
    labels,
    datasets: [
      {
        label: 'Gastado',
        data: spentData,
        borderColor: colors.chart1,
        backgroundColor: setAlpha(colors.chart1, 0.1),
        fill: true,
        borderWidth: 2,
      },
      {
        label: 'Presupuesto',
        data: budgetData,
        borderColor: colors.chart2,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        borderWidth: 2,
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
          callback: (value) => formatCOPCompact(value),
        },
      },
    },
  });
}
