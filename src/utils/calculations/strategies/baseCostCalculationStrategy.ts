import Decimal from 'decimal.js';
import { CostCalculationParams, CostRange, GeoFactors } from '../types';
import calculationLogger from '../logger';
import adjustedCostService from '../services/adjustedCostService';
import geoFactorsService from '../services/geoFactorsService';
import { calculateAverageGeoFactor, applyAverageGeoFactor } from '../utilities/costAdjustmentUtils';

/**
 * Base strategy class for cost calculations
 * Provides common functionality used by all cost calculation strategies
 */
export abstract class BaseCostCalculationStrategy {
  /**
   * Calculate costs based on the provided parameters
   * This method must be implemented by concrete strategy classes
   * @param params - The calculation parameters
   * @returns A promise resolving to the calculated costs
   */
  abstract calculate(params: CostCalculationParams): Promise<any>;

  /**
   * Gets adjusted costs with geographic factors applied
   * @param params - The calculation parameters
   * @returns A promise resolving to the adjusted costs and related data
   */
  protected async getAdjustedCostsWithGeoFactors(params: CostCalculationParams) {
    const logger = calculationLogger.createContext('BaseCostCalculationStrategy.getAdjustedCostsWithGeoFactors');
    const { baseRate, cptCode, category, zipCode } = params;
    
    // Get adjusted costs
    const { costRange, mfrCosts, pfrCosts } = await adjustedCostService.calculateAdjustedCosts({
      baseRate,
      cptCode,
      category,
      zipCode
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
      adjustedCostRange = applyAverageGeoFactor(costRange, avgGeoFactor, 'base');
    }
    
    return {
      adjustedCostRange,
      mfrCosts,
      pfrCosts,
      geoFactors,
      avgGeoFactor
    };
  }

  /**
   * Creates an artificial range if low and high are the same
   * @param value - The value to create a range around
   * @returns A cost range with low, average, and high values
   */
  protected createArtificialRange(value: number): CostRange {
    const average = value;
    return {
      low: new Decimal(average).times(0.9).toDP(2).toNumber(),
      average: average,
      high: new Decimal(average).times(1.1).toDP(2).toNumber()
    };
  }

  /**
   * Applies MFR and PFR factors to costs
   * @param mfrCosts - The MFR costs
   * @param pfrCosts - The PFR costs
   * @param geoFactors - The geographic factors
   * @returns The adjusted cost range
   */
  protected applyMfrPfrFactors(
    mfrCosts: CostRange,
    pfrCosts: CostRange,
    geoFactors: GeoFactors
  ): CostRange {
    const logger = calculationLogger.createContext('BaseCostCalculationStrategy.applyMfrPfrFactors');
    
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
    
    logger.info('Recalculating costs using MFR and PFR data');
    
    // Calculate low as average of 50th percentiles
    const low = new Decimal(localAdjustedMfrCosts.low).plus(localAdjustedPfrCosts.low).dividedBy(2);
    
    // Calculate high as average of 75th percentiles
    const high = new Decimal(localAdjustedMfrCosts.high).plus(localAdjustedPfrCosts.high).dividedBy(2);
    
    // Calculate average as (low + high) / 2
    const average = low.plus(high).dividedBy(2);
    
    logger.info('Recalculated costs:', {
      low: low.toNumber(),
      high: high.toNumber(),
      average: average.toNumber()
    });
    
    // Return the adjusted cost range
    return {
      low: low.toDP(2).toNumber(),
      high: high.toDP(2).toNumber(),
      average: average.toDP(2).toNumber()
    };
  }
}
