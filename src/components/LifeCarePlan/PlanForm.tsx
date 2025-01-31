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

const PlanForm = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Care Item</CardTitle>
        <CardDescription>
          Add a new item to the life care plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
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
              <Input id="service" placeholder="Enter service name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Input id="frequency" placeholder="e.g., 2x per week" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost per Unit</Label>
              <Input
                id="cost"
                type="number"
                placeholder="Enter cost"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <Button className="w-full bg-medical-500 hover:bg-medical-600">
            Add Item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PlanForm;