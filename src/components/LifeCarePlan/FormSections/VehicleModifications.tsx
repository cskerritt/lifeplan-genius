
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car } from "lucide-react";
import { useState } from "react";

interface VehicleModificationsProps {
  onCostChange: (value: number) => void;
  onTypeChange: (value: string) => void;
}

export function VehicleModifications({ onCostChange, onTypeChange }: VehicleModificationsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Car className="mr-2 h-4 w-4" />
        Vehicle Modifications
      </Button>

      {isOpen && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Modification Type</Label>
            <Select onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select modification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="costDiscrepancy">
                  Vehicle Cost Discrepancy (e.g., Sedan to Minivan)
                </SelectItem>
                <SelectItem value="accessibilityMods">
                  Accessibility Modifications
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cost ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              onChange={(e) => onCostChange(parseFloat(e.target.value) || 0)}
              placeholder="Enter modification cost"
            />
          </div>
        </div>
      )}
    </div>
  );
}
