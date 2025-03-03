/**
 * Centralized Calculation Utilities
 * 
 * This module provides a set of utilities for performing calculations in the Life Care Plan application.
 * It centralizes all calculation logic to ensure consistency, accuracy, and reliability.
 * 
 * Key features:
 * - Standardized frequency parsing with comprehensive regex patterns
 * - Decimal.js for all financial calculations to avoid floating-point errors
 * - Robust error handling with appropriate fallbacks
 * - Comprehensive validation for all inputs
 * - Standardized duration calculations with clear rules for default values
 * - Detailed logging for calculation steps
 * 
 * Usage:
 * ```typescript
 * import { calculateItemCosts, parseFrequency, determineDuration } from '@/utils/calculations';
 * 
 * // Calculate costs for an item
 * const costs = await calculateItemCosts({
 *   baseRate: 100,
 *   frequency: '3 times per week',
 *   currentAge: 45,
 *   lifeExpectancy: 35,
 * });
 * 
 * // Parse a frequency string
 * const frequency = parseFrequency('twice monthly');
 * 
 * // Determine duration based on available information
 * const duration = determineDuration('4x/year for 10 years', 45, 35);
 * ```
 */

// Export all utilities
export * from './types';
export { default as calculationLogger } from './logger';
export * from './validation';
export * from './frequencyParser';
export { default as frequencyParser } from './frequencyParser';
export * from './costCalculator';
export { default as costCalculator } from './costCalculator';
export * from './durationCalculator';
export { default as durationCalculator } from './durationCalculator';

// Export commonly used functions directly
import { parseFrequency, parseDuration, isOneTimeFrequency } from './frequencyParser';
import { calculateItemCosts, calculateItemCostsWithAgeIncrements, calculateAdjustedCosts } from './costCalculator';
import { determineDuration, calculateAgeFromDOB, calculateDurationFromAgeRange, calculateDurationFromAgeIncrements } from './durationCalculator';

export {
  // Frequency parsing
  parseFrequency,
  parseDuration,
  isOneTimeFrequency,
  
  // Cost calculations
  calculateItemCosts,
  calculateItemCostsWithAgeIncrements,
  calculateAdjustedCosts,
  
  // Duration calculations
  determineDuration,
  calculateAgeFromDOB,
  calculateDurationFromAgeRange,
  calculateDurationFromAgeIncrements,
};

/**
 * Main calculation function that combines frequency parsing, duration calculation, and cost calculation
 * @param params - The calculation parameters
 * @returns A promise resolving to the calculated costs
 */
export const calculateCosts = calculateItemCosts;
