import { CostCalculationParams, CalculatedCosts } from '../types';

/**
 * Interface for cost calculation strategies
 */
export interface CostCalculationStrategy {
  /**
   * Calculate costs based on the provided parameters
   * @param params - The calculation parameters
   * @returns A promise resolving to the calculated costs
   */
  calculate(params: CostCalculationParams): Promise<CalculatedCosts>;
}
