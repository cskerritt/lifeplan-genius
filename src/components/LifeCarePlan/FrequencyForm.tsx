
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AgeIncrement, FrequencyDetails } from "@/types/lifecare";
import { AgeIncrementManager } from "./FormSections/AgeIncrementManager";
import { FrequencyInputs } from "./FormSections/FrequencyInputs";
import { DurationInputs } from "./FormSections/DurationInputs";
import { CustomFrequencyInput } from "./FormSections/CustomFrequencyInput";

interface FrequencyFormProps {
  frequencyDetails: FrequencyDetails;
  onFrequencyChange: (field: keyof FrequencyDetails, value: number | boolean | string) => void;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  
  // Age increment props
  useAgeIncrements: boolean;
  onUseAgeIncrementsChange: (useAgeIncrements: boolean) => void;
  ageIncrements: AgeIncrement[];
  onAgeIncrementsChange: (ageIncrements: AgeIncrement[]) => void;
  currentAge: number;
}

export function FrequencyForm({
  frequencyDetails,
  onFrequencyChange,
  lifeExpectancy,
  useAgeIncrements,
  onUseAgeIncrementsChange,
  ageIncrements,
  onAgeIncrementsChange,
  currentAge
}: FrequencyFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded">
        <div>
          <h3 className="text-lg font-semibold">Frequency Details</h3>
          <p className="text-sm text-gray-500">
            Choose between standard frequency or detailed age increments
          </p>
        </div>
        <div className="flex items-center">
          <span className={!useAgeIncrements ? "font-medium" : "text-gray-500"}>Standard</span>
          <Switch
            checked={useAgeIncrements}
            onCheckedChange={onUseAgeIncrementsChange}
            className="mx-2"
          />
          <span className={useAgeIncrements ? "font-medium" : "text-gray-500"}>Age Increments</span>
        </div>
      </div>

      {useAgeIncrements ? (
        <AgeIncrementManager
          ageIncrements={ageIncrements}
          onAgeIncrementsChange={onAgeIncrementsChange}
          minAge={currentAge}
          maxAge={parseInt(lifeExpectancy) || 100}
        />
      ) : (
        <>
          <div className="space-y-2">
            <FrequencyInputs 
              frequencyDetails={frequencyDetails}
              onFrequencyChange={onFrequencyChange}
            />
          </div>

          <div className="space-y-2">
            <DurationInputs 
              frequencyDetails={frequencyDetails}
              onFrequencyChange={onFrequencyChange}
              lifeExpectancy={lifeExpectancy}
            />
          </div>

          <CustomFrequencyInput 
            frequencyDetails={frequencyDetails}
            onFrequencyChange={onFrequencyChange}
          />
          
          <div className="space-y-2">
            <Label>One-time Item</Label>
            <input
              type="checkbox"
              checked={frequencyDetails.isOneTime}
              onChange={(e) => onFrequencyChange('isOneTime', e.target.checked)}
              className="ml-2"
            />
          </div>
        </>
      )}

    </div>
  );
}
