
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CostRange } from "@/types/lifecare";
import { Search } from "lucide-react";

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
  onCPTLookup
}: CostDetailsProps) {
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
            onClick={onCPTLookup}
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
