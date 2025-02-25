
import { useState, useEffect } from "react";
import { CPTFee, FacilityFee, CostRange } from "@/types/lifecare";

export function useInterventionalCosts(
  cptFees: CPTFee[],
  facilityFees: FacilityFee[]
) {
  const [totalCostRange, setTotalCostRange] = useState<CostRange>({
    low: 0,
    average: 0,
    high: 0
  });

  useEffect(() => {
    calculateTotalCosts();
  }, [cptFees, facilityFees]);

  const calculateTotalCosts = () => {
    const cptLow = cptFees.reduce((sum, fee) => sum + fee.costRange.low, 0);
    const cptHigh = cptFees.reduce((sum, fee) => sum + fee.costRange.high, 0);
    const cptAvg = cptFees.reduce((sum, fee) => sum + fee.costRange.average, 0);

    const facilityTotal = facilityFees.reduce((sum, fee) => sum + fee.fee, 0);

    const totalLow = Math.round((cptLow + facilityTotal) * 100) / 100;
    const totalHigh = Math.round((cptHigh + facilityTotal) * 100) / 100;
    const totalAverage = Math.round((cptAvg + facilityTotal) * 100) / 100;

    setTotalCostRange({
      low: totalLow,
      average: totalAverage,
      high: totalHigh
    });
  };

  return { totalCostRange };
}
