
import { useState } from "react";
import { ProfessionalFeesForm } from "./ProfessionalFeesForm";
import { AnesthesiaFeesForm } from "./AnesthesiaFeesForm";
import { FacilityFeesForm } from "./FacilityFeesForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { FrequencyForm } from "../FrequencyForm";

interface SurgicalFormProps {
  onFrequencyChange: (field: string, value: any) => void;
  frequencyDetails: any;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: string;
}

export function SurgicalForm({
  onFrequencyChange,
  frequencyDetails,
  dateOfBirth,
  dateOfInjury,
  lifeExpectancy
}: SurgicalFormProps) {
  const [showFrequency, setShowFrequency] = useState(false);
  const [professionalFees, setProfessionalFees] = useState([]);
  const [anesthesiaFees, setAnesthesiaFees] = useState([]);
  const [facilityFees, setFacilityFees] = useState([]);
  
  const { lookupCPTCode } = useCostCalculations();

  const handleCPTLookup = async (code: string) => {
    if (code.trim()) {
      try {
        const cptData = await lookupCPTCode(code);
        if (cptData && Array.isArray(cptData) && cptData.length > 0) {
          const result = cptData[0];
          if (result.pfr_75th) {
            // Handle CPT code data
            console.log('CPT code data:', result);
          }
        }
      } catch (error) {
        console.error('Error looking up CPT code:', error);
      }
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
        onCPTLookup={handleCPTLookup}
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
    </div>
  );
}
