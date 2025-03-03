
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
      
      // Ensure annual cost is never null
      if (result.annual === null || result.annual === undefined) {
        result.annual = baseRate;
      }
      
      // Ensure lifetime cost is never null
      if (result.lifetime === null || result.lifetime === undefined) {
        result.lifetime = baseRate * (lifeExpectancy || 30);
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
      
      return result;
    } catch (error) {
      console.error('Error calculating costs with age increments:', error);
      
      // Fallback to a simple calculation in case of error
      return {
        annual: baseRate,
        lifetime: baseRate * 30,
        low: baseRate,
        high: baseRate,
        average: baseRate,
        isOneTime: false
      };
    }
  }, []);

  return {
    calculateItemCosts,
    calculateItemCostsWithAgeIncrements
  };
};
