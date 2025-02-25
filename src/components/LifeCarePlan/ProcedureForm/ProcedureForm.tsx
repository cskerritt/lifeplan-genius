
import { useState } from "react";
import { ProfessionalFeesForm } from "../SurgicalForm/ProfessionalFeesForm";
import { AnesthesiaFeesForm } from "../SurgicalForm/AnesthesiaFeesForm";
import { FacilityFeesForm } from "../SurgicalForm/FacilityFeesForm";
import { Separator } from "@/components/ui/separator";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { FrequencyForm } from "../FrequencyForm";
import { Button } from "@/components/ui/button";
import { FrequencyToggle } from "../SurgicalForm/components/FrequencyToggle";
import { useProcedureCosts } from "./hooks/useProcedureCosts";
import { ProcedureFormProps } from "./types";
import { ProfessionalFee, AnesthesiaFee, FacilityFee } from "@/types/lifecare";

export function ProcedureForm({
  type,
  onFrequencyChange,
  frequencyDetails,
  dateOfBirth,
  dateOfInjury,
  lifeExpectancy,
  onSubmit
}: ProcedureFormProps) {
  const [showFrequency, setShowFrequency] = useState(false);
  const [professionalFees, setProfessionalFees] = useState<ProfessionalFee[]>([]);
  const [anesthesiaFees, setAnesthesiaFees] = useState<AnesthesiaFee[]>([]);
  const [facilityFees, setFacilityFees] = useState<FacilityFee[]>([]);
  const { lookupCPTCode } = useCostCalculations();
  const { totalCostRange } = useProcedureCosts(
    professionalFees,
    type === 'surgical' ? anesthesiaFees : [],
    facilityFees
  );

  const handleSubmit = () => {
    if (onSubmit) {
      const professionalDescriptions = professionalFees.map(f => `${f.cptCode}: ${f.description}`);
      const anesthesiaDescriptions = type === 'surgical' 
        ? anesthesiaFees.map(f => `ASA ${f.asaCode}`)
        : [];
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
        service: description || `${type === 'surgical' ? 'Surgical' : 'Interventional'} Procedure`,
        category: type,
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

      {type === 'surgical' && (
        <>
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
        </>
      )}

      <FacilityFeesForm
        fees={facilityFees}
        onAddFee={(fee) => setFacilityFees([...facilityFees, fee])}
        onRemoveFee={(index) => {
          const newFees = [...facilityFees];
          newFees.splice(index, 1);
          setFacilityFees(newFees);
        }}
        procedureType={type}
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
          Add {type === 'surgical' ? 'Surgical' : 'Interventional'} Procedure
        </Button>
      </div>
    </div>
  );
}
