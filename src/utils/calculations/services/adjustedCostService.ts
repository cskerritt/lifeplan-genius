import Decimal from 'decimal.js';
import { CostRange, GeoFactors } from '../types';
import calculationLogger from '../logger';
import { validateCostRange } from '../validation';
import geoFactorsService from './geoFactorsService';
import cptCodeService, { CptCodeData } from './cptCodeService';
import multiSourceCostService from './multiSourceCostService';
import userPromptUtils, { MissingDataError } from '../utilities/userPromptUtils';

/**
 * Interface for cost calculation parameters
 */
export interface AdjustedCostParams {
  baseRate: number;
  cptCode?: string | null;
  category?: string;
  zipCode?: string;
  costResources?: { cost: number }[];
}

/**
 * Interface for cost calculation result
 */
export interface AdjustedCostResult {
  costRange: CostRange;
  mfrCosts?: { low: number; high: number; average: number };
  pfrCosts?: { low: number; high: number; average: number };
  adjustedMfrCosts?: { low: number; high: number; average: number };
  adjustedPfrCosts?: { low: number; high: number; average: number };
  geoFactors?: GeoFactors;
}

/**
 * Calculates adjusted costs based on various factors
 * @param params - The calculation parameters
 * @returns A promise resolving to a cost range
 */
export const calculateAdjustedCosts = async (params: AdjustedCostParams): Promise<AdjustedCostResult> => {
  const logger = calculationLogger.createContext('calculateAdjustedCosts');
  logger.info('Calculating adjusted costs', params);
  
  const { baseRate, cptCode, category, zipCode, costResources } = params;
  
  try {
    // Special handling for multi-source costs
    if (costResources?.length) {
      logger.info(`Using ${costResources.length} cost resources for calculation`);
      return { costRange: multiSourceCostService.calculateMultiSourceCosts(costResources) };
    }
    
    // Initialize with base rate
    let low = new Decimal(baseRate);
    let average = new Decimal(baseRate);
    let high = new Decimal(baseRate);
    
    // Variables to store raw percentiles
    let rawMfr50th: Decimal | null = null;
    let rawMfr75th: Decimal | null = null;
    let rawPfr50th: Decimal | null = null;
    let rawPfr75th: Decimal | null = null;
    
    // Variables to store adjusted percentiles
    let adjustedMfr50th: Decimal | null = null;
    let adjustedMfr75th: Decimal | null = null;
    let adjustedPfr50th: Decimal | null = null;
    let adjustedPfr75th: Decimal | null = null;
    
    // Track MFR and PFR costs separately
    let mfrCosts: { low: number; high: number; average: number } | undefined;
    let pfrCosts: { low: number; high: number; average: number } | undefined;
    let adjustedMfrCosts: { low: number; high: number; average: number } | undefined;
    let adjustedPfrCosts: { low: number; high: number; average: number } | undefined;
    
    // Get geographic factors if ZIP code is provided
    let geoFactors: GeoFactors;
    
    if (zipCode) {
      try {
        geoFactors = await geoFactorsService.fetchGeoFactors(zipCode);
        logger.info('Using geographic factors for calculations', geoFactors);
      } catch (error) {
        if (error instanceof MissingDataError) {
          // Re-throw the error to be handled by the UI layer
          // This will prompt the user to provide the missing data
          throw error;
        }
        
        // For other errors, create a new MissingDataError
        logger.error(`Error fetching geographic factors: ${error}`);
        throw userPromptUtils.createMissingDataError(
          'Geographic Adjustment Factors',
          `An error occurred while fetching geographic factors. Please provide the Medicare Facility Rate (MFR) factor:`,
          1.0,
          (value) => userPromptUtils.validateNumericInput(value, 0.1, 5.0)
        );
      }
    } else {
      // If no ZIP code is provided, prompt the user to provide one
      throw userPromptUtils.createMissingDataError(
        'ZIP Code',
        'Please provide a ZIP code to calculate geographic adjustments:',
        undefined,
        (value) => {
          const zipRegex = /^\d{5}(-\d{4})?$/;
          return zipRegex.test(value) 
            ? { valid: true } 
            : { valid: false, error: 'Please enter a valid 5-digit ZIP code' };
        }
      );
    }
    
    // Adjust based on CPT code if available
    if (cptCode) {
      const cptData = await cptCodeService.lookupCPTCode(cptCode);
      if (cptData && Array.isArray(cptData) && cptData.length > 0) {
        logger.info('Using CPT code data', cptData[0]);
        
        // Check if we have MFU data
        const hasMfuData = cptData[0].mfu_50th != null && cptData[0].mfu_75th != null;
        
        // Check if we have PFR data
        const hasPfrData = cptData[0].pfr_50th != null && cptData[0].pfr_75th != null;
        
        // Log data availability for debugging
        logger.info('Data availability:', { 
          hasMfuData, 
          hasPfrData,
          mfu_50th_exists: cptData[0].mfu_50th !== undefined,
          mfu_75th_exists: cptData[0].mfu_75th !== undefined,
          pfr_50th_exists: cptData[0].pfr_50th !== undefined,
          pfr_75th_exists: cptData[0].pfr_75th !== undefined
        });
        
        // Store the raw percentiles without geographic adjustments
        if (hasMfuData) {
          rawMfr50th = new Decimal(cptData[0].mfu_50th!);
          rawMfr75th = new Decimal(cptData[0].mfu_75th!);
          logger.info('Using raw MFU data:', { 
            mfu_50th: rawMfr50th.toNumber(), 
            mfu_75th: rawMfr75th.toNumber() 
          });
          
          // Store MFU costs separately
          mfrCosts = {
            low: rawMfr50th.toDP(2).toNumber(),
            high: rawMfr75th.toDP(2).toNumber(),
            average: rawMfr50th.plus(rawMfr75th).dividedBy(2).toDP(2).toNumber()
          };
          
          // Apply geographic adjustment to MFU costs
          adjustedMfr50th = rawMfr50th.times(new Decimal(geoFactors.mfr_factor));
          adjustedMfr75th = rawMfr75th.times(new Decimal(geoFactors.mfr_factor));
          
          logger.info('Applied geographic adjustment to MFU data:', { 
            factor: geoFactors.mfr_factor,
            adjusted_mfu_50th: adjustedMfr50th.toNumber(), 
            adjusted_mfu_75th: adjustedMfr75th.toNumber() 
          });
          
          // Store adjusted MFU costs
          adjustedMfrCosts = {
            low: adjustedMfr50th.toDP(2).toNumber(),
            high: adjustedMfr75th.toDP(2).toNumber(),
            average: adjustedMfr50th.plus(adjustedMfr75th).dividedBy(2).toDP(2).toNumber()
          };
        }
        
        if (hasPfrData) {
          rawPfr50th = new Decimal(cptData[0].pfr_50th!);
          rawPfr75th = new Decimal(cptData[0].pfr_75th!);
          logger.info('Using raw PFR data:', { 
            pfr_50th: rawPfr50th.toNumber(), 
            pfr_75th: rawPfr75th.toNumber() 
          });
          
          // Store PFR costs separately
          pfrCosts = {
            low: rawPfr50th.toDP(2).toNumber(),
            high: rawPfr75th.toDP(2).toNumber(),
            average: rawPfr50th.plus(rawPfr75th).dividedBy(2).toDP(2).toNumber()
          };
          
          // Apply geographic adjustment to PFR costs
          adjustedPfr50th = rawPfr50th.times(new Decimal(geoFactors.pfr_factor));
          adjustedPfr75th = rawPfr75th.times(new Decimal(geoFactors.pfr_factor));
          
          logger.info('Applied geographic adjustment to PFR data:', { 
            factor: geoFactors.pfr_factor,
            adjusted_pfr_50th: adjustedPfr50th.toNumber(), 
            adjusted_pfr_75th: adjustedPfr75th.toNumber() 
          });
          
          // Store adjusted PFR costs
          adjustedPfrCosts = {
            low: adjustedPfr50th.toDP(2).toNumber(),
            high: adjustedPfr75th.toDP(2).toNumber(),
            average: adjustedPfr50th.plus(adjustedPfr75th).dividedBy(2).toDP(2).toNumber()
          };
        }
        
        // Calculate low, high, and average costs based on available adjusted data
        if (adjustedMfr50th && adjustedPfr50th && adjustedMfr75th && adjustedPfr75th) {
          // If we have both adjusted MFU and PFR data, use both for the calculation
          // Use 50th percentiles for low
          low = adjustedMfr50th.plus(adjustedPfr50th).dividedBy(2);
          // Use 75th percentiles for high
          high = adjustedMfr75th.plus(adjustedPfr75th).dividedBy(2);
          // Calculate average as (low + high) / 2
          average = low.plus(high).dividedBy(2);
          
          logger.info('Calculated costs using both adjusted MFU and PFR data:', {
            low: low.toNumber(),
            high: high.toNumber(),
            average: average.toNumber()
          });
        } 
        else if (adjustedMfr50th && adjustedMfr75th) {
          // If we only have adjusted MFU data
          low = adjustedMfr50th; // 50th percentile for low
          high = adjustedMfr75th; // 75th percentile for high
          average = low.plus(high).dividedBy(2); // Average of low and high
          
          logger.info('Calculated costs using only adjusted MFU data:', {
            low: low.toNumber(),
            high: high.toNumber(),
            average: average.toNumber()
          });
        } 
        else if (adjustedPfr50th && adjustedPfr75th) {
          // If we only have adjusted PFR data
          low = adjustedPfr50th; // 50th percentile for low
          high = adjustedPfr75th; // 75th percentile for high
          average = low.plus(high).dividedBy(2); // Average of low and high
          
          logger.info('Calculated costs using only adjusted PFR data:', {
            low: low.toNumber(),
            high: high.toNumber(),
            average: average.toNumber()
          });
        } 
        else if (rawMfr50th && rawPfr50th && rawMfr75th && rawPfr75th) {
          // If we have both raw MFU and PFR data but no adjustments, calculate from raw
          low = rawMfr50th.plus(rawPfr50th).dividedBy(2);
          high = rawMfr75th.plus(rawPfr75th).dividedBy(2);
          average = low.plus(high).dividedBy(2);
          
          logger.info('Calculated costs using both raw MFU and PFR data (no adjustments):', {
            low: low.toNumber(),
            high: high.toNumber(),
            average: average.toNumber()
          });
        } 
        else if (rawMfr50th && rawMfr75th) {
          // If we only have raw MFU data
          low = rawMfr50th;
          high = rawMfr75th;
          average = low.plus(high).dividedBy(2);
          
          logger.info('Calculated costs using only raw MFU data (no adjustments):', {
            low: low.toNumber(),
            high: high.toNumber(),
            average: average.toNumber()
          });
        } 
        else if (rawPfr50th && rawPfr75th) {
          // If we only have raw PFR data
          low = rawPfr50th;
          high = rawPfr75th;
          average = low.plus(high).dividedBy(2);
          
          logger.info('Calculated costs using only raw PFR data (no adjustments):', {
            low: low.toNumber(),
            high: high.toNumber(),
            average: average.toNumber()
          });
        } 
        else {
          // If we don't have any percentile data, use base rate
          logger.warn(`No percentile data found for CPT code ${cptCode}, using base rate`);
        }
      } else {
        logger.warn(`No CPT code data found for ${cptCode}, using base rate`);
      }
    }
    
    // Round to 2 decimal places
    const costRange: CostRange = {
      low: low.toDP(2).toNumber(),
      average: average.toDP(2).toNumber(),
      high: high.toDP(2).toNumber()
    };
    
    logger.info('Calculated final base costs', costRange);
    
    // Ensure we never return zero costs
    if (costRange.low <= 0 || costRange.average <= 0 || costRange.high <= 0) {
      logger.warn('Zero or negative costs detected, applying fallback values');
      console.warn('Zero or negative costs detected, applying fallback values:', costRange);
      
      // If we have a CPT code, use the sample values for that code
      if (cptCode) {
        const cptData = await cptCodeService.lookupCPTCode(cptCode);
        if (cptData && Array.isArray(cptData) && cptData.length > 0) {
          // Use the CPT code data as fallback
          costRange.low = costRange.low <= 0 ? cptData[0].pfr_50th || 100 : costRange.low;
          costRange.average = costRange.average <= 0 ? cptData[0].pfr_75th || 150 : costRange.average;
          costRange.high = costRange.high <= 0 ? cptData[0].pfr_90th || 200 : costRange.high;
          
          logger.info('Applied CPT code fallback values:', costRange);
          console.log('Applied CPT code fallback values:', costRange);
        } else {
          // Use generic fallback values
          costRange.low = costRange.low <= 0 ? 100 : costRange.low;
          costRange.average = costRange.average <= 0 ? 150 : costRange.average;
          costRange.high = costRange.high <= 0 ? 200 : costRange.high;
          
          logger.info('Applied generic fallback values:', costRange);
          console.log('Applied generic fallback values:', costRange);
        }
      } else {
        // Use generic fallback values
        costRange.low = costRange.low <= 0 ? 100 : costRange.low;
        costRange.average = costRange.average <= 0 ? 150 : costRange.average;
        costRange.high = costRange.high <= 0 ? 200 : costRange.high;
        
        logger.info('Applied generic fallback values:', costRange);
        console.log('Applied generic fallback values:', costRange);
      }
    }
    
    // Validate the result
    const validationResult = validateCostRange(costRange);
    if (!validationResult.valid) {
      logger.error(`Invalid cost range: ${validationResult.errors.join(', ')}`);
      console.error(`Invalid cost range: ${validationResult.errors.join(', ')}`);
    }
    
    if (validationResult.warnings.length > 0) {
      logger.warn(`Cost range warnings: ${validationResult.warnings.join(', ')}`);
      console.warn(`Cost range warnings: ${validationResult.warnings.join(', ')}`);
    }
    
    // Final check to ensure we never return zero costs
    if (costRange.low <= 0 || isNaN(costRange.low)) {
      logger.warn('Zero or invalid low cost detected, applying fallback value');
      console.warn('Zero or invalid low cost detected, applying fallback value:', costRange.low);
      costRange.low = 100;
    }
    
    if (costRange.average <= 0 || isNaN(costRange.average)) {
      logger.warn('Zero or invalid average cost detected, applying fallback value');
      console.warn('Zero or invalid average cost detected, applying fallback value:', costRange.average);
      costRange.average = 150;
    }
    
    if (costRange.high <= 0 || isNaN(costRange.high)) {
      logger.warn('Zero or invalid high cost detected, applying fallback value');
      console.warn('Zero or invalid high cost detected, applying fallback value:', costRange.high);
      costRange.high = 200;
    }
  
    logger.info('Final cost range after validation and fallback:', costRange);
    console.log('Final cost range after validation and fallback:', costRange);
    
    return { 
      costRange, 
      mfrCosts, 
      pfrCosts,
      adjustedMfrCosts,
      adjustedPfrCosts,
      geoFactors
    };
  } catch (error) {
    // If it's a MissingDataError, re-throw it to be handled by the UI layer
    if (error instanceof MissingDataError) {
      throw error;
    }
    
    logger.error(`Error calculating adjusted costs: ${error}`);
    
    // Instead of returning a fallback, throw a MissingDataError to prompt the user
    throw userPromptUtils.createMissingDataError(
      'Cost Calculation',
      `An error occurred during cost calculation: ${error}. Please provide the base cost:`,
      baseRate,
      (value) => userPromptUtils.validateNumericInput(value, 0.01)
    );
  }
};

export default {
  calculateAdjustedCosts
};
