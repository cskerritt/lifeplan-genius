import Decimal from 'decimal.js';
import { CostCalculationParams, CalculatedCosts, CostRange, GeoFactors } from './types';
import calculationLogger from './logger';
import { validateCostCalculationParams, validateCostRange } from './validation';
import frequencyParser from './frequencyParser';
import { supabase } from '@/integrations/supabase/client';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN }); // Using banker's rounding

/**
 * Default values for cost calculations
 */
const DEFAULT_VALUES = {
  // Default geographic factors when none are available
  geoFactors: {
    mfr_factor: 1.0,
    pfr_factor: 1.0,
  },
  // Default life expectancy when not provided
  lifeExpectancy: 30.5,
};

/**
 * Fetches geographic adjustment factors for a ZIP code
 * @param zipCode - The ZIP code to fetch factors for
 * @returns The geographic factors or null if not found
 */
export const fetchGeoFactors = async (zipCode: string): Promise<GeoFactors | null> => {
  const logger = calculationLogger.createContext('fetchGeoFactors');
  logger.info(`Fetching geographic factors for ZIP: ${zipCode}`);
  
  try {
    const { data, error } = await supabase
      .rpc('search_geographic_factors', { zip_code: zipCode });
    
    if (error) {
      logger.error(`Error fetching geographic factors: ${error.message}`);
      return null;
    }
    
    if (data && data.length > 0) {
      const factors: GeoFactors = {
        mfr_factor: data[0].mfr_code,
        pfr_factor: data[0].pfr_code,
      };
      
      logger.info('Found geographic factors', factors);
      return factors;
    }
    
    logger.warn(`No geographic factors found for ZIP: ${zipCode}`);
    return null;
  } catch (error) {
    logger.error(`Exception fetching geographic factors: ${error}`);
    return null;
  }
};

/**
 * Looks up a CPT code to get standard rates
 * @param code - The CPT code to look up
 * @returns The CPT code data or null if not found
 */
export const lookupCPTCode = async (code: string): Promise<any | null> => {
  const logger = calculationLogger.createContext('lookupCPTCode');
  logger.info(`Looking up CPT code: ${code}`);
  
  try {
    const { data, error } = await supabase
      .rpc('validate_cpt_code', { code_to_check: code });
    
    if (error) {
      logger.error(`Error looking up CPT code: ${error.message}`);
      return null;
    }
    
    if (data && Array.isArray(data) && data.length > 0) {
      logger.info('Found CPT code data', data[0]);
      return data;
    }
    
    logger.warn(`No data found for CPT code: ${code}`);
    return null;
  } catch (error) {
    logger.error(`Exception looking up CPT code: ${error}`);
    return null;
  }
};

/**
 * Calculates costs from multiple sources and provides statistical measures
 * @param resources - Array of cost resources
 * @returns A cost range with low, average, and high values
 */
export const calculateMultiSourceCosts = (resources: { cost: number }[]): CostRange => {
  const logger = calculationLogger.createContext('calculateMultiSourceCosts');
  logger.info(`Calculating costs from ${resources.length} sources`);
  
  if (!resources.length) {
    logger.warn('No resources provided for cost calculation');
    return { low: 0, average: 0, high: 0 };
  }
  
  // Convert all costs to Decimal for precise calculations
  const costs = resources.map(r => new Decimal(r.cost));
  const sortedCosts = costs.sort((a, b) => a.minus(b).toNumber());
  
  // Calculate statistical measures
  const n = sortedCosts.length;
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  
  const low = sortedCosts[0];
  const high = sortedCosts[n - 1];
  const median = n % 2 === 0 
    ? sortedCosts[n/2 - 1].plus(sortedCosts[n/2]).dividedBy(2)
    : sortedCosts[Math.floor(n/2)];
  
  // Calculate IQR for outlier detection
  const q1 = sortedCosts[q1Index];
  const q3 = sortedCosts[q3Index];
  const iqr = q3.minus(q1);
  const lowerBound = q1.minus(iqr.times(1.5));
  const upperBound = q3.plus(iqr.times(1.5));
  
  // Filter out outliers
  const validCosts = sortedCosts.filter(cost => 
    cost.gte(lowerBound) && cost.lte(upperBound)
  );
  
  // Calculate average of valid costs
  const average = validCosts.reduce((sum, cost) => sum.plus(cost), new Decimal(0))
    .dividedBy(validCosts.length);
  
  // Round to 2 decimal places
  const result: CostRange = {
    low: low.toDP(2).toNumber(),
    average: average.toDP(2).toNumber(),
    high: high.toDP(2).toNumber()
  };
  
  logger.info('Calculated multi-source costs', result);
  
  // Validate the result
  const validationResult = validateCostRange(result);
  if (!validationResult.valid) {
    logger.error(`Invalid cost range: ${validationResult.errors.join(', ')}`);
  }
  
  if (validationResult.warnings.length > 0) {
    logger.warn(`Cost range warnings: ${validationResult.warnings.join(', ')}`);
  }
  
  return result;
};

/**
 * Calculates adjusted costs based on various factors
 * @param params - The calculation parameters
 * @returns A promise resolving to a cost range
 */
export const calculateAdjustedCosts = async (params: {
  baseRate: number;
  cptCode?: string | null;
  category?: string;
  zipCode?: string;
  costResources?: { cost: number }[];
}): Promise<CostRange> => {
  const logger = calculationLogger.createContext('calculateAdjustedCosts');
  logger.info('Calculating adjusted costs', params);
  
  const { baseRate, cptCode, category, zipCode, costResources } = params;
  
  try {
    // Special handling for multi-source costs
    if (costResources?.length) {
      logger.info(`Using ${costResources.length} cost resources for calculation`);
      return calculateMultiSourceCosts(costResources);
    }
    
    // Initialize with base rate
    let low = new Decimal(baseRate);
    let average = new Decimal(baseRate);
    let high = new Decimal(baseRate);
    
    // Adjust based on CPT code if available
    if (cptCode) {
      const cptData = await lookupCPTCode(cptCode);
      if (cptData && Array.isArray(cptData) && cptData.length > 0) {
        logger.info('Adjusting costs based on CPT code data', cptData[0]);
        low = new Decimal(cptData[0].pfr_50th);
        average = new Decimal(cptData[0].pfr_75th);
        high = new Decimal(cptData[0].pfr_90th);
      } else {
        logger.warn(`No CPT code data found for ${cptCode}, using base rate`);
      }
    }
    
    // Apply geographic adjustment if ZIP code is provided
    if (zipCode) {
      const geoFactors = await fetchGeoFactors(zipCode);
      if (geoFactors) {
        logger.info('Applying geographic factors', geoFactors);
        const { pfr_factor } = geoFactors;
        
        low = low.times(new Decimal(pfr_factor));
        average = average.times(new Decimal(pfr_factor));
        high = high.times(new Decimal(pfr_factor));
      } else {
        logger.warn(`No geographic factors found for ZIP ${zipCode}, using default factors`);
      }
    }
    
    // Round to 2 decimal places
    const result: CostRange = {
      low: low.toDP(2).toNumber(),
      average: average.toDP(2).toNumber(),
      high: high.toDP(2).toNumber()
    };
    
    logger.info('Calculated adjusted costs', result);
    
    // Validate the result
    const validationResult = validateCostRange(result);
    if (!validationResult.valid) {
      logger.error(`Invalid cost range: ${validationResult.errors.join(', ')}`);
    }
    
    if (validationResult.warnings.length > 0) {
      logger.warn(`Cost range warnings: ${validationResult.warnings.join(', ')}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Error calculating adjusted costs: ${error}`);
    // Return base rate as fallback
    return {
      low: baseRate,
      average: baseRate,
      high: baseRate
    };
  }
};

/**
 * Calculates costs for an item based on frequency, duration, and other factors
 * @param params - The calculation parameters
 * @returns A promise resolving to the calculated costs
 */
export const calculateItemCosts = async (params: CostCalculationParams): Promise<CalculatedCosts> => {
  const logger = calculationLogger.createContext('calculateItemCosts');
  logger.info('Calculating item costs', params);
  
  // Validate input parameters
  const validationResult = validateCostCalculationParams(params);
  if (!validationResult.valid) {
    logger.error(`Invalid calculation parameters: ${validationResult.errors.join(', ')}`);
    throw new Error(`Invalid calculation parameters: ${validationResult.errors.join(', ')}`);
  }
  
  // Handle warnings
  if (validationResult.warnings.length > 0) {
    logger.warn(`Parameter warnings: ${validationResult.warnings.join(', ')}`);
  }
  
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
    
    // Get adjusted costs
    const costRange = await calculateAdjustedCosts({
      baseRate,
      cptCode,
      category,
      zipCode
    });
    
    // Handle one-time items
    if (parsedFrequency.isOneTime) {
      logger.info('Processing one-time item');
      return {
        annual: 0, // One-time items don't have an annual recurring cost
        lifetime: costRange.average, // The lifetime cost is just the average cost
        low: costRange.low,
        high: costRange.high,
        average: costRange.average,
        isOneTime: true
      };
    }
    
    // Calculate annual costs for recurring items
    const lowAnnualCost = new Decimal(costRange.low).times(parsedFrequency.lowFrequency);
    const highAnnualCost = new Decimal(costRange.high).times(parsedFrequency.highFrequency);
    const avgAnnualCost = new Decimal(costRange.average).times(
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
    
    // Round to 2 decimal places
    return {
      annual: avgAnnualCost.toDP(2).toNumber(),
      lifetime: avgLifetimeCost.toDP(2).toNumber(),
      low: lowLifetimeCost.toDP(2).toNumber(),
      high: highLifetimeCost.toDP(2).toNumber(),
      average: avgLifetimeCost.toDP(2).toNumber(),
      isOneTime: false
    };
  } catch (error) {
    logger.error(`Error calculating item costs: ${error}`);
    throw error;
  }
};

/**
 * Utility functions for cost calculations
 */
export const costCalculator = {
  calculateItemCosts,
  calculateAdjustedCosts,
  calculateMultiSourceCosts,
  fetchGeoFactors,
  lookupCPTCode,
  DEFAULT_VALUES,
};

export default costCalculator;
