
import { useState } from "react";
import { ProfessionalFeesForm } from "./ProfessionalFeesForm";
import { AnesthesiaFeesForm } from "./AnesthesiaFeesForm";
import { FacilityFeesForm } from "./FacilityFeesForm";
import { Separator } from "@/components/ui/separator";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { FrequencyForm } from "../FrequencyForm";
import { Button } from "@/components/ui/button";
import { FrequencyToggle } from "./components/FrequencyToggle";
import { useSurgicalCosts } from "./hooks/useSurgicalCosts";
import { SurgicalFormProps, ProfessionalFee, AnesthesiaFee, FacilityFee } from "./types";

export function SurgicalForm({
  onFrequencyChange,
  frequencyDetails,
  dateOfBirth,
  dateOfInjury,
  lifeExpectancy,
  onSubmit
}: SurgicalFormProps) {
  const [showFrequency, setShowFrequency] = useState(false);
  const [professionalFees, setProfessionalFees] = useState<ProfessionalFee[]>([]);
  const [anesthesiaFees, setAnesthesiaFees] = useState<AnesthesiaFee[]>([]);
  const [facilityFees, setFacilityFees] = useState<FacilityFee[]>([]);
  const { lookupCPTCode } = useCostCalculations();
  const { totalCostRange } = useSurgicalCosts(professionalFees, anesthesiaFees, facilityFees);

  const handleSubmit = () => {
    if (onSubmit) {
      const professionalDescriptions = professionalFees.map(f => `${f.cptCode}: ${f.description}`);
      const anesthesiaDescriptions = anesthesiaFees.map(f => `ASA ${f.asaCode}`);
      const facilityDescriptions = facilityFees.map(f => `${f.codeType} ${f.code}`);

      const description = [
        ...professionalDescriptions,
        ...anesthesiaDescriptions,
        ...facilityDescriptions
      ].filter(Boolean).join(' | ');

      const frequency = showFrequency 
        ? `${frequencyDetails.lowFrequencyPerYear}-${frequencyDetails.highFrequencyPerYear}x per year` 
        : "One-time";

      const annualCost = showFrequency
        ? totalCostRange.average * frequencyDetails.highFrequencyPerYear
        : totalCostRange.average;

      onSubmit({
        service: description || "Surgical Procedure",
        category: "surgical",
        frequency,
        cptCode: professionalFees.map(f => f.cptCode).join(', '),
        costRange: totalCostRange,
        costPerUnit: totalCostRange.average,
        annualCost
      });
    }
  };

  return (
    <div className="space-y-6">
      <ProfessionalFeesForm
        fees={professionalFees}
        onAddFee={(fee) => setProfessionalFees([...professionalFees, fee])}
        onRemoveFee={(index) => {
          const newFees = [...professionalFees];
          newFees.splice(index, 1);
          setProfessionalFees(newFees);
        }}
        onCPTLookup={lookupCPTCode}
      />

      <Separator className="my-6" />

      <AnesthesiaFeesForm
        fees={anesthesiaFees}
        onAddFee={(fee) => setAnesthesiaFees([...anesthesiaFees, fee])}
        onRemoveFee={(index) => {
          const newFees = [...anesthesiaFees];
          newFees.splice(index, 1);
          setAnesthesiaFees(newFees);
        }}
      />

      <Separator className="my-6" />

      <FacilityFeesForm
        fees={facilityFees}
        onAddFee={(fee) => setFacilityFees([...facilityFees, fee])}
        onRemoveFee={(index) => {
          const newFees = [...facilityFees];
          newFees.splice(index, 1);
          setFacilityFees(newFees);
        }}
      />

      <Separator className="my-6" />

      <FrequencyToggle
        showFrequency={showFrequency}
        onToggle={setShowFrequency}
      />

      {showFrequency && (
        <FrequencyForm
          frequencyDetails={frequencyDetails}
          onFrequencyChange={onFrequencyChange}
          dateOfBirth={dateOfBirth}
          dateOfInjury={dateOfInjury}
          lifeExpectancy={lifeExpectancy}
        />
      )}

      <div className="mt-6">
        <Button 
          onClick={handleSubmit}
          className="w-full"
          disabled={!professionalFees.length}
        >
          Add Surgical Procedure
        </Button>
      </div>
    </div>
  );
}
