
import { CostRange } from "@/types/lifecare";

export interface CPTFee {
  cptCode: string;
  description: string;
  costRange: CostRange;
}

export interface FacilityFee {
  codeType: 'APC' | 'ASC' | 'Outpatient';
  code: string;
  feeSource: string;
  fee: number;
}

export interface InterventionalFormProps {
  onFrequencyChange: (field: string, value: any) => void;
  frequencyDetails: any;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  onSubmit?: (data: any) => void;
}
