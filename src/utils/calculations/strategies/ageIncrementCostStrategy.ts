import Decimal from 'decimal.js';
import { CostCalculationStrategy } from './costCalculationStrategy';
import { CostCalculationParams, CalculatedCosts } from '../types';
import { AgeIncrement } from '@/types/lifecare';
import calculationLogger from '../logger';
import frequencyParser from '../frequencyParser';
import { calculateDurationFromAgeIncrements } from '../durationCalculator';
import { BaseCostCalculationStrategy } from './baseCostCalculationStrategy';
import { RecurringCostStrategy } from './recurringCostStrategy';

/**
 * Strategy for calculating costs with age increments
 */
export class AgeIncrementCostStrategy extends BaseCostCalculationStrategy implements CostCalculationStrategy {
  /**
   * Calculate costs with age increments
   * @param params - The calculation parameters with age increments
   * @returns A promise resolving to the calculated costs
   */
  async calculate(params: CostCalculationParams & { ageIncrements?: AgeIncrement[] }): Promise<CalculatedCosts> {
    const logger = calculationLogger.createContext('AgeIncrementCostStrategy.calculate');
    logger.info('Calculating item costs with age increments', params);
    
    const { baseRate, cptCode, category, zipCode, ageIncrements } = params;
    
    try {
      // If no age increments, fall back to standard calculation
      if (!ageIncrements || ageIncrements.length === 0) {
        logger.warn('No age increments provided, falling back to standard calculation');
        // Use a different strategy for standard calculation
        const recurringStrategy = new RecurringCostStrategy();
        return recurringStrategy.calculate({
          baseRate,
          frequency: "1x per year",
          cptCode,
          category,
          zipCode
        });
      }
      
      // Get adjusted costs with geographic factors applied
      const { adjustedCostRange } = await this.getAdjustedCostsWithGeoFactors(params);
      
      // Calculate costs for each age increment
      let totalAnnualCost = new Decimal(0);
      let totalLifetimeCost = new Decimal(0);
      let totalLowCost = new Decimal(0);
      let totalHighCost = new Decimal(0);
      
      // Calculate total duration for annual cost averaging
      const totalDuration = calculateDurationFromAgeIncrements(ageIncrements);
      
      for (const increment of ageIncrements) {
        // Parse frequency for this increment
        const parsedFrequency = frequencyParser.parseFrequency(increment.frequency);
        if (!parsedFrequency.valid) {
          logger.warn(`Invalid frequency for age increment ${increment.startAge}-${increment.endAge}: ${parsedFrequency.error}`);
          continue;
        }
        
        // Calculate duration for this increment
        const duration = increment.endAge - increment.startAge;
        
        // Skip invalid increments
        if (duration <= 0) {
          logger.warn(`Invalid duration for age increment ${increment.startAge}-${increment.endAge}`);
          continue;
        }
        
        // Handle one-time items
        if (increment.isOneTime || parsedFrequency.isOneTime) {
          totalLifetimeCost = totalLifetimeCost.plus(adjustedCostRange.average);
          totalLowCost = totalLowCost.plus(adjustedCostRange.low);
          totalHighCost = totalHighCost.plus(adjustedCostRange.high);
          continue;
        }
        
        // Calculate annual costs for this increment
        const lowAnnualCost = new Decimal(adjustedCostRange.low).times(parsedFrequency.lowFrequency);
        const highAnnualCost = new Decimal(adjustedCostRange.high).times(parsedFrequency.highFrequency);
        const avgAnnualCost = new Decimal(adjustedCostRange.average).times(
          new Decimal(parsedFrequency.lowFrequency).plus(parsedFrequency.highFrequency).dividedBy(2)
        );
        
        // Add to total annual cost (weighted by duration)
        totalAnnualCost = totalAnnualCost.plus(avgAnnualCost.times(duration).dividedBy(totalDuration));
        
        // Calculate lifetime costs for this increment
        const lowLifetimeCost = lowAnnualCost.times(duration);
        const highLifetimeCost = highAnnualCost.times(duration);
        const avgLifetimeCost = avgAnnualCost.times(duration);
        
        // Add to total lifetime costs
        totalLifetimeCost = totalLifetimeCost.plus(avgLifetimeCost);
        totalLowCost = totalLowCost.plus(lowLifetimeCost);
        totalHighCost = totalHighCost.plus(highLifetimeCost);
      }
      
      // Round to 2 decimal places
      return {
        annual: totalAnnualCost.toDP(2).toNumber(),
        lifetime: totalLifetimeCost.toDP(2).toNumber(),
        low: totalLowCost.toDP(2).toNumber(),
        high: totalHighCost.toDP(2).toNumber(),
        average: totalLifetimeCost.toDP(2).toNumber(),
        isOneTime: false
      };
    } catch (error) {
      logger.error(`Error calculating item costs with age increments: ${error}`);
      throw error;
    }
  }
}
