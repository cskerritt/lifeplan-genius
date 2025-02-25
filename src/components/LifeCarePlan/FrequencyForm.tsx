
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
  // Add new fields for ranges
  lowFrequencyPerYear: number;
  highFrequencyPerYear: number;
  lowDurationYears: number;
  highDurationYears: number;
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
        const startAge = Math.floor(ageData.ageToday);
        onFrequencyChange('startAge', startAge);
      }
      
      // Update stop age based on start age plus duration range
      if (ageData.ageToday !== undefined && frequencyDetails.lowDurationYears > 0) {
        const newStopAge = frequencyDetails.startAge + frequencyDetails.highDurationYears;
        if (frequencyDetails.stopAge === 0 || frequencyDetails.stopAge === 100) {
          onFrequencyChange('stopAge', newStopAge);
        }
      }
    }
  }, [ageData, onFrequencyChange, frequencyDetails.startAge, frequencyDetails.lowDurationYears, frequencyDetails.highDurationYears]);

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
                value={frequencyDetails.stopAge || ''}
                readOnly
                className="bg-gray-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Frequency Range (Times per Year)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Low</Label>
                <Input
                  type="number"
                  min="1"
                  value={frequencyDetails.lowFrequencyPerYear || 1}
                  onChange={(e) => onFrequencyChange('lowFrequencyPerYear', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>High</Label>
                <Input
                  type="number"
                  min="1"
                  value={frequencyDetails.highFrequencyPerYear || 1}
                  onChange={(e) => onFrequencyChange('highFrequencyPerYear', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Duration Range (Years)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Low</Label>
                <Input
                  type="number"
                  min="1"
                  value={frequencyDetails.lowDurationYears || 1}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onFrequencyChange('lowDurationYears', value);
                    // Update stop age when duration changes
                    const newStopAge = frequencyDetails.startAge + value;
                    onFrequencyChange('stopAge', newStopAge);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>High</Label>
                <Input
                  type="number"
                  min="1"
                  value={frequencyDetails.highDurationYears || 1}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onFrequencyChange('highDurationYears', value);
                    // Update stop age when duration changes
                    const newStopAge = frequencyDetails.startAge + value;
                    onFrequencyChange('stopAge', newStopAge);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Frequency (Optional)</Label>
            <Input
              value={frequencyDetails.customFrequency}
              onChange={(e) => onFrequencyChange('customFrequency', e.target.value)}
              placeholder="e.g., 3-5 times per year"
            />
          </div>
        </>
      )}
    </div>
  );
}
