/**
 * Formats a number as currency
 * @param value The number to format
 * @returns A formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formats a cost range as a string
 * @param low The low end of the range
 * @param high The high end of the range
 * @returns A formatted cost range string
 */
export const formatCostRange = (low: number, high: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${formatter.format(low)} - ${formatter.format(high)}`;
};

/**
 * Formats a cost range with average as a string
 * @param low The low end of the range
 * @param average The average cost
 * @param high The high end of the range
 * @returns A formatted cost range string with average
 */
export const formatCostRangeWithAverage = (low: number, average: number, high: number): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${formatter.format(low)} | ${formatter.format(average)} | ${formatter.format(high)}`;
}; 