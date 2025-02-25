
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurgicalComponent } from "@/types/lifecare";
import { SurgicalComponentForm } from "./SurgicalComponentForm";

interface SurgicalFormState {
  name: string;
  professionalFees: SurgicalComponent[];
  anesthesiaFees: SurgicalComponent[];
  facilityFees: SurgicalComponent[];
}

interface SurgicalProcedureFormProps {
  surgicalProcedure: SurgicalFormState;
  onNameChange: (name: string) => void;
  onAddComponent: (type: 'professional' | 'anesthesia' | 'facility') => void;
  onUpdateComponent: (type: 'professional' | 'anesthesia' | 'facility', index: number, field: keyof SurgicalComponent, value: any) => void;
  onRemoveComponent: (type: 'professional' | 'anesthesia' | 'facility', index: number) => void;
}

export const SurgicalProcedureForm = ({
  surgicalProcedure,
  onNameChange,
  onAddComponent,
  onUpdateComponent,
  onRemoveComponent
}: SurgicalProcedureFormProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Surgical Procedure Name</Label>
        <Input
          value={surgicalProcedure.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter procedure name"
        />
      </div>

      <SurgicalComponentForm
        title="Professional Fee"
        components={surgicalProcedure.professionalFees}
        type="professional"
        onAdd={onAddComponent}
        onUpdate={onUpdateComponent}
        onRemove={onRemoveComponent}
      />

      <SurgicalComponentForm
        title="Anesthesia Fee"
        components={surgicalProcedure.anesthesiaFees}
        type="anesthesia"
        onAdd={onAddComponent}
        onUpdate={onUpdateComponent}
        onRemove={onRemoveComponent}
      />

      <SurgicalComponentForm
        title="Facility Fee"
        components={surgicalProcedure.facilityFees}
        type="facility"
        onAdd={onAddComponent}
        onUpdate={onUpdateComponent}
        onRemove={onRemoveComponent}
      />
    </div>
  );
};
