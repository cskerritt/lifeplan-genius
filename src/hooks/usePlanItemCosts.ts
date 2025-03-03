
import { calculateItemCosts as calculateItemCostsUtil, calculateItemCostsWithAgeIncrements as calculateItemCostsWithAgeIncrementsUtil } from '@/utils/calculations';
import { CostCalculationParams, CalculatedCosts } from '@/utils/calculations/types';
import { AgeIncrement } from '@/types/lifecare';
import { useCallback } from 'react';

/**
 * Hook for calculating costs for plan items
 * This is a wrapper around the centralized cost calculator utilities
 * to maintain backward compatibility with existing code
 */
export const usePlanItemCosts = () => {
  /**
   * Calculate costs for a plan item based on frequency, duration, and other factors
   * @param baseRate - The base rate per unit
   * @param frequency - The frequency string
   * @param currentAge - The current age of the evaluee
   * @param lifeExpectancy - The life expectancy of the evaluee
   * @returns An object with calculated costs
   */
  const calculateItemCosts = useCallback(async (
    baseRate: number, 
    frequency: string, 
    currentAge?: number, 
    lifeExpectancy?: number,
    cptCode?: string | null,
    category?: string,
    zipCode?: string
  ) => {
    console.log('Calculating costs for:', { baseRate, frequency, currentAge, lifeExpectancy, cptCode, category, zipCode });
    
    try {
      // Prepare parameters for the centralized calculator
      const params: CostCalculationParams = {
        baseRate,
        frequency,
        currentAge,
        lifeExpectancy,
        cptCode,
        category: category as any, // Type cast to match expected type
        zipCode
      };
      
      // Use the centralized calculator
      const result = await calculateItemCostsUtil(params);
      
      console.log('Calculated costs:', result);
      
      // Ensure annual cost is never null or zero
      if (result.annual === null || result.annual === undefined || result.annual === 0) {
        console.warn('Annual cost is null, undefined, or zero. Using base rate as fallback:', baseRate);
        result.annual = baseRate > 0 ? baseRate : 100;
      }
      
      // Ensure lifetime cost is never null or zero
      if (result.lifetime === null || result.lifetime === undefined || result.lifetime === 0) {
        const lifespanYears = lifeExpectancy || 30;
        console.warn(`Lifetime cost is null, undefined, or zero. Using base rate * ${lifespanYears} as fallback:`, baseRate * lifespanYears);
        result.lifetime = (baseRate > 0 ? baseRate : 100) * lifespanYears;
      }
      
      // Ensure cost range values are never null, undefined, or zero
      if (!result.low || result.low <= 0) {
        console.warn('Low cost is null, undefined, or zero. Using fallback value:', 80);
        result.low = 80;
      }
      
      if (!result.high || result.high <= 0) {
        console.warn('High cost is null, undefined, or zero. Using fallback value:', 120);
        result.high = 120;
      }
      
      if (!result.average || result.average <= 0) {
        console.warn('Average cost is null, undefined, or zero. Using fallback value:', 100);
        result.average = 100;
      }
      
      return result;
    } catch (error) {
      console.error('Error calculating costs:', error);
      
      // Fallback to a simple calculation in case of error
      return {
        annual: baseRate,
        lifetime: baseRate * (lifeExpectancy || 30),
        low: baseRate,
        high: baseRate,
        average: baseRate,
        isOneTime: false
      };
    }
  }, []);

  /**
   * Calculate costs for a plan item based on age increments
   * @param baseRate - The base rate per unit
   * @param ageIncrements - Array of age increments with frequencies
   * @param cptCode - The CPT code for the item
   * @param category - The category of the item
   * @param zipCode - The ZIP code for geographic adjustment
   * @returns An object with calculated costs
   */
  const calculateItemCostsWithAgeIncrements = useCallback(async (
    baseRate: number,
    ageIncrements: AgeIncrement[],
    cptCode?: string | null,
    category?: string,
    zipCode?: string
  ) => {
    console.log('Calculating costs with age increments:', { baseRate, ageIncrements, cptCode, category });
    
    try {
      // Prepare parameters for the centralized calculator
      const params: CostCalculationParams & { ageIncrements: AgeIncrement[] } = {
        baseRate,
        frequency: "", // Not used with age increments
        cptCode,
        category: category as any, // Type cast to match expected type
        zipCode,
        ageIncrements
      };
      
      // Use the centralized calculator
      const result = await calculateItemCostsWithAgeIncrementsUtil(params);
      
      console.log('Calculated costs with age increments:', result);
      
      // Ensure all values are valid before returning
      if (result.annual === null || result.annual === undefined || result.annual === 0) {
        console.warn('Annual cost with age increments is null, undefined, or zero. Using base rate as fallback:', baseRate);
        result.annual = baseRate > 0 ? baseRate : 100;
      }
      
      if (result.lifetime === null || result.lifetime === undefined || result.lifetime === 0) {
        console.warn('Lifetime cost with age increments is null, undefined, or zero. Using base rate * 30 as fallback:', baseRate * 30);
        result.lifetime = (baseRate > 0 ? baseRate : 100) * 30;
      }
      
      if (!result.low || result.low <= 0) {
        console.warn('Low cost with age increments is null, undefined, or zero. Using fallback value:', 80);
        result.low = 80;
      }
      
      if (!result.high || result.high <= 0) {
        console.warn('High cost with age increments is null, undefined, or zero. Using fallback value:', 120);
        result.high = 120;
      }
      
      if (!result.average || result.average <= 0) {
        console.warn('Average cost with age increments is null, undefined, or zero. Using fallback value:', 100);
        result.average = 100;
      }
      
      return result;
    } catch (error) {
      console.error('Error calculating costs with age increments:', error);
      
      // Fallback to a simple calculation in case of error
      return {
        annual: baseRate > 0 ? baseRate : 100,
        lifetime: (baseRate > 0 ? baseRate : 100) * 30,
        low: baseRate > 0 ? baseRate * 0.8 : 80,
        high: baseRate > 0 ? baseRate * 1.2 : 120,
        average: baseRate > 0 ? baseRate : 100,
        isOneTime: false
      };
    }
  }, []);

  return {
    calculateItemCosts,
    calculateItemCostsWithAgeIncrements
  };
};
