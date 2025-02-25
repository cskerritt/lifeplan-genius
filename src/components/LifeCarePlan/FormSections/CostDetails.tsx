
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CostRange } from "@/types/lifecare";
import { Search } from "lucide-react";
import { useCostCalculations } from "@/hooks/useCostCalculations";

interface CostDetailsProps {
  cptCode: string;
  costRange: CostRange;
  onCPTCodeChange: (value: string) => void;
  onCostRangeChange: (field: keyof CostRange, value: number) => void;
  onCPTLookup: () => Promise<void>;
  frequencyDetails?: {
    isOneTime: boolean;
    lowFrequencyPerYear: number;
    highFrequencyPerYear: number;
    lowDurationYears: number;
    highDurationYears: number;
    customFrequency?: string;
  };
}

export function CostDetails({
  cptCode,
  costRange,
  onCPTCodeChange,
  onCostRangeChange,
  onCPTLookup,
  frequencyDetails
}: CostDetailsProps) {
  const { lookupCPTCode, geoFactors } = useCostCalculations();

  const calculateFrequencyAdjustedCost = (baseCost: number, frequencyType: 'low' | 'high') => {
    if (!frequencyDetails) return baseCost;

    if (frequencyDetails.isOneTime) {
      return baseCost; // One-time costs don't get multiplied by frequency
    }

    const frequency = frequencyType === 'low' ? 
      frequencyDetails.lowFrequencyPerYear : 
      frequencyDetails.highFrequencyPerYear;

    const duration = frequencyType === 'low' ? 
      frequencyDetails.lowDurationYears : 
      frequencyDetails.highDurationYears;

    return baseCost * frequency * duration;
  };

  const handleCPTLookup = async () => {
    if (!cptCode.trim()) {
      console.log('No CPT code provided');
      return;
    }

    try {
      const cptResponse = await lookupCPTCode(cptCode);
      console.log('Raw CPT Response:', cptResponse);

      if (!cptResponse || !Array.isArray(cptResponse) || cptResponse.length === 0) {
        console.log('No CPT data returned from lookup');
        return;
      }

      const cptData = cptResponse[0];
      console.log('Processing CPT data:', cptData);

      if (!cptData.is_valid) {
        console.log('CPT code marked as invalid');
        return;
      }

      // Get geographic factors
      const pfrFactor = geoFactors?.pfr_factor || 1;
      const mfrFactor = geoFactors?.mfr_factor || 1;
      
      console.log('Geographic factors:', { pfrFactor, mfrFactor });

      // Calculate base costs
      const pfr50 = cptData.pfr_50th || 0;
      const pfr75 = cptData.pfr_75th || 0;
      const mfu50 = cptData.mfu_50th || 0;
      const mfu75 = cptData.mfu_75th || 0;

      console.log('Base rates:', {
        pfr: { p50: pfr50, p75: pfr75 },
        mfu: { p50: mfu50, p75: mfu75 }
      });

      // Apply geographic adjustments
      const adjustedPFR50 = pfr50 * pfrFactor;
      const adjustedPFR75 = pfr75 * pfrFactor;
      const adjustedMFU50 = mfu50 * mfrFactor;
      const adjustedMFU75 = mfu75 * mfrFactor;

      console.log('Adjusted rates:', {
        pfr: { p50: adjustedPFR50, p75: adjustedPFR75 },
        mfu: { p50: adjustedMFU50, p75: adjustedMFU75 }
      });

      // Calculate base ranges
      const baseLowValue = (adjustedMFU50 + adjustedPFR50) / 2;
      const baseHighValue = (adjustedMFU75 + adjustedPFR75) / 2;
      const baseAverageValue = (baseLowValue + baseHighValue) / 2;

      console.log('Base cost ranges:', {
        low: baseLowValue,
        average: baseAverageValue,
        high: baseHighValue
      });

      // Apply frequency adjustments
      const finalLowValue = calculateFrequencyAdjustedCost(baseLowValue, 'low');
      const finalHighValue = calculateFrequencyAdjustedCost(baseHighValue, 'high');
      const finalAverageValue = (finalLowValue + finalHighValue) / 2;

      console.log('Final cost ranges with frequency:', {
        low: finalLowValue,
        average: finalAverageValue,
        high: finalHighValue,
        frequency: frequencyDetails
      });

      // Update the cost ranges with rounded values
      onCostRangeChange('low', Math.round(finalLowValue * 100) / 100);
      onCostRangeChange('average', Math.round(finalAverageValue * 100) / 100);
      onCostRangeChange('high', Math.round(finalHighValue * 100) / 100);

    } catch (error) {
      console.error('Error in CPT lookup:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cost Details</h3>
      <div className="space-y-2">
        <Label>CPT/HCPCS Code</Label>
        <div className="flex gap-2">
          <Input 
            value={cptCode}
            onChange={(e) => onCPTCodeChange(e.target.value)}
            placeholder="Enter code"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCPTLookup}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Cost Range</Label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Low</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costRange.low}
              onChange={(e) => onCostRangeChange('low', Number(e.target.value))}
              placeholder="Minimum cost"
            />
          </div>
          <div>
            <Label>Average</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costRange.average}
              onChange={(e) => onCostRangeChange('average', Number(e.target.value))}
              placeholder="Average cost"
            />
          </div>
          <div>
            <Label>High</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={costRange.high}
              onChange={(e) => onCostRangeChange('high', Number(e.target.value))}
              placeholder="Maximum cost"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
