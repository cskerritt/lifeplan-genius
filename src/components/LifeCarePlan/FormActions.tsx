
import { Button } from "@/components/ui/button";
import { CareCategory, CareItem, CostRange, AgeIncrement } from "@/types/lifecare";
import { FormState } from "./types";

interface FormActionsProps {
  category: CareCategory;
  costRange: CostRange;
  formState: FormState;
  onSubmit: (item: Omit<CareItem, "id" | "annualCost">) => void;
  onReset: () => void;
}

export function FormActions({ category, costRange, formState, onSubmit, onReset }: FormActionsProps) {
  const calculateFrequencyString = () => {
    if (formState.frequencyDetails.isOneTime) {
      return "One-time";
    }
    if (formState.frequencyDetails.customFrequency) {
      return formState.frequencyDetails.customFrequency;
    }
    return `${formState.frequencyDetails.lowFrequencyPerYear}-${formState.frequencyDetails.highFrequencyPerYear}x per year`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const frequency = calculateFrequencyString();
    const itemData: Omit<CareItem, "id" | "annualCost"> = {
      category,
      service: category === "medication" ? formState.medicationDetails.name : formState.service,
      frequency,
      cptCode: formState.cptCode,
      costPerUnit: costRange.average,
      costRange,
      costResources: category === "medication" ? formState.medicationDetails.pharmacyPrices : undefined,
      // Add age increments data if enabled
      useAgeIncrements: formState.useAgeIncrements,
      ageIncrements: formState.useAgeIncrements ? formState.ageIncrements : undefined,
      // Add manual cost override and notes fields
      isManualCost: formState.isManualCost,
      notes: formState.notes
    };

    onSubmit(itemData);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" className="w-full bg-medical-500 hover:bg-medical-600">
        Add Item
      </Button>
    </form>
  );
}
