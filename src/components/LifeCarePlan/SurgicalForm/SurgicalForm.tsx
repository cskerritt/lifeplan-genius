
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

interface ProfessionalFee {
  cptCode: string;
  description: string;
  costRange: CostRange;
}

interface AnesthesiaFee {
  asaCode: string;
  feeSource: string;
  fee: number;
}

interface FacilityFee {
  codeType: 'DRG' | 'APC' | 'Outpatient';
  code: string;
  feeSource: string;
  fee: number;
}

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
  const [professionalFees, setProfessionalFees] = useState<ProfessionalFee[]>([]);
  const [anesthesiaFees, setAnesthesiaFees] = useState<AnesthesiaFee[]>([]);
  const [facilityFees, setFacilityFees] = useState<FacilityFee[]>([]);
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
    console.log('Calculating totals with:', {
      professionalFees,
      anesthesiaFees,
      facilityFees
    });

    // Calculate professional fees totals
    const profLow = professionalFees.reduce((sum, fee) => sum + fee.costRange.low, 0);
    const profHigh = professionalFees.reduce((sum, fee) => sum + fee.costRange.high, 0);
    const profAvg = professionalFees.reduce((sum, fee) => sum + fee.costRange.average, 0);

    // Calculate anesthesia fees total (use same value for low/avg/high since it's a fixed fee)
    const anesthesiaTotal = anesthesiaFees.reduce((sum, fee) => sum + fee.fee, 0);

    // Calculate facility fees total (use same value for low/avg/high since it's a fixed fee)
    const facilityTotal = facilityFees.reduce((sum, fee) => sum + fee.fee, 0);

    // Sum all components
    const totalLow = profLow + anesthesiaTotal + facilityTotal;
    const totalHigh = profHigh + anesthesiaTotal + facilityTotal;
    const totalAverage = profAvg + anesthesiaTotal + facilityTotal;

    console.log('Fee totals:', {
      professional: { low: profLow, high: profHigh, avg: profAvg },
      anesthesia: anesthesiaTotal,
      facility: facilityTotal,
      final: { low: totalLow, high: totalHigh, average: totalAverage }
    });

    setTotalCostRange({
      low: totalLow,
      average: totalAverage,
      high: totalHigh
    });
  };

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

      console.log('Submitting surgical procedure with:', {
        description,
        costRange: totalCostRange,
        fees: {
          professional: professionalFees,
          anesthesia: anesthesiaFees,
          facility: facilityFees
        }
      });

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
