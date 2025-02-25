
import { CostRange } from "@/types/lifecare";

export interface ProfessionalFee {
  cptCode: string;
  description: string;
  costRange: CostRange;
}

export interface AnesthesiaFee {
  asaCode: string;
  feeSource: string;
  fee: number;
}

export interface FacilityFee {
  codeType: 'DRG' | 'APC' | 'Outpatient';
  code: string;
  feeSource: string;
  fee: number;
}

export interface SurgicalFormProps {
  onFrequencyChange: (field: string, value: any) => void;
  frequencyDetails: any;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  onSubmit?: (data: any) => void;
}
