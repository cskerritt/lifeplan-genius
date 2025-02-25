
import { useFrequencyParser } from "./useFrequencyParser";

export const usePlanItemCosts = () => {
  const { parseFrequency, parseDuration } = useFrequencyParser();

  const calculateItemCosts = (baseRate: number, frequency: string) => {
    console.log('Calculating costs for:', { baseRate, frequency });
    
    const { lowFrequency, highFrequency } = parseFrequency(frequency);
    const { lowDuration, highDuration } = parseDuration(frequency);
    const isOneTime = frequency.toLowerCase().includes('one-time');

    // Calculate annual costs (per year costs)
    const lowAnnualCost = baseRate * lowFrequency;
    const highAnnualCost = baseRate * highFrequency;
    const averageAnnualCost = (lowAnnualCost + highAnnualCost) / 2;

    console.log('Annual cost calculations:', {
      baseRate,
      lowFrequency,
      highFrequency,
      lowAnnualCost,
      highAnnualCost,
      averageAnnualCost
    });

    // Calculate lifetime costs with duration
    const lowLifetimeCost = lowAnnualCost * lowDuration;
    const highLifetimeCost = highAnnualCost * highDuration;
    const averageLifetimeCost = (lowLifetimeCost + highLifetimeCost) / 2;

    console.log('Lifetime cost calculations:', {
      lowDuration,
      highDuration,
      lowAnnualCost,
      highAnnualCost,
      lowLifetimeCost,
      highLifetimeCost,
      averageLifetimeCost
    });

    if (isOneTime) {
      console.log('One-time cost, using base rate:', baseRate);
      return {
        annual: baseRate,
        lifetime: baseRate,
        low: baseRate,
        high: baseRate,
        average: baseRate
      };
    }

    return {
      annual: averageAnnualCost,
      lifetime: highLifetimeCost,
      low: lowLifetimeCost,
      high: highLifetimeCost,
      average: averageLifetimeCost
    };
  };

  return {
    calculateItemCosts
  };
};
