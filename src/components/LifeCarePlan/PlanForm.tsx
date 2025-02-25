
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
import {
  CareCategory,
  CareItem,
  CostRange,
  CostResource,
  VehicleModification,
  MedicationDetails,
} from "@/types/lifecare";
import { useState } from "react";
import { Search } from "lucide-react";
import { SurgicalProcedureForm } from "./SurgicalForm/SurgicalProcedureForm";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { Separator } from "@/components/ui/separator";
import { FrequencyForm } from "./FrequencyForm";
import { MedicationForm } from "./MedicationForm";

interface PlanFormProps {
  onSubmit: (item: Omit<CareItem, "id" | "annualCost">) => void;
}

interface FrequencyDetails {
  startAge: number;
  stopAge: number;
  timesPerYear: number;
  isOneTime: boolean;
  customFrequency: string;
}

const PlanForm = ({ onSubmit }: PlanFormProps) => {
  const [category, setCategory] = useState<CareCategory>("physician");
  const [service, setService] = useState("");
  const [cptCode, setCptCode] = useState("");
  const [frequencyDetails, setFrequencyDetails] = useState<FrequencyDetails>({
    startAge: 0,
    stopAge: 100,
    timesPerYear: 1,
    isOneTime: false,
    customFrequency: "",
  });
  const [medicationDetails, setMedicationDetails] = useState<MedicationDetails>({
    name: "",
    dose: "",
    frequency: "",
    duration: "",
    pharmacyPrices: [
      { name: "", cost: 0 },
      { name: "", cost: 0 },
      { name: "", cost: 0 },
      { name: "", cost: 0 },
    ]
  });
  const [costRange, setCostRange] = useState<CostRange>({
    low: 0,
    average: 0,
    high: 0,
  });
  const [costResources, setCostResources] = useState<CostResource[]>([
    { name: "", cost: 0 },
    { name: "", cost: 0 },
    { name: "", cost: 0 },
  ]);
  
  const { lookupCPTCode } = useCostCalculations();

  const handleFrequencyChange = (field: keyof FrequencyDetails, value: number | boolean | string) => {
    setFrequencyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMedicationChange = (field: keyof Omit<MedicationDetails, "pharmacyPrices">, value: string) => {
    setMedicationDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePharmacyPriceChange = (index: number, field: "name" | "cost", value: string | number) => {
    setMedicationDetails(prev => {
      const newPrices = [...prev.pharmacyPrices];
      newPrices[index] = { ...newPrices[index], [field]: value };
      return { ...prev, pharmacyPrices: newPrices };
    });
  };

  const calculateFrequencyString = () => {
    if (frequencyDetails.isOneTime) {
      return "One-time";
    }
    if (frequencyDetails.customFrequency) {
      return frequencyDetails.customFrequency;
    }
    return `${frequencyDetails.timesPerYear}x per year`;
  };

  const handleCPTLookup = async () => {
    if (cptCode.trim()) {
      try {
        const cptData = await lookupCPTCode(cptCode);
        if (cptData && Array.isArray(cptData) && cptData.length > 0) {
          const result = cptData[0];
          if (result.pfr_75th) {
            setCostRange({
              low: result.pfr_50th,
              average: result.pfr_75th,
              high: result.pfr_90th
            });
            setService(result.code_description || '');
          }
        }
      } catch (error) {
        console.error('Error looking up CPT code:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const frequency = calculateFrequencyString();
    const itemData: Omit<CareItem, "id" | "annualCost"> = {
      category,
      service: category === "medication" ? medicationDetails.name : service,
      frequency,
      cptCode,
      costPerUnit: costRange.average,
      costRange,
      costResources: category === "medication" ? medicationDetails.pharmacyPrices : undefined
    };

    onSubmit(itemData);
    
    // Reset form
    setService("");
    setCptCode("");
    setFrequencyDetails({
      startAge: 0,
      stopAge: 100,
      timesPerYear: 1,
      isOneTime: false,
      customFrequency: "",
    });
    setCostRange({ low: 0, average: 0, high: 0 });
    setMedicationDetails({
      name: "",
      dose: "",
      frequency: "",
      duration: "",
      pharmacyPrices: [
        { name: "", cost: 0 },
        { name: "", cost: 0 },
        { name: "", cost: 0 },
        { name: "", cost: 0 },
      ]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
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
        {category !== "medication" && category !== "surgical" && (
          <div className="space-y-2">
            <Label>Service</Label>
            <Input 
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Enter service name" 
            />
          </div>
        )}
      </div>

      <Separator className="my-4" />

      <FrequencyForm
        frequencyDetails={frequencyDetails}
        onFrequencyChange={handleFrequencyChange}
      />

      <Separator className="my-4" />

      {category === "medication" ? (
        <MedicationForm
          medicationDetails={medicationDetails}
          onMedicationChange={handleMedicationChange}
          onPharmacyPriceChange={handlePharmacyPriceChange}
        />
      ) : category !== "surgical" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cost Details</h3>
          <div className="space-y-2">
            <Label>CPT/HCPCS Code</Label>
            <div className="flex gap-2">
              <Input 
                value={cptCode}
                onChange={(e) => setCptCode(e.target.value)}
                placeholder="Enter code"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCPTLookup}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Cost Range</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Low</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costRange.low}
                  onChange={(e) => setCostRange(prev => ({ ...prev, low: Number(e.target.value) }))}
                  placeholder="Minimum cost"
                />
              </div>
              <div>
                <Label>Average</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costRange.average}
                  onChange={(e) => setCostRange(prev => ({ ...prev, average: Number(e.target.value) }))}
                  placeholder="Average cost"
                />
              </div>
              <div>
                <Label>High</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costRange.high}
                  onChange={(e) => setCostRange(prev => ({ ...prev, high: Number(e.target.value) }))}
                  placeholder="Maximum cost"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full bg-medical-500 hover:bg-medical-600">
        Add Item
      </Button>
    </form>
  );
};

export default PlanForm;
