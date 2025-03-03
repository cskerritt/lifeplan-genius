import Decimal from 'decimal.js';
import { CostCalculationStrategy } from './costCalculationStrategy';
import { CostCalculationParams, CalculatedCosts } from '../types';
import calculationLogger from '../logger';
import { BaseCostCalculationStrategy } from './baseCostCalculationStrategy';

/**
 * Strategy for calculating one-time costs
 */
export class OneTimeCostStrategy extends BaseCostCalculationStrategy implements CostCalculationStrategy {
  /**
   * Calculate one-time costs
   * @param params - The calculation parameters
   * @returns A promise resolving to the calculated costs
   */
  async calculate(params: CostCalculationParams): Promise<CalculatedCosts> {
    const logger = calculationLogger.createContext('OneTimeCostStrategy.calculate');
    logger.info('Calculating one-time item costs', params);
    
    try {
      // Get adjusted costs with geographic factors applied
      const { adjustedCostRange, mfrCosts, pfrCosts, geoFactors } = await this.getAdjustedCostsWithGeoFactors(params);
      
      // Handle one-time items with MFR and PFR data
      let finalCostRange = adjustedCostRange;
      
      if (mfrCosts && pfrCosts) {
        // Apply MFR and PFR factors to get the final cost range
        finalCostRange = this.applyMfrPfrFactors(mfrCosts, pfrCosts, geoFactors);
      } else if (finalCostRange.low === finalCostRange.high) {
        // If low and high are the same, create a range around the average
        finalCostRange = this.createArtificialRange(finalCostRange.average);
        logger.info('Created artificial range for one-time item:', finalCostRange);
      }
      
      return {
        annual: 0, // One-time items don't have an annual recurring cost
        lifetime: finalCostRange.average, // The lifetime cost is just the average cost
        low: finalCostRange.low,
        high: finalCostRange.high,
        average: finalCostRange.average,
        isOneTime: true,
        // Include the raw MFR/PFR values for debugging
        mfrCosts,
        pfrCosts
      };
    } catch (error) {
      logger.error(`Error calculating one-time item costs: ${error}`);
      throw error;
    }
  }
}
