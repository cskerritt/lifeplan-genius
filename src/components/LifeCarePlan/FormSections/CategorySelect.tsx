
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareCategory } from "@/types/lifecare";
import { Input } from "@/components/ui/input";

interface CategorySelectProps {
  category: CareCategory;
  service: string;
  onCategoryChange: (value: CareCategory) => void;
  onServiceChange: (value: string) => void;
}

export function CategorySelect({
  category,
  service,
  onCategoryChange,
  onServiceChange,
}: CategorySelectProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={category}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="physicianEvaluation">Physician Evaluation</SelectItem>
            <SelectItem value="physicianFollowUp">Physician Follow Up</SelectItem>
            <SelectItem value="therapyEvaluation">Therapy Evaluation</SelectItem>
            <SelectItem value="therapyFollowUp">Therapy Follow Up</SelectItem>
            <SelectItem value="medication">Medication</SelectItem>
            <SelectItem value="surgical">Surgical Services</SelectItem>
            <SelectItem value="dme">Prosthetics & DME</SelectItem>
            <SelectItem value="supplies">Aids & Supplies</SelectItem>
            <SelectItem value="homeCare">Home Care</SelectItem>
            <SelectItem value="homeModification">Home Modifications</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="interventional">Interventional</SelectItem>
            <SelectItem value="diagnostics">Diagnostics</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {category !== "medication" && category !== "surgical" && (
        <div className="space-y-2">
          <Label>Service</Label>
          <Input 
            value={service}
            onChange={(e) => onServiceChange(e.target.value)}
            placeholder="Enter service name" 
          />
        </div>
      )}
    </div>
  );
}
