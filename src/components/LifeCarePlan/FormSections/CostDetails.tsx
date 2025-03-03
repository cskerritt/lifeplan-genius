import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CostRange } from "@/types/lifecare";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface CostDetailsProps {
  cptCode: string;
  costRange: CostRange;
  isManualCost?: boolean;
  notes?: string;
  rationale?: string;
  onCPTCodeChange: (value: string) => void;
  onCostRangeChange: (field: keyof CostRange, value: number) => void;
  onCPTLookup: () => Promise<void>;
  onIsManualCostChange?: (value: boolean) => void;
  onNotesChange?: (value: string) => void;
  onRationaleChange?: (value: string) => void;
}

export function CostDetails({
  cptCode,
  costRange,
  isManualCost = false,
  notes = "",
  rationale = "",
  onCPTCodeChange,
  onCostRangeChange,
  onCPTLookup,
  onIsManualCostChange,
  onNotesChange,
  onRationaleChange
}: CostDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cost Details</h3>
        <div className="flex items-center space-x-2">
          <Switch 
            id="manual-cost" 
            checked={isManualCost}
            onCheckedChange={onIsManualCostChange}
          />
          <Label htmlFor="manual-cost">Manual Cost Override</Label>
        </div>
      </div>

      {!isManualCost ? (
        <>
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
        </>
      ) : (
        <div className="space-y-2">
          <Label>Manual Cost</Label>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Cost Value</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={costRange.average}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  onCostRangeChange('low', value);
                  onCostRangeChange('average', value);
                  onCostRangeChange('high', value);
                }}
                placeholder="Enter cost"
              />
              <p className="text-sm text-gray-500 mt-1">
                This value will be used for low, average, and high cost calculations.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label>Notes/Rationale</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
          placeholder="Enter notes or rationale for this care item"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
