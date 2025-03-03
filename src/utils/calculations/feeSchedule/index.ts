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
 * Checks if an item has fee schedule data
 * @param item - The care item to check
 * @returns Object indicating presence of MFR and PFR data
 */
export const hasFeeScheduleData = (item: CareItem): { 
  hasMFRData: boolean; 
  hasPFRData: boolean; 
  hasFeeScheduleData: boolean;
} => {
  // Initialize result
  const result = {
    hasMFRData: false,
    hasPFRData: false,
    hasFeeScheduleData: false
  };
  
  // Check if item has MFR data
  const hasMFRMin = item.mfrMin !== undefined && item.mfrMin !== null && !isNaN(Number(item.mfrMin)) && Number(item.mfrMin) > 0;
  const hasMFRMax = item.mfrMax !== undefined && item.mfrMax !== null && !isNaN(Number(item.mfrMax)) && Number(item.mfrMax) > 0;
  result.hasMFRData = hasMFRMin || hasMFRMax;
  
  // Check if item has PFR data
  const hasPFRMin = item.pfrMin !== undefined && item.pfrMin !== null && !isNaN(Number(item.pfrMin)) && Number(item.pfrMin) > 0;
  const hasPFRMax = item.pfrMax !== undefined && item.pfrMax !== null && !isNaN(Number(item.pfrMax)) && Number(item.pfrMax) > 0;
  result.hasPFRData = hasPFRMin || hasPFRMax;
  
  // Item has fee schedule data if it has either MFR or PFR data
  result.hasFeeScheduleData = result.hasMFRData || result.hasPFRData;
  
  // Log detailed information about fee schedule data
  console.log(`[Fee Schedule] Fee schedule data check for item ID: ${item.id}`, {
    hasMFRData: result.hasMFRData,
    hasPFRData: result.hasPFRData,
    hasFeeScheduleData: result.hasFeeScheduleData,
    cptCode: item.cptCode,
    mfrMin: item.mfrMin,
    mfrMax: item.mfrMax,
    pfrMin: item.pfrMin,
    pfrMax: item.pfrMax
  });
  
  return result;
};

/**
 * Recalculates the cost range for a one-time item based on fee schedule data
 * @param item - The care item to recalculate costs for
 * @returns Object with low, average, and high costs
 */
export const recalculateCostRange = (item: CareItem): {
  itemCostLow: Decimal;
  itemCostAvg: Decimal;
  itemCostHigh: Decimal;
} => {
  // Initialize cost values
  let itemCostLow = new Decimal(0);
  let itemCostAvg = new Decimal(0);
  let itemCostHigh = new Decimal(0);
  
  // Log initial values for debugging
  console.log(`[Fee Schedule] Starting recalculateCostRange for item ID: ${item.id}`, {
    initialCosts: {
      low: itemCostLow.toString(),
      avg: itemCostAvg.toString(),
      high: itemCostHigh.toString()
    },
    itemData: {
      cptCode: item.cptCode,
      mfrMin: item.mfrMin,
      mfrMax: item.mfrMax,
      pfrMin: item.pfrMin,
      pfrMax: item.pfrMax
    }
  });
  
  try {
    // Check if we have valid MFR data
    const hasMFRMin = item.mfrMin !== undefined && item.mfrMin !== null && !isNaN(Number(item.mfrMin)) && Number(item.mfrMin) > 0;
    const hasMFRMax = item.mfrMax !== undefined && item.mfrMax !== null && !isNaN(Number(item.mfrMax)) && Number(item.mfrMax) > 0;
    
    // Check if we have valid PFR data
    const hasPFRMin = item.pfrMin !== undefined && item.pfrMin !== null && !isNaN(Number(item.pfrMin)) && Number(item.pfrMin) > 0;
    const hasPFRMax = item.pfrMax !== undefined && item.pfrMax !== null && !isNaN(Number(item.pfrMax)) && Number(item.pfrMax) > 0;
    
    // Calculate costs based on available data
    if (hasMFRMin && hasPFRMin) {
      // We have both MFR and PFR data, use the average of both for low cost
      itemCostLow = new Decimal(item.mfrMin).plus(item.pfrMin).dividedBy(2);
    } else if (hasMFRMin) {
      // Only MFR data available for low cost
      itemCostLow = new Decimal(item.mfrMin);
    } else if (hasPFRMin) {
      // Only PFR data available for low cost
      itemCostLow = new Decimal(item.pfrMin);
    } else {
      // No valid data for low cost, use fallback
      itemCostLow = new Decimal(50); // Fallback minimum cost
      console.log(`[Fee Schedule] No valid low cost data, using fallback value: ${itemCostLow}`);
    }
    
    if (hasMFRMax && hasPFRMax) {
      // We have both MFR and PFR data, use the average of both for high cost
      itemCostHigh = new Decimal(item.mfrMax).plus(item.pfrMax).dividedBy(2);
    } else if (hasMFRMax) {
      // Only MFR data available for high cost
      itemCostHigh = new Decimal(item.mfrMax);
    } else if (hasPFRMax) {
      // Only PFR data available for high cost
      itemCostHigh = new Decimal(item.pfrMax);
    } else {
      // No valid data for high cost, use fallback
      itemCostHigh = new Decimal(150); // Fallback maximum cost
      console.log(`[Fee Schedule] No valid high cost data, using fallback value: ${itemCostHigh}`);
    }
    
    // Ensure high cost is greater than low cost
    if (itemCostHigh.lessThanOrEqualTo(itemCostLow)) {
      itemCostHigh = itemCostLow.times(1.5); // Set high cost to 150% of low cost
      console.log(`[Fee Schedule] High cost was less than or equal to low cost, adjusted to: ${itemCostHigh}`);
    }
    
    // Calculate average cost
    itemCostAvg = itemCostLow.plus(itemCostHigh).dividedBy(2);
    
    // Ensure all costs are positive
    if (itemCostLow.lessThanOrEqualTo(0)) {
      itemCostLow = new Decimal(50); // Fallback minimum cost
      console.log(`[Fee Schedule] Low cost was zero or negative, adjusted to: ${itemCostLow}`);
    }
    
    if (itemCostAvg.lessThanOrEqualTo(0)) {
      itemCostAvg = new Decimal(100); // Fallback average cost
      console.log(`[Fee Schedule] Average cost was zero or negative, adjusted to: ${itemCostAvg}`);
    }
    
    if (itemCostHigh.lessThanOrEqualTo(0)) {
      itemCostHigh = new Decimal(150); // Fallback maximum cost
      console.log(`[Fee Schedule] High cost was zero or negative, adjusted to: ${itemCostHigh}`);
    }
    
    // Log recalculated cost range
    console.log(`[Fee Schedule] Recalculated cost range:`, {
      low: itemCostLow.toString(),
      avg: itemCostAvg.toString(),
      high: itemCostHigh.toString()
    });
  } catch (error) {
    console.error(`[Fee Schedule] Error recalculating cost range:`, error);
    
    // Use fallback values in case of error
    itemCostLow = new Decimal(50);
    itemCostAvg = new Decimal(100);
    itemCostHigh = new Decimal(150);
    
    console.log(`[Fee Schedule] Using fallback values after error:`, {
      low: itemCostLow.toString(),
      avg: itemCostAvg.toString(),
      high: itemCostHigh.toString()
    });
  }
  
  return { itemCostLow, itemCostAvg, itemCostHigh };
};
