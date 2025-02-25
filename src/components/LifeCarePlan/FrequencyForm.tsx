
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import { useAgeCalculations } from "@/hooks/useAgeCalculations";

interface FrequencyDetails {
  startAge: number;
  stopAge: number;
  timesPerYear: number;
  isOneTime: boolean;
  customFrequency: string;
}

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
  dateOfBirth,
  dateOfInjury,
  lifeExpectancy
}: FrequencyFormProps) {
  const ageData = useAgeCalculations({
    dateOfBirth,
    dateOfInjury,
    lifeExpectancy
  });

  // Effect to update ages when ageData changes
  useEffect(() => {
    if (ageData.ageToday !== undefined) {
      // Only update start age if it hasn't been set yet
      if (frequencyDetails.startAge === 0) {
        onFrequencyChange('startAge', Math.floor(ageData.ageToday));
      }
      
      // Only update stop age if it hasn't been manually set (still at default value)
      if (ageData.projectedAgeAtDeath !== undefined && frequencyDetails.stopAge === 100) {
        onFrequencyChange('stopAge', Math.ceil(ageData.projectedAgeAtDeath));
      }
    }
  }, [ageData, onFrequencyChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Frequency & Duration</h3>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isOneTime"
          checked={frequencyDetails.isOneTime}
          onCheckedChange={(checked) => 
            onFrequencyChange('isOneTime', checked === true)
          }
        />
        <Label htmlFor="isOneTime">One-time cost</Label>
      </div>

      {!frequencyDetails.isOneTime && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Age</Label>
              <Input
                type="number"
                min="0"
                max="150"
                value={frequencyDetails.startAge}
                onChange={(e) => onFrequencyChange('startAge', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Stop Age</Label>
              <Input
                type="number"
                min="0"
                max="150"
                value={frequencyDetails.stopAge}
                onChange={(e) => onFrequencyChange('stopAge', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Times per Year</Label>
              <Input
                type="number"
                min="1"
                value={frequencyDetails.timesPerYear}
                onChange={(e) => onFrequencyChange('timesPerYear', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Frequency (Optional)</Label>
              <Input
                value={frequencyDetails.customFrequency}
                onChange={(e) => onFrequencyChange('customFrequency', e.target.value)}
                placeholder="e.g., Every 3 months"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
