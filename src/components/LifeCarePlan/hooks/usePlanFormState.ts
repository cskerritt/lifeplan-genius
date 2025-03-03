
import { useState } from "react";
import { AgeIncrement, CareCategory, CostRange, MedicationDetails } from "@/types/lifecare";
import { FormState } from "../types";

export function usePlanFormState() {
  const [category, setCategory] = useState<CareCategory>("physicianEvaluation");
  const [service, setService] = useState("");
  const [cptCode, setCptCode] = useState("");
  const [costRange, setCostRange] = useState<CostRange>({
    low: 0,
    average: 0,
    high: 0,
  });
  const [frequencyDetails, setFrequencyDetails] = useState({
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
  const [useAgeIncrements, setUseAgeIncrements] = useState(false);
  const [ageIncrements, setAgeIncrements] = useState<AgeIncrement[]>([]);

  const resetForm = () => {
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
    setUseAgeIncrements(false);
    setAgeIncrements([]);
  };

  return {
    category,
    setCategory,
    service,
    setService,
    cptCode,
    setCptCode,
    costRange,
    setCostRange,
    frequencyDetails,
    setFrequencyDetails,
    medicationDetails,
    setMedicationDetails,
    useAgeIncrements,
    setUseAgeIncrements,
    ageIncrements,
    setAgeIncrements,
    resetForm
  };
}
