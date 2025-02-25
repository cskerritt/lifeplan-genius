
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CareCategory, CostRange, CostResource, VehicleModification } from "@/types/lifecare";

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
          mfr_factor: data[0].mfr_code,  // Use mfr_code from the response
          pfr_factor: data[0].pfr_code   // Use pfr_code from the response
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
      return data; // Return the full array response
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
    
    if (category === "transportation" && vehicleModifications?.length) {
      const total = calculateVehicleModificationTotal(vehicleModifications);
      return { low: total, average: total, high: total };
    }

    if (["transportation", "supplies", "dme", "medication"].includes(category) && costResources?.length) {
      return calculateMultiSourceCosts(costResources);
    }

    try {
      let low = baseRate;
      let average = baseRate;
      let high = baseRate;

      if (cptCode) {
        const cptData = await lookupCPTCode(cptCode);
        if (cptData && Array.isArray(cptData) && cptData.length > 0) {
          console.log('Using CPT code data:', cptData[0]);
          low = cptData[0].pfr_50th;
          average = cptData[0].pfr_75th;
          high = cptData[0].pfr_90th;
        }
      }

      if (geoFactors) {
        console.log('Applying geographic factors:', geoFactors);
        const { mfr_factor, pfr_factor } = geoFactors;
        
        // Apply geographic factors directly
        low *= pfr_factor;
        average *= pfr_factor;
        high *= pfr_factor;
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
    isLoadingGeoFactors,
    fetchGeoFactors,
    calculateAdjustedCosts,
    calculateAnnualCost,
    lookupCPTCode
  };
};
