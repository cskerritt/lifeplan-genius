
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
import { CareCategory, CareItem, CostRange, CostResource } from "@/types/lifecare";
import { useState } from "react";

interface PlanFormProps {
  onSubmit: (item: Omit<CareItem, "id" | "annualCost">) => void;
}

const PlanForm = ({ onSubmit }: PlanFormProps) => {
  const [category, setCategory] = useState<CareCategory>("physician");
  const [costResources, setCostResources] = useState<CostResource[]>([
    { name: "", cost: 0 },
    { name: "", cost: 0 },
    { name: "", cost: 0 },
  ]);
  const [costRange, setCostRange] = useState<CostRange>({
    low: 0,
    average: 0,
    high: 0,
  });

  const isMultiSourceCategory = (cat: CareCategory) => {
    return ["transportation", "supplies", "dme"].includes(cat);
  };

  const updateCostResource = (index: number, field: keyof CostResource, value: string | number) => {
    const newResources = [...costResources];
    if (field === 'cost') {
      newResources[index] = { ...newResources[index], [field]: Number(value) };
    } else {
      newResources[index] = { ...newResources[index], [field]: value };
    }
    setCostResources(newResources);

    // Auto-calculate cost range for special categories
    if (isMultiSourceCategory(category)) {
      const costs = newResources.map(r => r.cost).filter(c => c > 0);
      if (costs.length > 0) {
        const low = Math.min(...costs);
        const high = Math.max(...costs);
        const average = (low + high) / 2;
        setCostRange({ low, average, high });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const item = {
      category: formData.get("category") as CareCategory,
      service: formData.get("service") as string,
      frequency: formData.get("frequency") as string,
      cptCode: formData.get("cptCode") as string,
      costPerUnit: Number(formData.get("costAverage")),
      costRange: {
        low: Number(formData.get("costLow")),
        average: Number(formData.get("costAverage")),
        high: Number(formData.get("costHigh")),
      },
      costResources: isMultiSourceCategory(category) ? costResources : undefined
    };

    onSubmit(item);
    form.reset();
    setCostRange({ low: 0, average: 0, high: 0 });
    setCostResources([
      { name: "", cost: 0 },
      { name: "", cost: 0 },
      { name: "", cost: 0 },
    ]);
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
              <Select 
                name="category" 
                value={category}
                onValueChange={(value: CareCategory) => setCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physician">Physician Services</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="surgical">Surgical Services</SelectItem>
                  <SelectItem value="dme">Prosthetics & DME</SelectItem>
                  <SelectItem value="supplies">Aids & Supplies</SelectItem>
                  <SelectItem value="homeCare">Home Care</SelectItem>
                  <SelectItem value="homeModification">Home Modifications</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
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
          </div>
          
          {isMultiSourceCategory(category) ? (
            <div className="space-y-4">
              <Label>Cost Resources</Label>
              {costResources.map((resource, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`resourceName${index}`}>Source Name</Label>
                    <Input
                      id={`resourceName${index}`}
                      value={resource.name}
                      onChange={(e) => updateCostResource(index, 'name', e.target.value)}
                      placeholder="Enter source name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`resourceCost${index}`}>Cost</Label>
                    <Input
                      id={`resourceCost${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={resource.cost}
                      onChange={(e) => updateCostResource(index, 'cost', e.target.value)}
                      placeholder="Enter cost"
                    />
                  </div>
                </div>
              ))}
              
              <input type="hidden" name="costLow" value={costRange.low} />
              <input type="hidden" name="costAverage" value={costRange.average} />
              <input type="hidden" name="costHigh" value={costRange.high} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Cost Range</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="costLow">Low</Label>
                  <Input
                    id="costLow"
                    name="costLow"
                    type="number"
                    placeholder="Minimum cost"
                    min="0"
                    step="0.01"
                    value={costRange.low}
                    onChange={(e) =>
                      setCostRange({ ...costRange, low: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="costAverage">Average</Label>
                  <Input
                    id="costAverage"
                    name="costAverage"
                    type="number"
                    placeholder="Average cost"
                    min="0"
                    step="0.01"
                    value={costRange.average}
                    onChange={(e) =>
                      setCostRange({ ...costRange, average: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="costHigh">High</Label>
                  <Input
                    id="costHigh"
                    name="costHigh"
                    type="number"
                    placeholder="Maximum cost"
                    min="0"
                    step="0.01"
                    value={costRange.high}
                    onChange={(e) =>
                      setCostRange({ ...costRange, high: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-medical-500 hover:bg-medical-600">
            Add Item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlanForm;
