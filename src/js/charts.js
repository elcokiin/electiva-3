/**
 * Chart.js Helper Utilities
 * Provides theme-aware colors, alpha helpers, and chart configuration factories
 */

import Chart from 'chart.js/auto';

/**
 * Get computed theme colors from CSS custom properties
 * @returns {object} Theme color values
 */
export function getThemeColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    background: cs.getPropertyValue('--background').trim(),
    foreground: cs.getPropertyValue('--foreground').trim(),
    border: cs.getPropertyValue('--border').trim(),
    mutedForeground: cs.getPropertyValue('--muted-foreground').trim(),
    primary: cs.getPropertyValue('--primary').trim(),
    chart1: cs.getPropertyValue('--chart-1').trim(),
    chart2: cs.getPropertyValue('--chart-2').trim(),
    chart3: cs.getPropertyValue('--chart-3').trim(),
    chart4: cs.getPropertyValue('--chart-4').trim(),
    chart5: cs.getPropertyValue('--chart-5').trim(),
    cardForeground: cs.getPropertyValue('--card-foreground').trim(),
  };
}

/**
 * Set alpha on an oklch color string
 * @param {string} colorString - oklch() color
 * @param {number} alphaFactor - Alpha value (0-1)
 * @returns {string} oklch with alpha
 */
export function setAlpha(colorString, alphaFactor) {
  if (!colorString) return `oklch(0.5 0 0 / ${alphaFactor})`;

  const match = colorString.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)/
  );
  if (!match) return colorString;

  const [, l, c, h] = match;
  return `oklch(${l} ${c} ${h} / ${alphaFactor})`;
}

/**
 * Get an array of chart colors for datasets
 * @param {number} count - Number of colors needed
 * @returns {string[]} Array of oklch color strings
 */
export function getChartColorPalette(count) {
  const colors = getThemeColors();
  const palette = [
    colors.chart1,
    colors.chart2,
    colors.chart3,
    colors.chart4,
    colors.chart5,
    'oklch(0.65 0.18 150)',
    'oklch(0.55 0.15 230)',
    'oklch(0.60 0.20 330)',
    'oklch(0.70 0.15 160)',
    'oklch(0.65 0.12 60)',
    'oklch(0.55 0.10 250)',
    'oklch(0.50 0.05 100)',
  ];

  // If more colors needed than palette, cycle
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(palette[i % palette.length]);
  }
  return result;
}

/**
 * Default chart options matching basecoat theme
 * @returns {object} Chart.js options
 */
export function getDefaultChartOptions() {
  const colors = getThemeColors();

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      y: {
        border: { display: false },
        grid: { color: setAlpha(colors.border, 0.5) },
        ticks: {
          color: colors.mutedForeground,
          font: { size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: colors.mutedForeground,
          font: { size: 11 },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: colors.foreground,
        titleColor: colors.background,
        bodyColor: colors.background,
        borderColor: setAlpha(colors.border, 0.3),
        borderWidth: 1,
        cornerRadius: 6,
        padding: 8,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 11 },
      },
    },
  };
}

/**
 * Create a bar chart
 * @param {HTMLCanvasElement} canvas
 * @param {object} config - { labels, datasets }
 * @param {object} [extraOptions] - Additional chart options
 * @returns {Chart}
 */
export function createBarChart(canvas, config, extraOptions = {}) {
  const defaults = getDefaultChartOptions();

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: config.labels,
      datasets: config.datasets.map((ds, i) => ({
        borderRadius: 4,
        barPercentage: 0.7,
        ...ds,
      })),
    },
    options: deepMerge(defaults, extraOptions),
  });
}

/**
 * Create a doughnut chart
 * @param {HTMLCanvasElement} canvas
 * @param {object} config - { labels, data, colors }
 * @param {object} [extraOptions]
 * @returns {Chart}
 */
export function createDoughnutChart(canvas, config, extraOptions = {}) {
  const chartColors = config.colors || getChartColorPalette(config.labels.length);

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: config.labels,
      datasets: [
        {
          data: config.data,
          backgroundColor: chartColors.map((c) => setAlpha(c, 0.8)),
          borderColor: chartColors,
          borderWidth: 1,
        },
      ],
    },
    options: deepMerge(
      {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: getThemeColors().foreground,
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 8,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: getThemeColors().foreground,
            titleColor: getThemeColors().background,
            bodyColor: getThemeColors().background,
            cornerRadius: 6,
            padding: 8,
          },
        },
      },
      extraOptions
    ),
  });
}

/**
 * Create a line chart
 * @param {HTMLCanvasElement} canvas
 * @param {object} config - { labels, datasets }
 * @param {object} [extraOptions]
 * @returns {Chart}
 */
export function createLineChart(canvas, config, extraOptions = {}) {
  const defaults = getDefaultChartOptions();

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: config.labels,
      datasets: config.datasets.map((ds) => ({
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: false,
        ...ds,
      })),
    },
    options: deepMerge(defaults, extraOptions),
  });
}

/**
 * Destroy a chart safely
 * @param {Chart|null} chart
 */
export function destroyChart(chart) {
  if (chart && typeof chart.destroy === 'function') {
    chart.destroy();
  }
}

/**
 * Simple deep merge utility
 */
function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export { Chart };
