
import { useState } from "react";
import { ProfessionalFeesForm } from "./ProfessionalFeesForm";
import { AnesthesiaFeesForm } from "./AnesthesiaFeesForm";
import { FacilityFeesForm } from "./FacilityFeesForm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { FrequencyForm } from "../FrequencyForm";
import { supabase } from "@/integrations/supabase/client";

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
        onCPTLookup={async (code) => {
          const { data: cptData } = await supabase
            .rpc('validate_cpt_code', { code_to_check: code });
          return cptData;
        }}
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
