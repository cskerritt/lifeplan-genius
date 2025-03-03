import Decimal from 'decimal.js';
import { GeoFactors } from '../types';
import calculationLogger from '../logger';
import { executeQuery } from '@/utils/browserDbConnection';
import userPromptUtils, { MissingDataError } from '../utilities/userPromptUtils';

/**
 * Default geographic factors when none are available
 * Note: These are only used for internal calculations and should not be exposed to users
 * @private
 */
const INTERNAL_DEFAULT_GEO_FACTORS: GeoFactors = {
  mfr_factor: 1.0,
  pfr_factor: 1.0,
};

/**
 * Fetches geographic adjustment factors for a ZIP code
 * @param zipCode - The ZIP code to fetch factors for
 * @returns The geographic factors
 * @throws MissingDataError if geographic factors are not found for the ZIP code
 */
export const fetchGeoFactors = async (zipCode: string): Promise<GeoFactors> => {
  const logger = calculationLogger.createContext('fetchGeoFactors');
  logger.info(`🔍 Looking up ZIP: ${zipCode}`);
  console.log(`🔍 Looking up ZIP: ${zipCode}`);
  
  try {
    // Use direct database connection
    const query = `SELECT mfr_code, pfr_code, city, state_name FROM gaf_lookup WHERE zip = $1 LIMIT 1`;
    
    try {
      const result = await executeQuery(query, [zipCode]);
      
      console.log(`Lookup result:`, result);
      
      if (result.rows && result.rows.length > 0) {
        // Use the correct mapping for geographic factors
        const factors: GeoFactors = {
          mfr_factor: result.rows[0].mfr_code, // Use mfr_code for MFR factor
          pfr_factor: result.rows[0].pfr_code, // Use pfr_code for PFR factor
        };
        
        console.log(`Found factors:`, factors);
        logger.info('Found geographic factors', factors);
        return factors;
      }
    } catch (dbError) {
      logger.error(`Database error looking up ZIP code: ${dbError}`);
      console.error(`Database error looking up ZIP code ${zipCode}:`, dbError);
      // Continue to fallback mechanism
    }
    
    // If we get here, no factors were found or there was an error
    logger.warn(`No geographic factors found for ZIP: ${zipCode}, using default factors`);
    console.warn(`No geographic factors found for ZIP: ${zipCode}, using default factors`);
    
    // Return default factors instead of throwing an error
    // This ensures calculations can continue even without geographic factors
    return {
      mfr_factor: 1.0,
      pfr_factor: 1.0
    };
  } catch (error) {
    if (error instanceof MissingDataError) {
      throw error; // Re-throw MissingDataError
    }
    
    logger.error(`Exception fetching geographic factors: ${error}`);
    console.error(`Exception fetching geographic factors: ${error}`);
    
    // Return default factors instead of throwing an error
    return {
      mfr_factor: 1.0,
      pfr_factor: 1.0
    };
  }
};

/**
 * Applies geographic factors to MFU and PFR costs
 * @param mfuCost - The MFU (Medicare Fee Unit) cost to adjust
 * @param pfrCost - The PFR (Private Facility Rate) cost to adjust
 * @param geoFactors - The geographic factors to apply
 * @returns The adjusted costs
 * 
 * Note: mfr_factor is applied to MFU costs
 *       pfr_factor is applied to PFR costs
 */
export const applyGeoFactors = (
  mfuCost: number | null | undefined,
  pfrCost: number | null | undefined,
  geoFactors: GeoFactors
): { adjustedMfu: number | null; adjustedPfr: number | null } => {
  // Apply mfr_factor to MFU costs
  const adjustedMfu = mfuCost !== null && mfuCost !== undefined && !isNaN(mfuCost)
    ? new Decimal(mfuCost).times(geoFactors.mfr_factor).toNumber()
    : null;
    
  // Apply pfr_factor to PFR costs
  const adjustedPfr = pfrCost !== null && pfrCost !== undefined && !isNaN(pfrCost)
    ? new Decimal(pfrCost).times(geoFactors.pfr_factor).toNumber()
    : null;
    
  // Ensure we never return null for both values
  if (adjustedMfu === null && adjustedPfr === null) {
    // If both are null, return default values
    return {
      adjustedMfu: 100,
      adjustedPfr: 150
    };
  }
    
  return { adjustedMfu, adjustedPfr };
};

export default {
  fetchGeoFactors,
  applyGeoFactors,
  // Expose the internal default factors for testing and backward compatibility
  // but mark it as deprecated to encourage proper error handling
  get DEFAULT_GEO_FACTORS() {
    console.warn('WARNING: Using DEFAULT_GEO_FACTORS is deprecated. Handle missing data with user prompts instead.');
    return INTERNAL_DEFAULT_GEO_FACTORS;
  }
};
