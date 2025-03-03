import Decimal from 'decimal.js';
import { CostRange } from '../types';
import calculationLogger from '../logger';
import { validateCostRange } from '../validation';

/**
 * Calculates costs from multiple sources and provides statistical measures
 * @param resources - Array of cost resources
 * @returns A cost range with low, average, and high values
 */
export const calculateMultiSourceCosts = (resources: { cost: number }[]): CostRange => {
  const logger = calculationLogger.createContext('calculateMultiSourceCosts');
  logger.info(`Calculating costs from ${resources.length} sources`);
  
  if (!resources.length) {
    logger.warn('No resources provided for cost calculation');
    return { low: 0, average: 0, high: 0 };
  }
  
  // Convert all costs to Decimal for precise calculations
  const costs = resources.map(r => new Decimal(r.cost));
  const sortedCosts = costs.sort((a, b) => a.minus(b).toNumber());
  
  // Calculate statistical measures
  const n = sortedCosts.length;
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  
  const low = sortedCosts[0];
  const high = sortedCosts[n - 1];
  const median = n % 2 === 0 
    ? sortedCosts[n/2 - 1].plus(sortedCosts[n/2]).dividedBy(2)
    : sortedCosts[Math.floor(n/2)];
  
  // Calculate IQR for outlier detection
  const q1 = sortedCosts[q1Index];
  const q3 = sortedCosts[q3Index];
  const iqr = q3.minus(q1);
  const lowerBound = q1.minus(iqr.times(1.5));
  const upperBound = q3.plus(iqr.times(1.5));
  
  // Filter out outliers
  const validCosts = sortedCosts.filter(cost => 
    cost.gte(lowerBound) && cost.lte(upperBound)
  );
  
  // Calculate average of valid costs
  const average = validCosts.reduce((sum, cost) => sum.plus(cost), new Decimal(0))
    .dividedBy(validCosts.length);
  
  // Round to 2 decimal places
  const result: CostRange = {
    low: low.toDP(2).toNumber(),
    average: average.toDP(2).toNumber(),
    high: high.toDP(2).toNumber()
  };
  
  logger.info('Calculated multi-source costs', result);
  
  // Validate the result
  const validationResult = validateCostRange(result);
  if (!validationResult.valid) {
    logger.error(`Invalid cost range: ${validationResult.errors.join(', ')}`);
  }
  
  if (validationResult.warnings.length > 0) {
    logger.warn(`Cost range warnings: ${validationResult.warnings.join(', ')}`);
  }
  
  return result;
};

export default {
  calculateMultiSourceCosts
};
