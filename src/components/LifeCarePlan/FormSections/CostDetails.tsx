
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CostRange } from "@/types/lifecare";
import { Search } from "lucide-react";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { useEffect } from "react";

interface CostDetailsProps {
  cptCode: string;
  costRange: CostRange;
  onCPTCodeChange: (value: string) => void;
  onCostRangeChange: (field: keyof CostRange, value: number) => void;
  onCPTLookup: () => Promise<void>;
}

export function CostDetails({
  cptCode,
  costRange,
  onCPTCodeChange,
  onCostRangeChange,
  onCPTLookup,
}: CostDetailsProps) {
  const { lookupCPTCode, geoFactors } = useCostCalculations();

  const handleCPTLookup = async () => {
    if (cptCode.trim()) {
      try {
        const cptData = await lookupCPTCode(cptCode);
        console.log('CPT Data received:', cptData);
        
        if (cptData && Array.isArray(cptData) && cptData.length > 0) {
          const result = cptData[0];
          console.log('Using CPT result:', result);
          
          if (result.mfr_50th && result.mfr_75th && result.pfr_50th && result.pfr_75th) {
            // Get the geographic factors - if not available, default to 1
            const pfrFactor = geoFactors?.pfr_factor || 1;
            const mfrFactor = geoFactors?.mfr_factor || 1;
            
            console.log('Geographic factors being used:', {
              pfrFactor,
              mfrFactor
            });
            
            // Adjust PFR fees
            const adjustedPFR50 = result.pfr_50th * pfrFactor;
            const adjustedPFR75 = result.pfr_75th * pfrFactor;
            
            // Adjust MFR fees
            const adjustedMFR50 = result.mfr_50th * mfrFactor;
            const adjustedMFR75 = result.mfr_75th * mfrFactor;

            console.log('Adjusted PFR rates:', {
              pfr50: adjustedPFR50,
              pfr75: adjustedPFR75
            });
            
            console.log('Adjusted MFR rates:', {
              mfr50: adjustedMFR50,
              mfr75: adjustedMFR75
            });

            // Calculate final ranges
            const lowValue = (adjustedMFR50 + adjustedPFR50) / 2;
            const highValue = (adjustedMFR75 + adjustedPFR75) / 2;
            const averageValue = (lowValue + highValue) / 2;

            console.log('Final calculated values:', {
              low: lowValue,
              average: averageValue,
              high: highValue
            });

            // Update all three cost values with calculated rates
            onCostRangeChange('low', Math.round(lowValue * 100) / 100);
            onCostRangeChange('average', Math.round(averageValue * 100) / 100);
            onCostRangeChange('high', Math.round(highValue * 100) / 100);
          } else {
            console.log('Missing required MFR or PFR values in CPT data:', result);
          }
        } else {
          console.log('No CPT data found or invalid format');
        }
      } catch (error) {
        console.error('Error looking up CPT code:', error);
      }
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
