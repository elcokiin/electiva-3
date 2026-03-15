/**
 * COP Currency Formatting Utility
 * Formats numbers as Colombian Pesos: $300.000
 */

/**
 * Format a number as COP currency string
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string like "$300.000"
 */
export function formatCOP(amount) {
  if (amount == null || isNaN(amount)) return '$0';

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return isNegative ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Parse a COP formatted string back to a number
 * @param {string} str - The formatted string like "$300.000"
 * @returns {number} The numeric value
 */
export function parseCOP(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Format a number as a compact COP string for display in charts
 * @param {number} amount
 * @returns {string} e.g., "$1.2M", "$500K", "$300.000"
 */
export function formatCOPCompact(amount) {
  if (amount == null || isNaN(amount)) return '$0';

  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  let formatted;

  if (absAmount >= 1_000_000) {
    formatted = `$${(absAmount / 1_000_000).toFixed(1)}M`;
  } else if (absAmount >= 100_000) {
    formatted = `$${(absAmount / 1_000).toFixed(0)}K`;
  } else {
    formatted = formatCOP(amount);
    return formatted;
  }

  return isNegative ? `-${formatted}` : formatted;
}
