import Decimal from 'decimal.js';
import { CostCalculationStrategy } from './costCalculationStrategy';
import { CostCalculationParams, CalculatedCosts } from '../types';
import calculationLogger from '../logger';
import frequencyParser from '../frequencyParser';
import { BaseCostCalculationStrategy } from './baseCostCalculationStrategy';

/**
 * Strategy for calculating recurring costs
 */
export class RecurringCostStrategy extends BaseCostCalculationStrategy implements CostCalculationStrategy {
  /**
   * Calculate recurring costs
   * @param params - The calculation parameters
   * @returns A promise resolving to the calculated costs
   */
  async calculate(params: CostCalculationParams): Promise<CalculatedCosts> {
    const logger = calculationLogger.createContext('RecurringCostStrategy.calculate');
    logger.info('Calculating recurring item costs', params);
    
    const { 
      frequency, 
      currentAge, 
      lifeExpectancy, 
      startAge, 
      endAge
    } = params;
    
    try {
      // Parse frequency and duration
      const parsedFrequency = frequencyParser.parseFrequency(frequency);
      if (!parsedFrequency.valid) {
        logger.error(`Failed to parse frequency: ${parsedFrequency.error}`);
        throw new Error(`Failed to parse frequency: ${parsedFrequency.error}`);
      }
      
      const parsedDuration = frequencyParser.parseDuration(
        frequency,
        currentAge,
        lifeExpectancy,
        startAge,
        endAge
      );
      
      if (!parsedDuration.valid) {
        logger.error(`Failed to parse duration: ${parsedDuration.error}`);
        throw new Error(`Failed to parse duration: ${parsedDuration.error}`);
      }
      
      // Get adjusted costs with geographic factors applied
      const { adjustedCostRange } = await this.getAdjustedCostsWithGeoFactors(params);
      
      // Calculate annual costs for recurring items
      const lowAnnualCost = new Decimal(adjustedCostRange.low).times(parsedFrequency.lowFrequency);
      const highAnnualCost = new Decimal(adjustedCostRange.high).times(parsedFrequency.highFrequency);
      const avgAnnualCost = new Decimal(adjustedCostRange.average).times(
        new Decimal(parsedFrequency.lowFrequency).plus(parsedFrequency.highFrequency).dividedBy(2)
      );
      
      logger.info('Calculated annual costs', {
        lowAnnualCost: lowAnnualCost.toNumber(),
        highAnnualCost: highAnnualCost.toNumber(),
        avgAnnualCost: avgAnnualCost.toNumber()
      });
      
      // Calculate lifetime costs
      const lowLifetimeCost = lowAnnualCost.times(parsedDuration.lowDuration);
      const highLifetimeCost = highAnnualCost.times(parsedDuration.highDuration);
      const avgLifetimeCost = avgAnnualCost.times(
        new Decimal(parsedDuration.lowDuration).plus(parsedDuration.highDuration).dividedBy(2)
      );
      
      logger.info('Calculated lifetime costs', {
        lowLifetimeCost: lowLifetimeCost.toNumber(),
        highLifetimeCost: highLifetimeCost.toNumber(),
        avgLifetimeCost: avgLifetimeCost.toNumber()
      });
      
      // Create an artificial range if low and high are the same
      let finalLow = lowLifetimeCost;
      let finalHigh = highLifetimeCost;
      let finalAverage = avgLifetimeCost;
      
      if (finalLow.equals(finalHigh)) {
        logger.info('Low and high lifetime costs are the same, creating artificial range');
        finalLow = avgLifetimeCost.times(0.9);
        finalHigh = avgLifetimeCost.times(1.1);
        logger.info('Created artificial range for recurring item:', {
          low: finalLow.toNumber(),
          high: finalHigh.toNumber(),
          average: finalAverage.toNumber()
        });
      }
      
      // Round to 2 decimal places
      return {
        annual: avgAnnualCost.toDP(2).toNumber(),
        lifetime: avgLifetimeCost.toDP(2).toNumber(),
        low: finalLow.toDP(2).toNumber(),
        high: finalHigh.toDP(2).toNumber(),
        average: finalAverage.toDP(2).toNumber(),
        isOneTime: false
      };
    } catch (error) {
      logger.error(`Error calculating recurring item costs: ${error}`);
      throw error;
    }
  }
}
