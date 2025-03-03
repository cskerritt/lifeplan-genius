import Decimal from 'decimal.js';
import { CostCalculationStrategy } from './costCalculationStrategy';
import { CostCalculationParams, CalculatedCosts, CostRange } from '../types';
import calculationLogger from '../logger';
import adjustedCostService from '../services/adjustedCostService';
import geoFactorsService from '../services/geoFactorsService';
import { calculateAverageGeoFactor, applyAverageGeoFactor } from '../utilities/costAdjustmentUtils';

/**
 * Strategy for calculating one-time costs
 */
export class OneTimeCostStrategy implements CostCalculationStrategy {
  /**
   * Calculate one-time costs
   * @param params - The calculation parameters
   * @returns A promise resolving to the calculated costs
   */
  async calculate(params: CostCalculationParams): Promise<CalculatedCosts> {
    const logger = calculationLogger.createContext('OneTimeCostStrategy.calculate');
    logger.info('Calculating one-time item costs', params);
    
    const { baseRate, cptCode, category, zipCode } = params;
    
    try {
      // Get raw base costs without geographic adjustments
      const { costRange: baseCostRange, mfrCosts, pfrCosts } = await adjustedCostService.calculateAdjustedCosts({
        baseRate,
        cptCode,
        category
      });
      
      // Apply geographic adjustments if ZIP code is provided
      let geoFactors = geoFactorsService.DEFAULT_GEO_FACTORS;
      if (zipCode) {
        const fetchedFactors = await geoFactorsService.fetchGeoFactors(zipCode);
        if (fetchedFactors) {
          geoFactors = fetchedFactors;
          logger.info('Using geographic factors for calculations', geoFactors);
        } else {
          logger.warn(`No geographic factors found for ZIP ${zipCode}, using default factors`);
        }
      }
      
      // Calculate the average of MFU and PFR factors
      const avgGeoFactor = calculateAverageGeoFactor(geoFactors);
      
      // Apply geographic adjustments to costs based on their source
      let adjustedCostRange: CostRange;
      
      if (mfrCosts && pfrCosts) {
        // If we have both MFR and PFR costs, use the average of the raw costs and apply the average factor
        logger.info('Applying average geographic factor to combined MFR and PFR costs');
        
        const combinedLow = new Decimal(mfrCosts.low).plus(pfrCosts.low).dividedBy(2);
        const combinedHigh = new Decimal(mfrCosts.high).plus(pfrCosts.high).dividedBy(2);
        const combinedAvg = new Decimal(mfrCosts.average).plus(pfrCosts.average).dividedBy(2);
        
        // Apply the average geographic factor
        adjustedCostRange = {
          low: combinedLow.times(avgGeoFactor).toDP(2).toNumber(),
          high: combinedHigh.times(avgGeoFactor).toDP(2).toNumber(),
          average: combinedAvg.times(avgGeoFactor).toDP(2).toNumber()
        };
        
        logger.info('Combined costs with average geographic factor', adjustedCostRange);
      } else if (mfrCosts) {
        // If we only have MFR costs, apply the average factor
        adjustedCostRange = applyAverageGeoFactor(mfrCosts, avgGeoFactor, 'MFR');
      } else if (pfrCosts) {
        // If we only have PFR costs, apply the average factor
        adjustedCostRange = applyAverageGeoFactor(pfrCosts, avgGeoFactor, 'PFR');
      } else {
        // If we don't have specific cost sources, apply the average factor to base costs
        adjustedCostRange = applyAverageGeoFactor(baseCostRange, avgGeoFactor, 'base');
      }
      
      // Handle one-time items with MFR and PFR data
      if (mfrCosts && pfrCosts) {
        // Apply geographic adjustments to MFR and PFR costs
        const localAdjustedMfrCosts = {
          low: new Decimal(mfrCosts.low).times(geoFactors.mfr_factor).toDP(2).toNumber(),
          high: new Decimal(mfrCosts.high).times(geoFactors.mfr_factor).toDP(2).toNumber(),
          average: new Decimal(mfrCosts.average).times(geoFactors.mfr_factor).toDP(2).toNumber()
        };
        
        const localAdjustedPfrCosts = {
          low: new Decimal(pfrCosts.low).times(geoFactors.pfr_factor).toDP(2).toNumber(),
          high: new Decimal(pfrCosts.high).times(geoFactors.pfr_factor).toDP(2).toNumber(),
          average: new Decimal(pfrCosts.average).times(geoFactors.pfr_factor).toDP(2).toNumber()
        };
        
        logger.info('Recalculating one-time item costs using MFR and PFR data');
        
        // Calculate low as average of 50th percentiles
        const low = new Decimal(localAdjustedMfrCosts.low).plus(localAdjustedPfrCosts.low).dividedBy(2);
        
        // Calculate high as average of 75th percentiles
        const high = new Decimal(localAdjustedMfrCosts.high).plus(localAdjustedPfrCosts.high).dividedBy(2);
        
        // Calculate average as (low + high) / 2
        const average = low.plus(high).dividedBy(2);
        
        logger.info('Recalculated one-time item costs:', {
          low: low.toNumber(),
          high: high.toNumber(),
          average: average.toNumber()
        });
        
        // Update the adjusted cost range
        adjustedCostRange = {
          low: low.toDP(2).toNumber(),
          high: high.toDP(2).toNumber(),
          average: average.toDP(2).toNumber()
        };
      } else if (adjustedCostRange.low === adjustedCostRange.high) {
        // If low and high are the same, create a range around the average
        const average = adjustedCostRange.average;
        adjustedCostRange = {
          low: new Decimal(average).times(0.9).toDP(2).toNumber(),
          average: average,
          high: new Decimal(average).times(1.1).toDP(2).toNumber()
        };
        logger.info('Created artificial range for one-time item:', adjustedCostRange);
      }
      
      return {
        annual: 0, // One-time items don't have an annual recurring cost
        lifetime: adjustedCostRange.average, // The lifetime cost is just the average cost
        low: adjustedCostRange.low,
        high: adjustedCostRange.high,
        average: adjustedCostRange.average,
        isOneTime: true,
        // Include the raw and adjusted MFR/PFR values for debugging
        mfrCosts,
        pfrCosts
      };
    } catch (error) {
      logger.error(`Error calculating one-time item costs: ${error}`);
      throw error;
    }
  }
}
