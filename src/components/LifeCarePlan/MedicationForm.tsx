
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MedicationDetails } from "@/types/lifecare";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface MedicationFormProps {
  medicationDetails: MedicationDetails;
  onMedicationChange: (field: keyof Omit<MedicationDetails, "pharmacyPrices">, value: string) => void;
  onPharmacyPriceChange: (index: number, field: "name" | "cost", value: string | number) => void;
}

export function MedicationForm({
  medicationDetails,
  onMedicationChange,
  onPharmacyPriceChange,
}: MedicationFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Medication Name</Label>
          <Input
            value={medicationDetails.name}
            onChange={(e) => onMedicationChange("name", e.target.value)}
            placeholder="Enter medication name"
          />
        </div>
        <div>
          <Label>Dose</Label>
          <Input
            value={medicationDetails.dose}
            onChange={(e) => onMedicationChange("dose", e.target.value)}
            placeholder="Enter dose"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Pharmacy Prices</Label>
        {medicationDetails.pharmacyPrices.map((price, index) => (
          <div key={index} className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pharmacy Name</Label>
              <Input
                value={price.name}
                onChange={(e) => onPharmacyPriceChange(index, "name", e.target.value)}
                placeholder="Enter pharmacy name"
              />
            </div>
            <div>
              <Label>Cost per Unit</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price.cost}
                onChange={(e) => onPharmacyPriceChange(index, "cost", parseFloat(e.target.value) || 0)}
                placeholder="Enter cost"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
