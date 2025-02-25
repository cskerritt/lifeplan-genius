
import { FrequencyDetails } from "@/types/lifecare";

export type ProcedureType = 'surgical' | 'interventional';

export interface ProcedureFormProps {
  type: ProcedureType;
  onFrequencyChange: (field: string, value: any) => void;
  frequencyDetails: FrequencyDetails;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  onSubmit?: (data: any) => void;
}
