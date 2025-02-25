
import { useState, useEffect } from "react";
import { ProfessionalFee, AnesthesiaFee, FacilityFee, CostRange } from "@/types/lifecare";

export function useSurgicalCosts(
  professionalFees: ProfessionalFee[],
  anesthesiaFees: AnesthesiaFee[],
  facilityFees: FacilityFee[]
) {
  const [totalCostRange, setTotalCostRange] = useState<CostRange>({
    low: 0,
    average: 0,
    high: 0
  });

  useEffect(() => {
    calculateTotalCosts();
  }, [professionalFees, anesthesiaFees, facilityFees]);

  const calculateTotalCosts = () => {
    console.log('Calculating totals with:', {
      professionalFees,
      anesthesiaFees,
      facilityFees
    });

    // Calculate professional fees totals
    const profLow = professionalFees.reduce((sum, fee) => sum + fee.costRange.low, 0);
    const profHigh = professionalFees.reduce((sum, fee) => sum + fee.costRange.high, 0);
    const profAvg = professionalFees.reduce((sum, fee) => sum + fee.costRange.average, 0);

    // Calculate anesthesia fees total (use same value for low/avg/high since it's a fixed fee)
    const anesthesiaTotal = anesthesiaFees.reduce((sum, fee) => sum + fee.fee, 0);

    // Calculate facility fees total (use same value for low/avg/high since it's a fixed fee)
    const facilityTotal = facilityFees.reduce((sum, fee) => sum + fee.fee, 0);

    // Sum all components
    const totalLow = Math.round((profLow + anesthesiaTotal + facilityTotal) * 100) / 100;
    const totalHigh = Math.round((profHigh + anesthesiaTotal + facilityTotal) * 100) / 100;
    const totalAverage = Math.round((profAvg + anesthesiaTotal + facilityTotal) * 100) / 100;

    console.log('Fee totals:', {
      professional: { low: profLow, high: profHigh, avg: profAvg },
      anesthesia: anesthesiaTotal,
      facility: facilityTotal,
      final: { low: totalLow, high: totalHigh, average: totalAverage }
    });

    setTotalCostRange({
      low: totalLow,
      average: totalAverage,
      high: totalHigh
    });
  };

  return { totalCostRange };
}
