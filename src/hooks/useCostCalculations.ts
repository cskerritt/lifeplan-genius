
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CareCategory, CostRange, CostResource, VehicleModification } from "@/types/lifecare";

export const useCostCalculations = () => {
  const [geoFactors, setGeoFactors] = useState<{ mfr_factor: number; pfr_factor: number } | null>(null);

  const fetchGeoFactors = async (zipCode: string) => {
    console.log('Fetching geographic factors for ZIP:', zipCode);
    try {
      const { data, error } = await supabase
        .rpc('search_geographic_factors', { zip_code: zipCode });

      if (error) {
        console.error('Error in fetchGeoFactors:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('Found geographic factors:', data[0]);
        setGeoFactors({
          mfr_factor: data[0].mfr_code,
          pfr_factor: data[0].pfr_code
        });
      }
    } catch (error) {
      console.error('Error fetching geographic factors:', error);
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
      
      if (data && data.length > 0 && data[0].is_valid) {
        return data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error looking up CPT code:', error);
      return null;
    }
  };

  const calculateMultiSourceCosts = (resources: CostResource[]): CostRange => {
    if (!resources.length) {
      return { low: 0, average: 0, high: 0 };
    }

    const costs = resources.map(r => r.cost).filter(c => c > 0);
    const low = Math.min(...costs);
    const high = Math.max(...costs);
    const average = (low + high) / 2;

    return {
      low: Math.round(low * 100) / 100,
      average: Math.round(average * 100) / 100,
      high: Math.round(high * 100) / 100
    };
  };

  const calculateVehicleModificationTotal = (modifications: VehicleModification[]): number => {
    return modifications.reduce((total, mod) => total + mod.cost, 0);
  };

  const calculateAdjustedCosts = async (
    baseRate: number,
    cptCode: string | null = null,
    category: CareCategory,
    costResources?: CostResource[],
    vehicleModifications?: VehicleModification[]
  ): Promise<CostRange> => {
    console.log('Calculating adjusted costs:', { baseRate, cptCode, category, costResources });
    
    // Handle vehicle modifications
    if (category === "transportation" && vehicleModifications?.length) {
      const total = calculateVehicleModificationTotal(vehicleModifications);
      return { low: total, average: total, high: total };
    }

    // Handle special categories that use multiple cost sources
    if (["transportation", "supplies", "dme", "medication"].includes(category) && costResources?.length) {
      return calculateMultiSourceCosts(costResources);
    }

    try {
      let low = baseRate;
      let average = baseRate;
      let high = baseRate;

      if (cptCode) {
        const cptData = await lookupCPTCode(cptCode);
        if (cptData) {
          console.log('Using CPT code data:', cptData);
          low = cptData.pfr_50th;
          average = cptData.pfr_75th;
          high = cptData.pfr_90th;
        }
      }

      if (geoFactors) {
        console.log('Applying geographic factors:', geoFactors);
        const { mfr_factor, pfr_factor } = geoFactors;
        
        const { data: adjustedCosts, error } = await supabase
          .rpc('calculate_adjusted_costs', {
            base_fee: baseRate,
            mfr_factor: mfr_factor,
            pfr_factor: pfr_factor
          });

        if (error) {
          console.error('Error calculating adjusted costs:', error);
          throw error;
        }

        if (adjustedCosts && adjustedCosts.length > 0) {
          console.log('Adjusted costs calculated:', adjustedCosts[0]);
          return {
            low: Math.round(adjustedCosts[0].min_cost * 100) / 100,
            average: Math.round(adjustedCosts[0].avg_cost * 100) / 100,
            high: Math.round(adjustedCosts[0].max_cost * 100) / 100
          };
        }
      }

      return {
        low: Math.round(low * 100) / 100,
        average: Math.round(average * 100) / 100,
        high: Math.round(high * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating adjusted costs:', error);
      return { low: baseRate, average: baseRate, high: baseRate };
    }
  };

  const calculateAnnualCost = (frequency: string, costPerUnit: number): number => {
    console.log('Calculating annual cost:', { frequency, costPerUnit });
    const frequencyLower = frequency.toLowerCase();
    let multiplier = 1;

    if (frequencyLower.includes("per week")) {
      const timesPerWeek = parseInt(frequency);
      multiplier = timesPerWeek * 52;
    } else if (frequencyLower.includes("monthly")) {
      multiplier = 12;
    } else if (frequencyLower.includes("quarterly")) {
      multiplier = 4;
    } else if (frequencyLower.includes("annually")) {
      multiplier = 1;
    }

    const annualCost = Math.round(costPerUnit * multiplier * 100) / 100;
    console.log('Calculated annual cost:', annualCost);
    return annualCost;
  };

  return {
    geoFactors,
    fetchGeoFactors,
    calculateAdjustedCosts,
    calculateAnnualCost,
    lookupCPTCode  // Added this to expose the function
  };
};
