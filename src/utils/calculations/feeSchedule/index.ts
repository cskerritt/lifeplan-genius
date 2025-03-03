import { CareItem } from "@/types/lifecare";
import Decimal from 'decimal.js';
import { debugLog } from "../formatters";

/**
 * Interface for fee schedule values
 */
export interface FeeScheduleValues {
  min: number;
  max: number;
  avg: number;
  factor: number;
}

/**
 * Get MFR values with improved validation
 */
export const getMFRValues = (item: CareItem): FeeScheduleValues => {
  debugLog('Getting MFR values');
  // Try to get the values from mfrMin/mfrMax
  let min = 0;
  let max = 0;
  let factor = 1;
  
  if (item.mfrMin !== undefined && item.mfrMin !== null && !isNaN(Number(item.mfrMin))) {
    min = Number(item.mfrMin);
  }
  
  if (item.mfrMax !== undefined && item.mfrMax !== null && !isNaN(Number(item.mfrMax))) {
    max = Number(item.mfrMax);
  }
  
  if (item.mfrFactor !== undefined && item.mfrFactor !== null && !isNaN(Number(item.mfrFactor))) {
    factor = Number(item.mfrFactor);
  }
  
  // Calculate average, handling edge cases
  const avg = min && max ? (min + max) / 2 : (min || max || 0);
  
  const result = {
    min,
    max,
    avg,
    factor
  };
  
  debugLog('MFR values:', result);
  return result;
};

/**
 * Get PFR values with improved validation
 */
export const getPFRValues = (item: CareItem): FeeScheduleValues => {
  debugLog('Getting PFR values');
  // Try to get the values from pfrMin/pfrMax
  let min = 0;
  let max = 0;
  let factor = 1;
  
  if (item.pfrMin !== undefined && item.pfrMin !== null && !isNaN(Number(item.pfrMin))) {
    min = Number(item.pfrMin);
  }
  
  if (item.pfrMax !== undefined && item.pfrMax !== null && !isNaN(Number(item.pfrMax))) {
    max = Number(item.pfrMax);
  }
  
  if (item.pfrFactor !== undefined && item.pfrFactor !== null && !isNaN(Number(item.pfrFactor))) {
    factor = Number(item.pfrFactor);
  }
  
  // Calculate average, handling edge cases
  const avg = min && max ? (min + max) / 2 : (min || max || 0);
  
  const result = {
    min,
    max,
    avg,
    factor
  };
  
  debugLog('PFR values:', result);
  return result;
};

/**
 * Calculate combined base rates with improved validation
 */
export const calculateCombinedRate = (
  mfrValue: number, 
  pfrValue: number, 
  mfrFactor: number, 
  pfrFactor: number
): number => {
  if (mfrValue && pfrValue) {
    return ((mfrValue * mfrFactor) + (pfrValue * pfrFactor)) / 2;
  } else if (mfrValue) {
    return mfrValue * mfrFactor;
  } else if (pfrValue) {
    return pfrValue * pfrFactor;
  }
  return 0;
};

/**
 * Check if we have fee schedule data with improved validation
 */
export const hasFeeScheduleData = (item: CareItem): { 
  hasMFRData: boolean; 
  hasPFRData: boolean; 
  hasFeeScheduleData: boolean;
} => {
  const hasMFRData = item.mfrMin !== undefined && item.mfrMin !== null && !isNaN(Number(item.mfrMin));
  const hasPFRData = item.pfrMin !== undefined && item.pfrMin !== null && !isNaN(Number(item.pfrMin));
  const hasFeeScheduleData = hasMFRData || hasPFRData;
  
  debugLog('Fee schedule data availability:', { hasMFRData, hasPFRData, hasFeeScheduleData });
  
  return { hasMFRData, hasPFRData, hasFeeScheduleData };
};

/**
 * Recalculate cost range for one-time items based on MFR and PFR data
 */
export const recalculateCostRange = (item: CareItem): {
  itemCostLow: Decimal;
  itemCostAvg: Decimal;
  itemCostHigh: Decimal;
} => {
  let itemCostLow = new Decimal(item.costRange.low || 0);
  let itemCostAvg = new Decimal(item.costRange.average || 0);
  let itemCostHigh = new Decimal(item.costRange.high || 0);
  
  debugLog('Initial cost values:', {
    low: itemCostLow.toNumber(),
    avg: itemCostAvg.toNumber(),
    high: itemCostHigh.toNumber()
  });
  
  try {
    // Get MFR and PFR values
    const mfrValues = getMFRValues(item);
    const pfrValues = getPFRValues(item);
    
    // Calculate low cost as average of 50th percentiles with GAF adjustment
    const adjustedMfr50th = new Decimal(mfrValues.min).times(mfrValues.factor);
    const adjustedPfr50th = new Decimal(pfrValues.min).times(pfrValues.factor);
    itemCostLow = adjustedMfr50th.plus(adjustedPfr50th).dividedBy(2);
    
    // Calculate high cost as average of 75th percentiles with GAF adjustment
    const adjustedMfr75th = new Decimal(mfrValues.max).times(mfrValues.factor);
    const adjustedPfr75th = new Decimal(pfrValues.max).times(pfrValues.factor);
    itemCostHigh = adjustedMfr75th.plus(adjustedPfr75th).dividedBy(2);
    
    // Calculate average cost as average of low and high
    itemCostAvg = itemCostLow.plus(itemCostHigh).dividedBy(2);
    
    debugLog('Recalculated one-time item cost range:', {
      low: itemCostLow.toNumber(),
      average: itemCostAvg.toNumber(),
      high: itemCostHigh.toNumber()
    });
  } catch (error) {
    debugLog('Error in cost recalculation:', error);
  }
  
  return { itemCostLow, itemCostAvg, itemCostHigh };
};
