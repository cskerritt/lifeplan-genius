
import { useState, useEffect } from "react";
import { ProfessionalFeesForm } from "./ProfessionalFeesForm";
import { AnesthesiaFeesForm } from "./AnesthesiaFeesForm";
import { FacilityFeesForm } from "./FacilityFeesForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { FrequencyForm } from "../FrequencyForm";
import { Button } from "@/components/ui/button";
import { CostRange } from "@/types/lifecare";

interface SurgicalFormProps {
  onFrequencyChange: (field: string, value: any) => void;
  frequencyDetails: any;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
  onSubmit?: (data: any) => void;
}

export function SurgicalForm({
  onFrequencyChange,
  frequencyDetails,
  dateOfBirth,
  dateOfInjury,
  lifeExpectancy,
  onSubmit
}: SurgicalFormProps) {
  const [showFrequency, setShowFrequency] = useState(false);
  const [professionalFees, setProfessionalFees] = useState([]);
  const [anesthesiaFees, setAnesthesiaFees] = useState([]);
  const [facilityFees, setFacilityFees] = useState([]);
  const { lookupCPTCode } = useCostCalculations();
  const [totalCostRange, setTotalCostRange] = useState<CostRange>({
    low: 0,
    average: 0,
    high: 0
  });

  useEffect(() => {
    calculateTotalCosts();
  }, [professionalFees, anesthesiaFees, facilityFees]);

  const calculateTotalCosts = () => {
    let totalLow = 0;
    let totalHigh = 0;
    let totalAverage = 0;

    // Sum professional fees
    professionalFees.forEach(fee => {
      totalLow += fee.costRange.low;
      totalHigh += fee.costRange.high;
      totalAverage += fee.costRange.average;
    });

    // Sum anesthesia fees
    anesthesiaFees.forEach(fee => {
      const feeAmount = fee.fee;
      totalLow += feeAmount;
      totalHigh += feeAmount;
      totalAverage += feeAmount;
    });

    // Sum facility fees
    facilityFees.forEach(fee => {
      const feeAmount = fee.fee;
      totalLow += feeAmount;
      totalHigh += feeAmount;
      totalAverage += feeAmount;
    });

    setTotalCostRange({
      low: totalLow,
      average: totalAverage,
      high: totalHigh
    });
  };

  const handleSubmit = () => {
    if (onSubmit) {
      const description = [
        professionalFees.map(f => `${f.cptCode}: ${f.description}`).join(', '),
        anesthesiaFees.map(f => `ASA ${f.asaCode}`).join(', '),
        facilityFees.map(f => `${f.codeType} ${f.code}`).join(', ')
      ].filter(Boolean).join(' | ');

      onSubmit({
        service: description || "Surgical Procedure",
        category: "surgical",
        frequency: showFrequency ? `${frequencyDetails.lowFrequencyPerYear}-${frequencyDetails.highFrequencyPerYear}x per year` : "One-time",
        cptCode: professionalFees.map(f => f.cptCode).join(', '),
        costRange: totalCostRange,
        costPerUnit: totalCostRange.average
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

      <div className="flex items-center space-x-2">
        <Switch
          checked={showFrequency}
          onCheckedChange={setShowFrequency}
          id="frequency-switch"
        />
        <Label htmlFor="frequency-switch">Multiple Occurrences Expected</Label>
      </div>

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
