import { useState } from "react";
import { CareCategory, CostRange, CostResource, VehicleModification } from "@/types/lifecare";
import Decimal from "decimal.js";
import { executeQuery } from "@/utils/browserDbConnection";

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN }); // Using banker's rounding

export const useCostCalculations = () => {
  const [geoFactors, setGeoFactors] = useState<{ mfr_factor: number; pfr_factor: number } | null>(null);
  const [isLoadingGeoFactors, setIsLoadingGeoFactors] = useState(false);

  const fetchGeoFactors = async (zipCode: string) => {
    if (isLoadingGeoFactors || (geoFactors && geoFactors.mfr_factor)) {
      return geoFactors;
    }

    console.log('Fetching geographic factors for ZIP:', zipCode);
    setIsLoadingGeoFactors(true);

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
      return null;
    } catch (error) {
      console.error('Error fetching geographic factors:', error);
      return null;
    } finally {
      setIsLoadingGeoFactors(false);
    }
  };

  const lookupCPTCode = async (code: string) => {
    console.log('Looking up CPT code:', code);
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
      }
      
      return result.rows;
    } catch (error) {
      console.error('Error looking up CPT code:', error);
      return null;
    }
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
      
      // Get geographic factors if ZIP code is provided
      let geoFactorsResult = null;
      if (zipCode) {
        geoFactorsResult = await fetchGeoFactors(zipCode);
        if (geoFactorsResult) {
          console.log('Using geographic factors for calculations:', geoFactorsResult);
        } else {
          console.warn(`No geographic factors found for ZIP ${zipCode}, using default factors`);
        }
      }
      
      // Use default factors if none were found
      const geoFactors = geoFactorsResult || {
        mfr_factor: 1.0,
        pfr_factor: 1.0
      };
      
      // Store MFR and PFR values for UI display
      let mfrValues: { min: number; max: number; factor: number } | undefined;
      let pfrValues: { min: number; max: number; factor: number } | undefined;
      
      if (cptCode) {
        const cptResult = await lookupCPTCode(cptCode);
        if (cptResult && Array.isArray(cptResult) && cptResult.length > 0) {
          const cptData = cptResult;
          console.log('Using CPT code data:', cptData[0]);
          
  // Check if we have MFU data (stored as mfu_* in the database)
  const hasMfuData = cptData[0].mfu_50th !== undefined && cptData[0].mfu_75th !== undefined;
  
  // Check if we have PFR data
  const hasPfrData = cptData[0].pfr_50th !== undefined && cptData[0].pfr_75th !== undefined;
  
  console.log('Data availability:', { 
    hasMfuData, 
    hasPfrData,
    mfu_50th_exists: cptData[0].mfu_50th !== undefined,
    mfu_75th_exists: cptData[0].mfu_75th !== undefined,
    pfr_50th_exists: cptData[0].pfr_50th !== undefined,
    pfr_75th_exists: cptData[0].pfr_75th !== undefined
  });
          
          // Store the raw percentiles
          if (hasMfuData) {
            rawMfr50th = new Decimal(cptData[0].mfu_50th);
            rawMfr75th = new Decimal(cptData[0].mfu_75th);
            console.log('Using raw MFU data (from mfu_* fields):', { 
              mfu_50th: rawMfr50th.toNumber(), 
              mfu_75th: rawMfr75th.toNumber() 
            });
            
            // Store MFU values for UI display
            mfrValues = {
              min: rawMfr50th.toNumber(),
              max: rawMfr75th.toNumber(),
              factor: geoFactors.mfr_factor
            };
            
            // Apply geographic adjustment to MFU percentiles
            adjustedMfr50th = rawMfr50th.times(new Decimal(geoFactors.mfr_factor));
            adjustedMfr75th = rawMfr75th.times(new Decimal(geoFactors.mfr_factor));
            
            console.log('Adjusted MFU data with factor:', { 
              factor: geoFactors.mfr_factor,
              adjusted_mfu_50th: adjustedMfr50th.toNumber(), 
              adjusted_mfu_75th: adjustedMfr75th.toNumber() 
            });
          }
          
          if (hasPfrData) {
            rawPfr50th = new Decimal(cptData[0].pfr_50th);
            rawPfr75th = new Decimal(cptData[0].pfr_75th);
            console.log('Using raw PFR data:', { 
              pfr_50th: rawPfr50th.toNumber(), 
              pfr_75th: rawPfr75th.toNumber() 
            });
            
            // Store PFR values for UI display
            pfrValues = {
              min: rawPfr50th.toNumber(),
              max: rawPfr75th.toNumber(),
              factor: geoFactors.pfr_factor
            };
            
            // Apply geographic adjustment to PFR percentiles
            adjustedPfr50th = rawPfr50th.times(new Decimal(geoFactors.pfr_factor));
            adjustedPfr75th = rawPfr75th.times(new Decimal(geoFactors.pfr_factor));
            
            console.log('Adjusted PFR data with factor:', { 
              factor: geoFactors.pfr_factor,
              adjusted_pfr_50th: adjustedPfr50th.toNumber(), 
              adjusted_pfr_75th: adjustedPfr75th.toNumber() 
            });
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
            
            console.log('Calculated costs using both adjusted MFU and PFR data:', {
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
            
            console.log('Calculated costs using only adjusted MFU data:', {
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
            
            console.log('Calculated costs using only adjusted PFR data:', {
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
            
            console.log('Calculated costs using both raw MFU and PFR data (no adjustments):', {
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
            
            console.log('Calculated costs using only raw MFU data (no adjustments):', {
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
            
            console.log('Calculated costs using only raw PFR data (no adjustments):', {
              low: low.toNumber(),
              high: high.toNumber(),
              average: average.toNumber()
            });
          } 
          else {
            // If we don't have either, use base rate
            console.warn(`No percentile data found for CPT code ${cptCode}, using base rate`);
          }
        }
      }

      const costRange = validateCosts({
        low: low.toDP(2).toNumber(),
        average: average.toDP(2).toNumber(),
        high: high.toDP(2).toNumber()
      });
      
      console.log('Final validated costs:', costRange);
      return { costRange, mfrValues, pfrValues };
    } catch (error) {
      console.error('Error calculating adjusted costs:', error);
      throw error;
    }
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
    lookupCPTCode
  };
};
