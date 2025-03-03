import Decimal from 'decimal.js';
import { CostRange, GeoFactors } from '../types';
import calculationLogger from '../logger';

/**
 * Calculates the average of MFU and PFR factors
 * @param geoFactors - The geographic factors
 * @returns The average factor as a Decimal
 */
export const calculateAverageGeoFactor = (geoFactors: GeoFactors): Decimal => {
  const logger = calculationLogger.createContext('calculateAverageGeoFactor');
  const avgFactor = new Decimal(geoFactors.mfr_factor).plus(geoFactors.pfr_factor).dividedBy(2);
  logger.info('Calculated average of MFU and PFR factors:', avgFactor.toNumber());
  return avgFactor;
};

/**
 * Applies the average geographic factor to a cost range
 * @param costRange - The cost range to adjust
 * @param avgGeoFactor - The average geographic factor
 * @param source - Source of the costs for logging
 * @returns The adjusted cost range
 */
export const applyAverageGeoFactor = (
  costRange: CostRange,
  avgGeoFactor: Decimal,
  source: string
): CostRange => {
  const logger = calculationLogger.createContext('applyAverageGeoFactor');
  logger.info(`Applying average geographic factor to ${source} costs`);
  
  const adjustedRange = {
    low: new Decimal(costRange.low).times(avgGeoFactor).toDP(2).toNumber(),
    high: new Decimal(costRange.high).times(avgGeoFactor).toDP(2).toNumber(),
    average: new Decimal(costRange.average).times(avgGeoFactor).toDP(2).toNumber()
  };
  
  logger.info(`Adjusted ${source} costs with average factor`, adjustedRange);
  return adjustedRange;
};

/**
 * Creates a combined cost range from MFR and PFR costs
 * @param mfrCosts - The MFR costs
 * @param pfrCosts - The PFR costs
 * @returns The combined cost range
 */
export const combineMfrPfrCosts = (
  mfrCosts: CostRange,
  pfrCosts: CostRange
): CostRange => {
  const logger = calculationLogger.createContext('combineMfrPfrCosts');
  
  const combinedLow = new Decimal(mfrCosts.low).plus(pfrCosts.low).dividedBy(2);
  const combinedHigh = new Decimal(mfrCosts.high).plus(pfrCosts.high).dividedBy(2);
  const combinedAvg = new Decimal(mfrCosts.average).plus(pfrCosts.average).dividedBy(2);
  
  const result = {
    low: combinedLow.toDP(2).toNumber(),
    high: combinedHigh.toDP(2).toNumber(),
    average: combinedAvg.toDP(2).toNumber()
  };
  
  logger.info('Combined MFR and PFR costs', result);
  return result;
};
