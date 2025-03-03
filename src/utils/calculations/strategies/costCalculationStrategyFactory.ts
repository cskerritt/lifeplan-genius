import { CostCalculationStrategy } from './costCalculationStrategy';
import { OneTimeCostStrategy } from './oneTimeCostStrategy';
import { RecurringCostStrategy } from './recurringCostStrategy';
import { AgeIncrementCostStrategy } from './ageIncrementCostStrategy';
import { CostCalculationParams } from '../types';
import { AgeIncrement } from '../../../types/lifecare';
import frequencyParser from '../frequencyParser';

/**
 * Factory for creating cost calculation strategies
 */
export class CostCalculationStrategyFactory {
  /**
   * Create the appropriate strategy based on the parameters
   * @param params - The calculation parameters
   * @returns The appropriate strategy
   */
  static createStrategy(params: CostCalculationParams & { ageIncrements?: AgeIncrement[] }): CostCalculationStrategy {
    // If age increments are provided, use the age increment strategy
    if (params.ageIncrements && params.ageIncrements.length > 0) {
      return new AgeIncrementCostStrategy();
    }
    
    // If frequency is provided, check if it's a one-time item
    if (params.frequency) {
      const parsedFrequency = frequencyParser.parseFrequency(params.frequency);
      if (parsedFrequency.valid && parsedFrequency.isOneTime) {
        return new OneTimeCostStrategy();
      }
      
      // Otherwise, it's a recurring item
      return new RecurringCostStrategy();
    }
    
    // Default to recurring strategy
    return new RecurringCostStrategy();
  }
}
