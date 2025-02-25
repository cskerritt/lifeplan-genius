
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FrequencyDetails } from "@/types/lifecare";
import { Infinity } from "lucide-react";

interface DurationInputsProps {
  frequencyDetails: FrequencyDetails;
  onFrequencyChange: (field: keyof FrequencyDetails, value: number | string) => void;
  lifeExpectancy: string;
}

export function DurationInputs({ frequencyDetails, onFrequencyChange, lifeExpectancy }: DurationInputsProps) {
  const handleWholeLifeClick = () => {
    const lifeYears = parseInt(lifeExpectancy) || 0;
    if (lifeYears > 0) {
      onFrequencyChange('lowDurationYears', lifeYears);
      onFrequencyChange('highDurationYears', lifeYears);
      onFrequencyChange('customFrequency', `${frequencyDetails.lowFrequencyPerYear}-${frequencyDetails.highFrequencyPerYear}x per year ${lifeYears} years`);
    }
  };

  return (
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
  );
}
