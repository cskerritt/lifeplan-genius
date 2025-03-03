import Decimal from 'decimal.js';
import { CostCalculationStrategy } from './costCalculationStrategy';
import { CostCalculationParams, CalculatedCosts, CostRange } from '../types';
import { AgeIncrement } from '@/types/lifecare';
import calculationLogger from '../logger';
import adjustedCostService from '../services/adjustedCostService';
import geoFactorsService from '../services/geoFactorsService';
import frequencyParser from '../frequencyParser';
import { calculateDurationFromAgeIncrements } from '../durationCalculator';
import { calculateAverageGeoFactor, applyAverageGeoFactor } from '../utilities/costAdjustmentUtils';
import { RecurringCostStrategy } from './recurringCostStrategy';

/**
 * Strategy for calculating costs with age increments
 */
export class AgeIncrementCostStrategy implements CostCalculationStrategy {
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
