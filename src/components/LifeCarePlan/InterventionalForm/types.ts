
import { FrequencyDetails } from "@/types/lifecare";

export interface InterventionalFormProps {
  onFrequencyChange: (field: keyof FrequencyDetails, value: any) => void;
  frequencyDetails: FrequencyDetails;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  onSubmit?: (data: any) => void;
}
