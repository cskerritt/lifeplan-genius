
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CareCategory, CostRange, CostResource, VehicleModification } from "@/types/lifecare";
import Decimal from "decimal.js";

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
      const { data, error } = await supabase
        .rpc('search_geographic_factors', { zip_code: zipCode });

      if (error) {
        console.error('Error in fetchGeoFactors:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('Found geographic factors:', data[0]);
        const factors = {
          mfr_factor: data[0].mfr_code,
          pfr_factor: data[0].pfr_code
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
      const { data, error } = await supabase
        .rpc('validate_cpt_code', { code_to_check: code });

      if (error) {
        console.error('Error in lookupCPTCode:', error);
        throw error;
      }

      console.log('CPT code lookup result:', data);
      return data;
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
    vehicleModifications?: VehicleModification[]
  ): Promise<CostRange> => {
    console.log('Calculating adjusted costs:', { baseRate, cptCode, category, costResources });
    
    try {
      // Special handling for vehicle modifications in transportation category
      if (category === "transportation" && baseRate > 0) {
        const total = new Decimal(baseRate).toDP(2).toNumber();
        return validateCosts({ low: total, average: total, high: total });
      }

      if (["transportation", "supplies", "dme", "medication"].includes(category) && costResources?.length) {
        return validateCosts(calculateMultiSourceCosts(costResources));
      }

      let low = new Decimal(baseRate);
      let average = new Decimal(baseRate);
      let high = new Decimal(baseRate);

      if (cptCode) {
        const cptData = await lookupCPTCode(cptCode);
        if (cptData && Array.isArray(cptData) && cptData.length > 0) {
          console.log('Using CPT code data:', cptData[0]);
          low = new Decimal(cptData[0].pfr_50th);
          average = new Decimal(cptData[0].pfr_75th);
          high = new Decimal(cptData[0].pfr_90th);
        }
      }

      if (geoFactors) {
        console.log('Applying geographic factors:', geoFactors);
        const { mfr_factor, pfr_factor } = geoFactors;
        
        low = low.times(new Decimal(pfr_factor));
        average = average.times(new Decimal(pfr_factor));
        high = high.times(new Decimal(pfr_factor));
      }

      return validateCosts({
        low: low.toDP(2).toNumber(),
        average: average.toDP(2).toNumber(),
        high: high.toDP(2).toNumber()
      });
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
