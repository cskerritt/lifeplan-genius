import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareItem } from "@/types/lifecare";

interface PlanFormProps {
  onSubmit: (item: Omit<CareItem, "id" | "annualCost">) => void;
}

const PlanForm = ({ onSubmit }: PlanFormProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const item = {
      category: formData.get("category") as string,
      service: formData.get("service") as string,
      frequency: formData.get("frequency") as string,
      cptCode: formData.get("cptCode") as string,
      costPerUnit: Number(formData.get("cost")),
    };

    onSubmit(item);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Care Item</CardTitle>
        <CardDescription>Add a new item to the life care plan</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical Care</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="therapy">Therapy</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Input id="service" name="service" placeholder="Enter service name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cptCode">CPT/HCPCS Code</Label>
              <Input id="cptCode" name="cptCode" placeholder="Enter code" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Input id="frequency" name="frequency" placeholder="e.g., 2x per week" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost per Unit</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                placeholder="Enter cost"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-medical-500 hover:bg-medical-600">
            Add Item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlanForm;