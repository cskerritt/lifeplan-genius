
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrequencyDetails } from "@/types/lifecare";

interface CustomFrequencyInputProps {
  frequencyDetails: FrequencyDetails;
  onFrequencyChange: (field: keyof FrequencyDetails, value: string) => void;
}

export function CustomFrequencyInput({ frequencyDetails, onFrequencyChange }: CustomFrequencyInputProps) {
  return (
    <div className="space-y-2">
      <Label>Custom Frequency</Label>
      <Input
        value={frequencyDetails.customFrequency}
        onChange={(e) => onFrequencyChange('customFrequency', e.target.value)}
        placeholder="e.g., 2-3x per year 5-10 years"
      />
    </div>
  );
}
