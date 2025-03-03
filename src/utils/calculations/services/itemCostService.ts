import { CostCalculationParams, CalculatedCosts } from '../types';
import calculationLogger from '../logger';
import { validateCostCalculationParams } from '../validation';
import { AgeIncrement } from '@/types/lifecare';
import { CostCalculationStrategyFactory } from '../strategies/costCalculationStrategyFactory';
import { handleCalculationError } from '../utilities/errorUtils';

/**
 * Default life expectancy when not provided
 */
export const DEFAULT_LIFE_EXPECTANCY = 30.5;

/**
 * Calculates costs for an item based on frequency, duration, and other factors
 * @param params - The calculation parameters
 * @returns A promise resolving to the calculated costs
 */
export const calculateItemCosts = async (params: CostCalculationParams): Promise<CalculatedCosts> => {
  const logger = calculationLogger.createContext('calculateItemCosts');
  logger.info('Calculating item costs', params);
  
  try {
    // Validate input parameters
    const validationResult = validateCostCalculationParams(params);
    if (!validationResult.valid) {
      logger.error(`Invalid calculation parameters: ${validationResult.errors.join(', ')}`);
      throw new Error(`Invalid calculation parameters: ${validationResult.errors.join(', ')}`);
    }
    
    // Handle warnings
    if (validationResult.warnings.length > 0) {
      logger.warn(`Parameter warnings: ${validationResult.warnings.join(', ')}`);
    }
    
    // Create the appropriate strategy based on the parameters
    const strategy = CostCalculationStrategyFactory.createStrategy(params);
    
    // Execute the strategy
    return await strategy.calculate(params);
  } catch (error) {
    return handleCalculationError(
      logger,
      'calculating item costs',
      error,
      {
        annual: 0,
        lifetime: 0,
        low: 0,
        high: 0,
        average: 0,
        isOneTime: false
      }
    );
  }
};

/**
 * Calculates costs for an item based on age increments
 * @param params - The calculation parameters including age increments
 * @returns A promise resolving to the calculated costs
 */
export const calculateItemCostsWithAgeIncrements = async (
  params: CostCalculationParams & { ageIncrements: AgeIncrement[] }
): Promise<CalculatedCosts> => {
  const logger = calculationLogger.createContext('calculateItemCostsWithAgeIncrements');
  logger.info('Calculating item costs with age increments', params);
  
  try {
    // Create the age increment strategy
    const strategy = CostCalculationStrategyFactory.createStrategy(params);
    
    // Execute the strategy
    return await strategy.calculate(params);
  } catch (error) {
    return handleCalculationError(
      logger,
      'calculating item costs with age increments',
      error,
      {
        annual: 0,
        lifetime: 0,
        low: 0,
        high: 0,
        average: 0,
        isOneTime: false
      }
    );
  }
};

export default {
  DEFAULT_LIFE_EXPECTANCY,
  calculateItemCosts,
  calculateItemCostsWithAgeIncrements
};
