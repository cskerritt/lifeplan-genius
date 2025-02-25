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
  SurgicalComponent
} from "@/types/lifecare";
import { useState } from "react";
import { PlusCircle, Trash2, Search } from "lucide-react";
import { SurgicalProcedureForm } from "./SurgicalForm/SurgicalProcedureForm";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

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

interface SurgicalFormState {
  name: string;
  professionalFees: SurgicalComponent[];
  anesthesiaFees: SurgicalComponent[];
  facilityFees: SurgicalComponent[];
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
  const [isModifiedVehicle, setIsModifiedVehicle] = useState(false);
  const [vehicleModifications, setVehicleModifications] = useState<VehicleModification[]>([
    { item: "", cost: 0 }
  ]);
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
  const [isSurgical, setIsSurgical] = useState(false);
  const [surgicalProcedure, setSurgicalProcedure] = useState<SurgicalFormState>({
    name: "",
    professionalFees: [{ id: crypto.randomUUID(), type: 'professional', description: '', cptCodes: [], cost: 0 }],
    anesthesiaFees: [{ id: crypto.randomUUID(), type: 'anesthesia', description: '', cptCodes: [], cost: 0 }],
    facilityFees: [{ id: crypto.randomUUID(), type: 'facility', description: '', cptCodes: [], cost: 0 }],
  });
  const { lookupCPTCode } = useCostCalculations();

  const isMultiSourceCategory = (cat: CareCategory) => {
    return ["transportation", "supplies", "dme"].includes(cat);
  };

  const updateCostResource = (index: number, field: keyof CostResource, value: string | number) => {
    const newResources = [...costResources];
    newResources[index] = { ...newResources[index], [field]: value };
    setCostResources(newResources);

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

  const updateVehicleModification = (index: number, field: keyof VehicleModification, value: string | number) => {
    const newMods = [...vehicleModifications];
    newMods[index] = { ...newMods[index], [field]: typeof value === 'string' ? value : Number(value) };
    setVehicleModifications(newMods);

    const total = newMods.reduce((sum, mod) => sum + (mod.cost || 0), 0);
    setCostRange({ low: total, average: total, high: total });
  };

  const addVehicleModification = () => {
    setVehicleModifications([...vehicleModifications, { item: "", cost: 0 }]);
  };

  const removeVehicleModification = (index: number) => {
    const newMods = vehicleModifications.filter((_, i) => i !== index);
    setVehicleModifications(newMods);
  };

  const updateMedicationDetail = (field: keyof Omit<MedicationDetails, "pharmacyPrices">, value: string) => {
    setMedicationDetails(prev => ({ ...prev, [field]: value }));
  };

  const updatePharmacyPrice = (index: number, field: keyof CostResource, value: string | number) => {
    const newPrices = [...medicationDetails.pharmacyPrices];
    newPrices[index] = { ...newPrices[index], [field]: typeof value === 'string' ? value : Number(value) };
    
    const costs = newPrices.map(p => p.cost).filter(c => c > 0);
    if (costs.length > 0) {
      const low = Math.min(...costs);
      const high = Math.max(...costs);
      const average = (low + high) / 2;
      setCostRange({ low, average, high });
    }

    setMedicationDetails(prev => ({ ...prev, pharmacyPrices: newPrices }));
  };

  const handleSurgicalNameChange = (name: string) => {
    setSurgicalProcedure(prev => ({ ...prev, name }));
  };

  const addSurgicalComponent = (type: 'professional' | 'anesthesia' | 'facility') => {
    setSurgicalProcedure(prev => {
      const newComponent = {
        id: crypto.randomUUID(),
        type,
        description: '',
        cptCodes: [],
        cost: 0
      };

      switch (type) {
        case 'professional':
          return { ...prev, professionalFees: [...prev.professionalFees, newComponent] };
        case 'anesthesia':
          return { ...prev, anesthesiaFees: [...prev.anesthesiaFees, newComponent] };
        case 'facility':
          return { ...prev, facilityFees: [...prev.facilityFees, newComponent] };
      }
    });
  };

  const updateSurgicalComponent = (
    type: 'professional' | 'anesthesia' | 'facility',
    index: number,
    field: keyof SurgicalComponent,
    value: any
  ) => {
    setSurgicalProcedure(prev => {
      const components = type === 'professional' ? prev.professionalFees :
                        type === 'anesthesia' ? prev.anesthesiaFees :
                        prev.facilityFees;
      
      const updatedComponents = components.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      );

      return {
        ...prev,
        [type === 'professional' ? 'professionalFees' :
         type === 'anesthesia' ? 'anesthesiaFees' : 'facilityFees']: updatedComponents
      };
    });

    const totalProfessional = surgicalProcedure.professionalFees.reduce((sum, fee) => sum + fee.cost, 0);
    const totalAnesthesia = surgicalProcedure.anesthesiaFees.reduce((sum, fee) => sum + fee.cost, 0);
    const totalFacility = surgicalProcedure.facilityFees.reduce((sum, fee) => sum + fee.cost, 0);
    const total = totalProfessional + totalAnesthesia + totalFacility;

    setCostRange({
      low: total * 0.9,
      average: total,
      high: total * 1.1
    });
  };

  const removeSurgicalComponent = (type: 'professional' | 'anesthesia' | 'facility', index: number) => {
    setSurgicalProcedure(prev => {
      const components = type === 'professional' ? prev.professionalFees :
                        type === 'anesthesia' ? prev.anesthesiaFees :
                        prev.facilityFees;
      
      const updatedComponents = components.filter((_, i) => i !== index);

      return {
        ...prev,
        [type === 'professional' ? 'professionalFees' :
         type === 'anesthesia' ? 'anesthesiaFees' : 'facilityFees']: updatedComponents
      };
    });
  };

  const renderCostInputs = () => {
    if (category === "surgical") {
      return (
        <SurgicalProcedureForm
          surgicalProcedure={surgicalProcedure}
          onNameChange={handleSurgicalNameChange}
          onAddComponent={addSurgicalComponent}
          onUpdateComponent={updateSurgicalComponent}
          onRemoveComponent={removeSurgicalComponent}
        />
      );
    }

    if (category === "medication") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Medication Name</Label>
              <Input
                value={medicationDetails.name}
                onChange={(e) => updateMedicationDetail("name", e.target.value)}
                placeholder="Enter medication name"
              />
            </div>
            <div>
              <Label>Dose</Label>
              <Input
                value={medicationDetails.dose}
                onChange={(e) => updateMedicationDetail("dose", e.target.value)}
                placeholder="Enter dose"
              />
            </div>
            <div>
              <Label>Frequency</Label>
              <Input
                value={medicationDetails.frequency}
                onChange={(e) => updateMedicationDetail("frequency", e.target.value)}
                placeholder="Enter frequency"
              />
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                value={medicationDetails.duration}
                onChange={(e) => updateMedicationDetail("duration", e.target.value)}
                placeholder="Enter duration"
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
                    onChange={(e) => updatePharmacyPrice(index, "name", e.target.value)}
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
                    onChange={(e) => updatePharmacyPrice(index, "cost", e.target.value)}
                    placeholder="Enter cost"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (category === "transportation") {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Label>Modified Vehicle?</Label>
            <input
              type="checkbox"
              checked={isModifiedVehicle}
              onChange={(e) => setIsModifiedVehicle(e.target.checked)}
            />
          </div>
          
          {isModifiedVehicle ? (
            <div className="space-y-4">
              {vehicleModifications.map((mod, index) => (
                <div key={index} className="grid grid-cols-8 gap-4">
                  <div className="col-span-5">
                    <Label>Item</Label>
                    <Input
                      value={mod.item}
                      onChange={(e) => updateVehicleModification(index, "item", e.target.value)}
                      placeholder="Enter modification item"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={mod.cost}
                      onChange={(e) => updateVehicleModification(index, "cost", e.target.value)}
                      placeholder="Enter cost"
                    />
                  </div>
                  <div className="col-span-1 flex items-end justify-center">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVehicleModification(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addVehicleModification}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Modification
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>Cost Resources</Label>
              {costResources.map((resource, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Source Name</Label>
                    <Input
                      value={resource.name}
                      onChange={(e) => updateCostResource(index, "name", e.target.value)}
                      placeholder="Enter source name"
                    />
                  </div>
                  <div>
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={resource.cost}
                      onChange={(e) => updateCostResource(index, "cost", e.target.value)}
                      placeholder="Enter cost"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (isMultiSourceCategory(category)) {
      return (
        <div className="space-y-4">
          <Label>Cost Resources</Label>
          {costResources.map((resource, index) => (
            <div key={index} className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source Name</Label>
                <Input
                  value={resource.name}
                  onChange={(e) => updateCostResource(index, "name", e.target.value)}
                  placeholder="Enter source name"
                />
              </div>
              <div>
                <Label>Cost</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={resource.cost}
                  onChange={(e) => updateCostResource(index, "cost", e.target.value)}
                  placeholder="Enter cost"
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
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
              onChange={(e) => setCostRange({ ...costRange, low: Number(e.target.value) })}
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
              onChange={(e) => setCostRange({ ...costRange, average: Number(e.target.value) })}
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
              onChange={(e) => setCostRange({ ...costRange, high: Number(e.target.value) })}
              placeholder="Maximum cost"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleFrequencyChange = (field: keyof FrequencyDetails, value: number | boolean | string) => {
    setFrequencyDetails(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    let itemData: Omit<CareItem, "id" | "annualCost">;
    const frequency = calculateFrequencyString();
    
    if (category === "surgical") {
      const totalProfessional = surgicalProcedure.professionalFees.reduce((sum, fee) => sum + fee.cost, 0);
      const totalAnesthesia = surgicalProcedure.anesthesiaFees.reduce((sum, fee) => sum + fee.cost, 0);
      const totalFacility = surgicalProcedure.facilityFees.reduce((sum, fee) => sum + fee.cost, 0);
      const total = totalProfessional + totalAnesthesia + totalFacility;

      itemData = {
        category,
        service: surgicalProcedure.name,
        frequency: "One-time",
        cptCode: surgicalProcedure.professionalFees.map(fee => fee.cptCodes.join(',')).join(';'),
        costPerUnit: total,
        costRange: {
          low: total * 0.9,
          average: total,
          high: total * 1.1
        }
      };
    } else if (category === "medication") {
      itemData = {
        category,
        service: medicationDetails.name,
        frequency: `${medicationDetails.frequency} - ${medicationDetails.duration}`,
        cptCode: "",
        costPerUnit: costRange.average,
        costRange,
        costResources: medicationDetails.pharmacyPrices
      };
    } else if (category === "transportation" && isModifiedVehicle) {
      itemData = {
        category,
        service: "Modified Vehicle",
        frequency: "One-time",
        cptCode: "",
        costPerUnit: costRange.average,
        costRange,
        costResources: vehicleModifications.map(vm => ({ name: vm.item, cost: vm.cost }))
      };
    } else {
      itemData = {
        category,
        service,
        frequency,
        cptCode,
        costPerUnit: Number(costRange.average),
        costRange,
        costResources: isMultiSourceCategory(category) ? costResources : undefined
      };
    }

    onSubmit(itemData);
    
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
    setCostResources([
      { name: "", cost: 0 },
      { name: "", cost: 0 },
      { name: "", cost: 0 },
    ]);
    setIsSurgical(false);
    setSurgicalProcedure({
      name: "",
      professionalFees: [{ id: crypto.randomUUID(), type: 'professional', description: '', cptCodes: [], cost: 0 }],
      anesthesiaFees: [{ id: crypto.randomUUID(), type: 'anesthesia', description: '', cptCodes: [], cost: 0 }],
      facilityFees: [{ id: crypto.randomUUID(), type: 'facility', description: '', cptCodes: [], cost: 0 }]
    });
    setCostResources([
      { name: "", cost: 0 },
      { name: "", cost: 0 },
      { name: "", cost: 0 },
    ]);
    setIsModifiedVehicle(false);
    setVehicleModifications([{ item: "", cost: 0 }]);
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

  const handleCPTLookup = async () => {
    if (cptCode.trim()) {
      try {
        const cptResult = await lookupCPTCode(cptCode);
        if (cptResult && Array.isArray(cptResult) && cptResult.length > 0) {
          const cptData = cptResult[0];
          if (cptData.pfr_75th) {
            setCostRange({
              low: cptData.pfr_50th,
              average: cptData.pfr_75th,
              high: cptData.pfr_90th
            });
            setService(cptData.code_description || '');
          }
        }
      } catch (error) {
        console.error('Error looking up CPT code:', error);
      }
    }
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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Frequency & Duration</h3>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isOneTime"
            checked={frequencyDetails.isOneTime}
            onCheckedChange={(checked) => 
              handleFrequencyChange('isOneTime', checked === true)
            }
          />
          <Label htmlFor="isOneTime">One-time cost</Label>
        </div>

        {!frequencyDetails.isOneTime && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Age</Label>
                <Input
                  type="number"
                  min="0"
                  max="150"
                  value={frequencyDetails.startAge}
                  onChange={(e) => handleFrequencyChange('startAge', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Stop Age</Label>
                <Input
                  type="number"
                  min="0"
                  max="150"
                  value={frequencyDetails.stopAge}
                  onChange={(e) => handleFrequencyChange('stopAge', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Times per Year</Label>
                <Input
                  type="number"
                  min="1"
                  value={frequencyDetails.timesPerYear}
                  onChange={(e) => handleFrequencyChange('timesPerYear', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>Custom Frequency (Optional)</Label>
                <Input
                  value={frequencyDetails.customFrequency}
                  onChange={(e) => handleFrequencyChange('customFrequency', e.target.value)}
                  placeholder="e.g., Every 3 months"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Separator className="my-4" />

      {category !== "medication" && category !== "surgical" && category !== "transportation" && (
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
        </div>
      )}

      {renderCostInputs()}

      <Button type="submit" className="w-full bg-medical-500 hover:bg-medical-600">
        Add Item
      </Button>
    </form>
  );
};

export default PlanForm;
