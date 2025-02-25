
import { Button } from "@/components/ui/button";
import {
  CareCategory,
  CareItem,
  CostRange,
  CostResource,
  MedicationDetails,
} from "@/types/lifecare";
import { useState } from "react";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { Separator } from "@/components/ui/separator";
import { FrequencyForm } from "./FrequencyForm";
import { MedicationForm } from "./MedicationForm";
import { CategorySelect } from "./FormSections/CategorySelect";
import { CostDetails } from "./FormSections/CostDetails";

interface PlanFormProps {
  onSubmit: (item: Omit<CareItem, "id" | "annualCost">) => void;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
}

interface FrequencyDetails {
  startAge: number;
  stopAge: number;
  timesPerYear: number;
  isOneTime: boolean;
  customFrequency: string;
  lowFrequencyPerYear: number;
  highFrequencyPerYear: number;
  lowDurationYears: number;
  highDurationYears: number;
}

const PlanForm = ({ onSubmit, dateOfBirth, dateOfInjury, lifeExpectancy }: PlanFormProps) => {
  const [category, setCategory] = useState<CareCategory>("physicianEvaluation");
  const [service, setService] = useState("");
  const [cptCode, setCptCode] = useState("");
  const [frequencyDetails, setFrequencyDetails] = useState<FrequencyDetails>({
    startAge: 0,
    stopAge: 100,
    timesPerYear: 1,
    isOneTime: false,
    customFrequency: "",
    lowFrequencyPerYear: 1,
    highFrequencyPerYear: 1,
    lowDurationYears: 1,
    highDurationYears: 1
  });
  const [medicationDetails, setMedicationDetails] = useState<MedicationDetails>({
    name: "",
    dose: "",
    frequency: "",
    duration: "",
    pharmacyPrices: [
      { name: "", cost: 0 },
      { name: "", cost: 0 },
      { name: "", cost: 0 },
      { name: "", cost: 0 },
    ]
  });
  const [costRange, setCostRange] = useState<CostRange>({
    low: 0,
    average: 0,
    high: 0,
  });
  
  const { lookupCPTCode } = useCostCalculations();

  const handleFrequencyChange = (field: keyof FrequencyDetails, value: number | boolean | string) => {
    setFrequencyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMedicationChange = (field: keyof Omit<MedicationDetails, "pharmacyPrices">, value: string) => {
    setMedicationDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePharmacyPriceChange = (index: number, field: "name" | "cost", value: string | number) => {
    setMedicationDetails(prev => {
      const newPrices = [...prev.pharmacyPrices];
      newPrices[index] = { ...newPrices[index], [field]: value };
      return { ...prev, pharmacyPrices: newPrices };
    });
  };

  const handleCostRangeChange = (field: keyof CostRange, value: number) => {
    setCostRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCPTLookup = async () => {
    if (cptCode.trim()) {
      try {
        const cptData = await lookupCPTCode(cptCode);
        if (cptData && Array.isArray(cptData) && cptData.length > 0) {
          const result = cptData[0];
          if (result.pfr_75th) {
            setCostRange({
              low: result.pfr_50th,
              average: result.pfr_75th,
              high: result.pfr_90th
            });
            setService(result.code_description || '');
          }
        }
      } catch (error) {
        console.error('Error looking up CPT code:', error);
      }
    }
  };

  const calculateFrequencyString = () => {
    if (frequencyDetails.isOneTime) {
      return "One-time";
    }
    if (frequencyDetails.customFrequency) {
      return frequencyDetails.customFrequency;
    }
    return `${frequencyDetails.lowFrequencyPerYear}-${frequencyDetails.highFrequencyPerYear}x per year`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const frequency = calculateFrequencyString();
    const itemData: Omit<CareItem, "id" | "annualCost"> = {
      category,
      service: category === "medication" ? medicationDetails.name : service,
      frequency,
      cptCode,
      costPerUnit: costRange.average,
      costRange,
      costResources: category === "medication" ? medicationDetails.pharmacyPrices : undefined
    };

    onSubmit(itemData);
    
    // Reset form
    setService("");
    setCptCode("");
    setFrequencyDetails({
      startAge: 0,
      stopAge: 100,
      timesPerYear: 1,
      isOneTime: false,
      customFrequency: "",
      lowFrequencyPerYear: 1,
      highFrequencyPerYear: 1,
      lowDurationYears: 1,
      highDurationYears: 1
    });
    setCostRange({ low: 0, average: 0, high: 0 });
    setMedicationDetails({
      name: "",
      dose: "",
      frequency: "",
      duration: "",
      pharmacyPrices: [
        { name: "", cost: 0 },
        { name: "", cost: 0 },
        { name: "", cost: 0 },
        { name: "", cost: 0 },
      ]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CategorySelect
        category={category}
        service={service}
        onCategoryChange={setCategory}
        onServiceChange={setService}
      />

      <Separator className="my-4" />

      <FrequencyForm
        frequencyDetails={frequencyDetails}
        onFrequencyChange={handleFrequencyChange}
        dateOfBirth={dateOfBirth}
        dateOfInjury={dateOfInjury}
        lifeExpectancy={lifeExpectancy}
      />

      <Separator className="my-4" />

      {category === "medication" ? (
        <MedicationForm
          medicationDetails={medicationDetails}
          onMedicationChange={handleMedicationChange}
          onPharmacyPriceChange={handlePharmacyPriceChange}
        />
      ) : category !== "surgical" && (
        <CostDetails
          cptCode={cptCode}
          costRange={costRange}
          onCPTCodeChange={setCptCode}
          onCostRangeChange={handleCostRangeChange}
          onCPTLookup={handleCPTLookup}
        />
      )}

      <Button type="submit" className="w-full bg-medical-500 hover:bg-medical-600">
        Add Item
      </Button>
    </form>
  );
};

export default PlanForm;
