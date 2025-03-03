
import { AgeIncrement, CareItem, FrequencyDetails, MedicationDetails } from "@/types/lifecare";

export interface PlanFormProps {
  onSubmit: (item: Omit<CareItem, "id" | "annualCost">) => void;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
}

export interface FormState {
  service: string;
  cptCode: string;
  frequencyDetails: FrequencyDetails;
  medicationDetails: MedicationDetails;
  useAgeIncrements?: boolean;
  ageIncrements?: AgeIncrement[];
}
