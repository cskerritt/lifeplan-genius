
import { CostRange } from "@/types/lifecare";

export type ProcedureType = 'surgical' | 'interventional';

export type FacilityCodeType = 'DRG' | 'APC' | 'ASC' | 'Outpatient';

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
  codeType: FacilityCodeType;
  code: string;
  feeSource: string;
  fee: number;
}

export interface ProcedureFormProps {
  type: ProcedureType;
  onFrequencyChange: (field: string, value: any) => void;
  frequencyDetails: any;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  onSubmit?: (data: any) => void;
}
