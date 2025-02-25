
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SurgicalComponent } from "@/types/lifecare";
import { PlusCircle, Trash2, Search } from "lucide-react";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { useState } from "react";

interface SurgicalComponentFormProps {
  title: string;
  components: SurgicalComponent[];
  type: 'professional' | 'anesthesia' | 'facility';
  onAdd: (type: 'professional' | 'anesthesia' | 'facility') => void;
  onUpdate: (type: 'professional' | 'anesthesia' | 'facility', index: number, field: keyof SurgicalComponent, value: any) => void;
  onRemove: (type: 'professional' | 'anesthesia' | 'facility', index: number) => void;
}

export const SurgicalComponentForm = ({
  title,
  components,
  type,
  onAdd,
  onUpdate,
  onRemove
}: SurgicalComponentFormProps) => {
  const { lookupCPTCode } = useCostCalculations();
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleCPTLookup = async (index: number, cptCode: string) => {
    setIsLookingUp(true);
    try {
      const cptData = await lookupCPTCode(cptCode);
      if (cptData && Array.isArray(cptData) && cptData.length > 0) {
        // Access the first element of the array for the fee data
        const feeData = cptData[0];
        // Update the component with the looked up cost
        const cost = type === 'facility' ? feeData.mfu_75th : feeData.pfr_75th;
        onUpdate(type, index, 'cost', cost);
        
        // If it's a facility fee, automatically add the description
        if (type === 'facility') {
          onUpdate(type, index, 'description', `Facility fee for ${cptCode}`);
        }
      }
    } catch (error) {
      console.error('Error looking up CPT code:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>{title}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAdd(type)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add {title}
        </Button>
      </div>
      {components.map((component, index) => (
        <div key={component.id} className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-5">
            <Label>Description</Label>
            <Input
              value={component.description}
              onChange={(e) => onUpdate(type, index, 'description', e.target.value)}
              placeholder="Enter description"
            />
          </div>
          <div className="col-span-4">
            <Label>CPT Codes</Label>
            <div className="flex gap-2">
              <Input
                value={component.cptCodes.join(', ')}
                onChange={(e) => onUpdate(type, index, 'cptCodes', e.target.value.split(',').map(code => code.trim()))}
                placeholder="Enter CPT codes"
              />
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={() => component.cptCodes[0] && handleCPTLookup(index, component.cptCodes[0])}
                disabled={isLookingUp || !component.cptCodes[0]}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="col-span-2">
            <Label>Cost</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={component.cost}
              onChange={(e) => onUpdate(type, index, 'cost', Number(e.target.value))}
              placeholder="Enter cost"
            />
          </div>
          <div className="col-span-1">
            {index > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(type, index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
