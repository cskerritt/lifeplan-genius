
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrequencyDetails } from "@/types/lifecare";
import { Infinity } from "lucide-react";

interface FrequencyFormProps {
  frequencyDetails: FrequencyDetails;
  onFrequencyChange: (field: keyof FrequencyDetails, value: number | boolean | string) => void;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
}

export function FrequencyForm({
  frequencyDetails,
  onFrequencyChange,
  lifeExpectancy,
}: FrequencyFormProps) {
  const handleWholeLifeClick = () => {
    const lifeYears = parseInt(lifeExpectancy) || 0;
    if (lifeYears > 0) {
      onFrequencyChange('lowDurationYears', lifeYears);
      onFrequencyChange('highDurationYears', lifeYears);
      onFrequencyChange('customFrequency', `${frequencyDetails.lowFrequencyPerYear}-${frequencyDetails.highFrequencyPerYear}x per year ${lifeYears} years`);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Frequency Details</h3>

      <div className="space-y-2">
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
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Low Duration (years)</Label>
            <Input
              type="number"
              min="1"
              value={frequencyDetails.lowDurationYears}
              onChange={(e) => onFrequencyChange('lowDurationYears', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label>High Duration (years)</Label>
            <Input
              type="number"
              min="1"
              value={frequencyDetails.highDurationYears}
              onChange={(e) => onFrequencyChange('highDurationYears', parseInt(e.target.value))}
            />
          </div>
        </div>
        <Button 
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleWholeLifeClick}
          disabled={!lifeExpectancy}
        >
          <Infinity className="mr-2 h-4 w-4" />
          Apply Whole Life Duration ({lifeExpectancy} years)
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Custom Frequency</Label>
        <Input
          value={frequencyDetails.customFrequency}
          onChange={(e) => onFrequencyChange('customFrequency', e.target.value)}
          placeholder="e.g., 2-3x per year 5-10 years"
        />
      </div>

      <div className="space-y-2">
        <Label>One-time Item</Label>
        <input
          type="checkbox"
          checked={frequencyDetails.isOneTime}
          onChange={(e) => onFrequencyChange('isOneTime', e.target.checked)}
          className="ml-2"
        />
      </div>
    </div>
  );
}
