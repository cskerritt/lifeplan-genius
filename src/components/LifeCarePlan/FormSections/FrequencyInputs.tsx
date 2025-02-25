
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrequencyDetails } from "@/types/lifecare";

interface FrequencyInputsProps {
  frequencyDetails: FrequencyDetails;
  onFrequencyChange: (field: keyof FrequencyDetails, value: number) => void;
}

export function FrequencyInputs({ frequencyDetails, onFrequencyChange }: FrequencyInputsProps) {
  return (
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
  );
}
