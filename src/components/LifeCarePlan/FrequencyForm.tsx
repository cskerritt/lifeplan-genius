
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

  // Effect to update ages when ageData or start age changes
  useEffect(() => {
    if (ageData.ageToday !== undefined) {
      // Only update start age if it hasn't been set yet
      if (frequencyDetails.startAge === 0) {
        const startAge = Math.floor(ageData.ageToday);
        onFrequencyChange('startAge', startAge);
      }

      // Calculate stop age based on start age plus life expectancy
      const lifeExpectancyYears = parseFloat(lifeExpectancy);
      if (!isNaN(lifeExpectancyYears)) {
        // Use the current start age plus life expectancy
        const calculatedStopAge = frequencyDetails.startAge + lifeExpectancyYears;
        // Only update stop age if it hasn't been manually set (is 0 or matches previous calculation)
        if (frequencyDetails.stopAge === 0 || 
            frequencyDetails.stopAge === (frequencyDetails.startAge + parseFloat(lifeExpectancy))) {
          onFrequencyChange('stopAge', calculatedStopAge);
        }
      }
    }
  }, [ageData, onFrequencyChange, frequencyDetails.startAge, lifeExpectancy]);

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
                step="0.1"
                value={frequencyDetails.stopAge.toFixed(1)}
                onChange={(e) => onFrequencyChange('stopAge', parseFloat(e.target.value) || 0)}
                className="bg-white"
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
                  value={frequencyDetails.lowFrequencyPerYear}
                  onChange={(e) => onFrequencyChange('lowFrequencyPerYear', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>High</Label>
                <Input
                  type="number"
                  min="1"
                  value={frequencyDetails.highFrequencyPerYear}
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
                  value={frequencyDetails.lowDurationYears}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onFrequencyChange('lowDurationYears', value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>High</Label>
                <Input
                  type="number"
                  min="1"
                  value={frequencyDetails.highDurationYears}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onFrequencyChange('highDurationYears', value);
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
