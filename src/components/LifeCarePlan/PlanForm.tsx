
import { Separator } from "@/components/ui/separator";
import { CategorySelect } from "./FormSections/CategorySelect";
import { FrequencyForm } from "./FrequencyForm";
import { MedicationForm } from "./MedicationForm";
import { CostDetails } from "./FormSections/CostDetails";
import { FormActions } from "./FormActions";
import { usePlanFormState } from "./hooks/usePlanFormState";
import { PlanFormProps } from "./types";
import { useCostCalculations } from "@/hooks/useCostCalculations";

const PlanForm = ({ onSubmit, dateOfBirth, dateOfInjury, lifeExpectancy }: PlanFormProps) => {
  const {
    category,
    setCategory,
    service,
    setService,
    cptCode,
    setCptCode,
    costRange,
    setCostRange,
    frequencyDetails,
    setFrequencyDetails,
    medicationDetails,
    setMedicationDetails,
    resetForm
  } = usePlanFormState();

  const { lookupCPTCode } = useCostCalculations();

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

  // Extract the cost from the service name if it's a vehicle modification
  const extractCostFromService = (serviceName: string) => {
    if (category === 'transportation' && serviceName.includes('$')) {
      const match = serviceName.match(/\$(\d+(\.\d{2})?)/);
      if (match) {
        const cost = parseFloat(match[1]);
        console.log('Extracted cost:', cost);
        // Set the same cost for low, average, and high
        setCostRange({
          low: cost,
          average: cost,
          high: cost
        });
      }
    }
  };

  // Update the service handler to include cost extraction
  const handleServiceChange = (newService: string) => {
    console.log('Service changed:', newService);
    setService(newService);
    extractCostFromService(newService);
  };

  return (
    <div className="space-y-6">
      <CategorySelect
        category={category}
        service={service}
        onCategoryChange={setCategory}
        onServiceChange={handleServiceChange}
      />

      <Separator className="my-4" />

      <FrequencyForm
        frequencyDetails={frequencyDetails}
        onFrequencyChange={(field, value) => 
          setFrequencyDetails(prev => ({ ...prev, [field]: value }))
        }
        dateOfBirth={dateOfBirth}
        dateOfInjury={dateOfInjury}
        lifeExpectancy={lifeExpectancy}
      />

      <Separator className="my-4" />

      {category === "medication" ? (
        <MedicationForm
          medicationDetails={medicationDetails}
          onMedicationChange={(field, value) => 
            setMedicationDetails(prev => ({ ...prev, [field]: value }))
          }
          onPharmacyPriceChange={(index, field, value) => {
            setMedicationDetails(prev => {
              const newPrices = [...prev.pharmacyPrices];
              newPrices[index] = { ...newPrices[index], [field]: value };
              return { ...prev, pharmacyPrices: newPrices };
            });
          }}
        />
      ) : category !== "surgical" && category !== "transportation" && (
        <CostDetails
          cptCode={cptCode}
          costRange={costRange}
          onCPTCodeChange={setCptCode}
          onCostRangeChange={(field, value) => 
            setCostRange(prev => ({ ...prev, [field]: value }))
          }
          onCPTLookup={handleCPTLookup}
        />
      )}

      <FormActions
        category={category}
        costRange={costRange}
        formState={{
          service,
          cptCode,
          frequencyDetails,
          medicationDetails
        }}
        onSubmit={onSubmit}
        onReset={resetForm}
      />
    </div>
  );
};

export default PlanForm;
