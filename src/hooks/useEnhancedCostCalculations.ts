import { useState } from "react";
import { CareCategory, CostRange, CostResource, VehicleModification } from "@/types/lifecare";
import Decimal from "decimal.js";
import { executeQuery } from "@/utils/browserDbConnection";
import useDataPrompt from "./useDataPrompt";
import { MissingDataError } from "@/utils/calculations/utilities/userPromptUtils";
import userPromptUtils from "@/utils/calculations/utilities/userPromptUtils";
import adjustedCostService from "@/utils/calculations/services/adjustedCostService";

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN }); // Using banker's rounding

/**
 * Enhanced version of useCostCalculations that uses the useDataPrompt hook
 * to handle missing data errors and prompt the user for input
 */
export const useEnhancedCostCalculations = () => {
  const [geoFactors, setGeoFactors] = useState<{ mfr_factor: number; pfr_factor: number } | null>(null);
  const [isLoadingGeoFactors, setIsLoadingGeoFactors] = useState(false);
  const { executeWithPrompt, promptDialog, isPrompting } = useDataPrompt();

  /**
   * Fetches geographic adjustment factors for a ZIP code
   * If factors are not found, it will prompt the user to provide them
   */
  const fetchGeoFactors = async (zipCode: string) => {
    if (isLoadingGeoFactors || (geoFactors && geoFactors.mfr_factor)) {
      return geoFactors;
    }

    console.log('Fetching geographic factors for ZIP:', zipCode);
    setIsLoadingGeoFactors(true);

    try {
      return await executeWithPrompt(async () => {
        try {
          // Use direct PostgreSQL connection to call the search_geographic_factors function
          console.log('Using direct PostgreSQL connection for geographic factors lookup...');
          const query = `SELECT * FROM search_geographic_factors($1)`;
          const result = await executeQuery(query, [zipCode]);

          if (result.rows && result.rows.length > 0) {
            console.log('Found geographic factors:', result.rows[0]);
            const factors = {
              mfr_factor: result.rows[0].mfr_code,
              pfr_factor: result.rows[0].pfr_code
            };
            setGeoFactors(factors);
            return factors;
          }
          
          // If no factors found, throw a MissingDataError to prompt the user
          throw userPromptUtils.createMissingDataError(
            'Geographic Adjustment Factors',
            `No geographic factors found for ZIP code ${zipCode}. Please provide the Medicare Facility Rate (MFR) factor:`,
            1.0,
            (value) => userPromptUtils.validateNumericInput(value, 0.1, 5.0)
          );
        } catch (error) {
          if (error instanceof MissingDataError) {
            throw error; // Re-throw MissingDataError to be handled by executeWithPrompt
          }
          
          console.error('Error fetching geographic factors:', error);
          
          // For other errors, create a new MissingDataError
          throw userPromptUtils.createMissingDataError(
            'Geographic Adjustment Factors',
            `An error occurred while fetching geographic factors for ZIP code ${zipCode}. Please provide the Medicare Facility Rate (MFR) factor:`,
            1.0,
            (value) => userPromptUtils.validateNumericInput(value, 0.1, 5.0)
          );
        }
      });
    } finally {
      setIsLoadingGeoFactors(false);
    }
  };

  /**
   * Looks up a CPT code to get standard rates
   * If the CPT code is not found, it will prompt the user to provide the rates
   */
  const lookupCPTCode = async (code: string) => {
    console.log('Looking up CPT code:', code);
    
    return executeWithPrompt(async () => {
      try {
        // Use direct PostgreSQL connection to call the validate_cpt_code function
        console.log('Using direct PostgreSQL connection for CPT code lookup...');
        const query = `SELECT * FROM validate_cpt_code($1)`;
        const result = await executeQuery(query, [code]);

        console.log('CPT code lookup result (raw):', result);
        console.log('CPT code lookup rows:', result.rows);
        
        if (result.rows && result.rows.length > 0) {
          console.log('CPT code data fields:', Object.keys(result.rows[0]));
          console.log('CPT code data values:', {
            mfr_50th: result.rows[0].mfr_50th,
            mfr_75th: result.rows[0].mfr_75th,
            mfr_90th: result.rows[0].mfr_90th,
            pfr_50th: result.rows[0].pfr_50th,
            pfr_75th: result.rows[0].pfr_75th,
            pfr_90th: result.rows[0].pfr_90th,
            mfu_50th: result.rows[0].mfu_50th,
            mfu_75th: result.rows[0].mfu_75th,
            mfu_90th: result.rows[0].mfu_90th
          });
          
          return result.rows;
        }
        
        // If no CPT code data found, throw a MissingDataError to prompt the user
        throw userPromptUtils.createMissingDataError(
          'CPT Code Data',
          `No data found for CPT code ${code}. Please provide the Medicare Fee Unit (MFU) 50th percentile rate:`,
          undefined,
          (value) => userPromptUtils.validateNumericInput(value, 0.01)
        );
      } catch (error) {
        if (error instanceof MissingDataError) {
          throw error; // Re-throw MissingDataError to be handled by executeWithPrompt
        }
        
        console.error('Error looking up CPT code:', error);
        
        // For other errors, create a new MissingDataError
        throw userPromptUtils.createMissingDataError(
          'CPT Code Data',
          `An error occurred while looking up CPT code ${code}. Please provide the Medicare Fee Unit (MFU) 50th percentile rate:`,
          undefined,
          (value) => userPromptUtils.validateNumericInput(value, 0.01)
        );
      }
    });
  };

  const calculateMultiSourceCosts = (resources: CostResource[]): CostRange => {
    if (!resources.length) {
      return { low: 0, average: 0, high: 0 };
    }

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
    
    const average = validCosts.reduce((sum, cost) => sum.plus(cost), new Decimal(0))
      .dividedBy(validCosts.length);

    return {
      low: low.toDP(2).toNumber(),
      average: average.toDP(2).toNumber(),
      high: high.toDP(2).toNumber()
    };
  };

  const calculateVehicleModificationTotal = (modifications: VehicleModification[]): number => {
    return new Decimal(
      modifications.reduce((total, mod) => 
        new Decimal(total).plus(new Decimal(mod.cost)), new Decimal(0))
    ).toDP(2).toNumber();
  };

  const validateCosts = (costs: CostRange): CostRange => {
    const low = new Decimal(costs.low);
    const avg = new Decimal(costs.average);
    const high = new Decimal(costs.high);

    // Validation rules
    if (low.gt(avg)) throw new Error("Low cost cannot be greater than average cost");
    if (avg.gt(high)) throw new Error("Average cost cannot be greater than high cost");
    if (low.lt(0)) throw new Error("Costs cannot be negative");
    
    // Check for unreasonable variations (e.g., high > 3x low)
    if (high.gt(low.times(3))) {
      console.warn("Warning: High cost is more than 3x the low cost");
    }

    return {
      low: low.toDP(2).toNumber(),
      average: avg.toDP(2).toNumber(),
      high: high.toDP(2).toNumber()
    };
  };

  /**
   * Calculates adjusted costs based on various factors
   * If any required data is missing, it will prompt the user to provide it
   */
  const calculateAdjustedCosts = async (
    baseRate: number,
    cptCode: string | null = null,
    category: CareCategory,
    costResources?: CostResource[],
    vehicleModifications?: VehicleModification[],
    zipCode?: string
  ): Promise<{
    costRange: CostRange;
    mfrValues?: { min: number; max: number; factor: number };
    pfrValues?: { min: number; max: number; factor: number };
  }> => {
    console.log('Calculating adjusted costs:', { baseRate, cptCode, category, costResources, zipCode });
    
    return executeWithPrompt(async () => {
      try {
        // Special handling for vehicle modifications in transportation category
        if (category === "transportation" && baseRate > 0) {
          const total = new Decimal(baseRate).toDP(2).toNumber();
          return { 
            costRange: validateCosts({ low: total, average: total, high: total }) 
          };
        }

        if (["transportation", "supplies", "dme", "medication"].includes(category) && costResources?.length) {
          return { 
            costRange: validateCosts(calculateMultiSourceCosts(costResources)) 
          };
        }

        // Use the adjustedCostService to calculate costs
        // This will throw MissingDataError if any required data is missing
        const result = await adjustedCostService.calculateAdjustedCosts({
          baseRate,
          cptCode: cptCode || undefined,
          category,
          zipCode,
          costResources
        });

        // Format the result for the UI
        let mfrValues: { min: number; max: number; factor: number } | undefined;
        let pfrValues: { min: number; max: number; factor: number } | undefined;

        if (result.mfrCosts && result.adjustedMfrCosts && result.geoFactors) {
          mfrValues = {
            min: result.mfrCosts.low,
            max: result.mfrCosts.high,
            factor: result.geoFactors.mfr_factor
          };
        }

        if (result.pfrCosts && result.adjustedPfrCosts && result.geoFactors) {
          pfrValues = {
            min: result.pfrCosts.low,
            max: result.pfrCosts.high,
            factor: result.geoFactors.pfr_factor
          };
        }

        return {
          costRange: validateCosts(result.costRange),
          mfrValues,
          pfrValues
        };
      } catch (error) {
        if (error instanceof MissingDataError) {
          throw error; // Re-throw MissingDataError to be handled by executeWithPrompt
        }
        
        console.error('Error calculating adjusted costs:', error);
        
        // For other errors, create a new MissingDataError
        throw userPromptUtils.createMissingDataError(
          'Cost Calculation',
          `An error occurred during cost calculation: ${error}. Please provide the base cost:`,
          baseRate,
          (value) => userPromptUtils.validateNumericInput(value, 0.01)
        );
      }
    });
  };

  const calculateAnnualCost = (frequency: string, costPerUnit: number, isOneTime: boolean = false): number => {
    if (isOneTime) {
      return new Decimal(costPerUnit).toDP(2).toNumber();
    }

    console.log('Calculating annual cost:', { frequency, costPerUnit });
    const frequencyLower = frequency.toLowerCase();
    let multiplier = new Decimal(1);

    if (frequencyLower.includes("per week")) {
      const timesPerWeek = parseInt(frequency);
      multiplier = new Decimal(timesPerWeek).times(52.1429); // More precise weeks per year
    } else if (frequencyLower.includes("monthly")) {
      multiplier = new Decimal(12);
    } else if (frequencyLower.includes("quarterly")) {
      multiplier = new Decimal(4);
    } else if (frequencyLower.includes("annually")) {
      multiplier = new Decimal(1);
    }

    return new Decimal(costPerUnit).times(multiplier).toDP(2).toNumber();
  };

  const calculateLifetimeCost = (annualCost: number, lifeExpectancy: number, isOneTime: boolean = false): number => {
    if (isOneTime) {
      return new Decimal(annualCost).toDP(2).toNumber();
    }
    return new Decimal(annualCost).times(new Decimal(lifeExpectancy)).toDP(2).toNumber();
  };

  return {
    geoFactors,
    isLoadingGeoFactors,
    fetchGeoFactors,
    calculateAdjustedCosts,
    calculateAnnualCost,
    calculateLifetimeCost,
    lookupCPTCode,
    promptDialog,
    isPrompting
  };
};

export default useEnhancedCostCalculations;
