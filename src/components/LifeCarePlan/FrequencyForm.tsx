
import { Label } from "@/components/ui/label";
import { FrequencyDetails } from "@/types/lifecare";
import { FrequencyInputs } from "./FormSections/FrequencyInputs";
import { DurationInputs } from "./FormSections/DurationInputs";
import { CustomFrequencyInput } from "./FormSections/CustomFrequencyInput";

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
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Frequency Details</h3>

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
    </div>
  );
}
