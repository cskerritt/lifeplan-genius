
import { FrequencyDetails } from "@/types/lifecare";

export interface SurgicalFormProps {
  onFrequencyChange: (field: string, value: any) => void;
  frequencyDetails: FrequencyDetails;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  onSubmit?: (data: any) => void;
}
