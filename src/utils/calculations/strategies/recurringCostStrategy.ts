import Decimal from 'decimal.js';
import { CostCalculationStrategy } from './costCalculationStrategy';
import { CostCalculationParams, CalculatedCosts, CostRange } from '../types';
import calculationLogger from '../logger';
import adjustedCostService from '../services/adjustedCostService';
import geoFactorsService from '../services/geoFactorsService';
import frequencyParser from '../frequencyParser';
import { calculateAverageGeoFactor, applyAverageGeoFactor } from '../utilities/costAdjustmentUtils';

/**
 * Strategy for calculating recurring costs
 */
export class RecurringCostStrategy implements CostCalculationStrategy {
  /**
   * Calculate recurring costs
   * @param params - The calculation parameters
   * @returns A promise resolving to the calculated costs
   */
  async calculate(params: CostCalculationParams): Promise<CalculatedCosts> {
    const logger = calculationLogger.createContext('RecurringCostStrategy.calculate');
    logger.info('Calculating recurring item costs', params);
    
    const { 
      baseRate, 
      frequency, 
      currentAge, 
      lifeExpectancy, 
      startAge, 
      endAge,
      cptCode,
      category,
      zipCode
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
