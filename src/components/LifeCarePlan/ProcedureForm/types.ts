
import { CostRange, FacilityCodeType, ProfessionalFee, AnesthesiaFee, FacilityFee } from "@/types/lifecare";

export type ProcedureType = 'surgical' | 'interventional';

export interface ProcedureFormProps {
  type: ProcedureType;
  onFrequencyChange: (field: string, value: any) => void;
  frequencyDetails: any;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  onSubmit?: (data: any) => void;
}
