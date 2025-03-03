import Decimal from 'decimal.js';
import { GeoFactors } from '../types';
import calculationLogger from '../logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Default geographic factors when none are available
 */
export const DEFAULT_GEO_FACTORS: GeoFactors = {
  mfr_factor: 1.0,
  pfr_factor: 1.0,
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
    const result = await supabase
      .rpc('search_geographic_factors', { zip_code: zipCode })
      .execute();
    
    if (result.error) {
      logger.error(`Error fetching geographic factors: ${result.error.message}`);
      return null;
    }
    
    if (result.data && result.data.length > 0) {
      // Swap the mapping to correctly use pfr_code for mfu_fees and mfr_code for pfr_fees
      const factors: GeoFactors = {
        mfr_factor: result.data[0].pfr_code, // Use pfr_code for mfu_fees
        pfr_factor: result.data[0].mfr_code, // Use mfr_code for pfr_fees
      };
      
      logger.info('Found geographic factors', factors);
      logger.info('Using pfr_code for mfu_fees and mfr_code for pfr_fees to avoid duplicate adjustments');
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
 * Applies geographic factors to MFU and PFR costs
 * @param mfuCost - The MFU (Medicare Fee Unit) cost to adjust
 * @param pfrCost - The PFR (Private Facility Rate) cost to adjust
 * @param geoFactors - The geographic factors to apply
 * @returns The adjusted costs
 * 
 * Note: mfr_factor (from pfr_code in gaf_lookup) is applied to MFU costs
 *       pfr_factor (from mfr_code in gaf_lookup) is applied to PFR costs
 */
export const applyGeoFactors = (
  mfuCost: number | null | undefined,
  pfrCost: number | null | undefined,
  geoFactors: GeoFactors
): { adjustedMfu: number | null; adjustedPfr: number | null } => {
  // Apply mfr_factor (from pfr_code) to MFU costs
  const adjustedMfu = mfuCost !== null && mfuCost !== undefined
    ? new Decimal(mfuCost).times(geoFactors.mfr_factor).toNumber()
    : null;
    
  // Apply pfr_factor (from mfr_code) to PFR costs
  const adjustedPfr = pfrCost !== null && pfrCost !== undefined
    ? new Decimal(pfrCost).times(geoFactors.pfr_factor).toNumber()
    : null;
    
  return { adjustedMfu, adjustedPfr };
};

export default {
  DEFAULT_GEO_FACTORS,
  fetchGeoFactors,
  applyGeoFactors
};
