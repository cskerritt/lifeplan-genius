
import { useState } from "react";
import { CPTFeesForm } from "./CPTFeesForm";
import { FacilityFeesForm } from "../SurgicalForm/FacilityFeesForm";
import { Separator } from "@/components/ui/separator";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { FrequencyForm } from "../FrequencyForm";
import { Button } from "@/components/ui/button";
import { FrequencyToggle } from "../SurgicalForm/components/FrequencyToggle";
import { useInterventionalCosts } from "./hooks/useInterventionalCosts";
import { InterventionalFormProps, CPTFee, FacilityFee } from "./types";

export function InterventionalForm({
  onFrequencyChange,
  frequencyDetails,
  dateOfBirth,
  dateOfInjury,
  lifeExpectancy,
  onSubmit
}: InterventionalFormProps) {
  const [showFrequency, setShowFrequency] = useState(false);
  const [cptFees, setCptFees] = useState<CPTFee[]>([]);
  const [facilityFees, setFacilityFees] = useState<FacilityFee[]>([]);
  const { lookupCPTCode } = useCostCalculations();
  const { totalCostRange } = useInterventionalCosts(cptFees, facilityFees);

  const handleSubmit = () => {
    if (onSubmit) {
      const cptDescriptions = cptFees.map(f => `${f.cptCode}: ${f.description}`);
      const facilityDescriptions = facilityFees.map(f => `${f.codeType} ${f.code}`);

      const description = [
        ...cptDescriptions,
        ...facilityDescriptions
      ].filter(Boolean).join(' | ');

      const frequency = showFrequency 
        ? `${frequencyDetails.lowFrequencyPerYear}-${frequencyDetails.highFrequencyPerYear}x per year` 
        : "One-time";

      const annualCost = showFrequency
        ? totalCostRange.average * frequencyDetails.highFrequencyPerYear
        : totalCostRange.average;

      onSubmit({
        service: description || "Interventional Procedure",
        category: "interventional",
        frequency,
        cptCode: cptFees.map(f => f.cptCode).join(', '),
        costRange: totalCostRange,
        costPerUnit: totalCostRange.average,
        annualCost
      });
    }
  };

  return (
    <div className="space-y-6">
      <CPTFeesForm
        fees={cptFees}
        onAddFee={(fee) => setCptFees([...cptFees, fee])}
        onRemoveFee={(index) => {
          const newFees = [...cptFees];
          newFees.splice(index, 1);
          setCptFees(newFees);
        }}
        onCPTLookup={lookupCPTCode}
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
          disabled={!cptFees.length}
        >
          Add Interventional Procedure
        </Button>
      </div>
    </div>
  );
}
