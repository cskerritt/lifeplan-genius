
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrequencyDetails } from "@/types/lifecare";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface FrequencyInputsProps {
  frequencyDetails: FrequencyDetails;
  onFrequencyChange: (field: keyof FrequencyDetails, value: number) => void;
}

export function FrequencyInputs({ frequencyDetails, onFrequencyChange }: FrequencyInputsProps) {
  const handleSingleFrequency = (value: number) => {
    onFrequencyChange('lowFrequencyPerYear', value);
    onFrequencyChange('highFrequencyPerYear', value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Low Frequency (per year)</Label>
          <Input
            type="number"
            min="1"
            value={frequencyDetails.lowFrequencyPerYear}
            onChange={(e) => onFrequencyChange('lowFrequencyPerYear', parseInt(e.target.value))}
          />
        </div>
        <div>
          <Label>High Frequency (per year)</Label>
          <Input
            type="number"
            min="1"
            value={frequencyDetails.highFrequencyPerYear}
            onChange={(e) => onFrequencyChange('highFrequencyPerYear', parseInt(e.target.value))}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 4].map((freq) => (
          <Button
            key={freq}
            type="button"
            variant="outline"
            onClick={() => handleSingleFrequency(freq)}
            className="text-sm"
          >
            <Clock className="mr-2 h-4 w-4" />
            {freq}x per year
          </Button>
        ))}
      </div>
    </div>
  );
}
