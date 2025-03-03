import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

/**
 * Debug utility function for logging with a consistent prefix
 */
export const debugLog = (message: string, data?: any) => {
  const prefix = '[ItemCalculationDetails Debug]';
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: number) => {
  if (isNaN(value) || value === null || value === undefined) return "$0.00";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

/**
 * Helper function to safely format numbers as currency
 */
export const safeFormat = (value: any) => {
  if (value === undefined || value === null || isNaN(Number(value))) return "$0.00";
  return formatCurrency(Number(value));
};

/**
 * Helper function to safely format decimal numbers
 */
export const safeFormatDecimal = (value: any, decimals: number = 4) => {
  if (value === undefined || value === null || isNaN(Number(value))) return "0.0000";
  return Number(value).toFixed(decimals);
};
