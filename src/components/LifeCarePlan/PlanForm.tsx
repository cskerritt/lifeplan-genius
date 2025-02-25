
import { Separator } from "@/components/ui/separator";
import { CategorySelect } from "./FormSections/CategorySelect";
import { FrequencyForm } from "./FrequencyForm";
import { MedicationForm } from "./MedicationForm";
import { CostDetails } from "./FormSections/CostDetails";
import { FormActions } from "./FormActions";
import { usePlanFormState } from "./hooks/usePlanFormState";
import { PlanFormProps } from "./types";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { SurgicalForm } from "./SurgicalForm/SurgicalForm";
import { InterventionalForm } from "./InterventionalForm/InterventionalForm";
import { FrequencyDetails } from "@/types/lifecare";

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

  const handleFrequencyChange = (field: keyof FrequencyDetails, value: any) => {
    setFrequencyDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleCPTLookup = async () => {
    try {
      const result = await lookupCPTCode(cptCode);
      if (result && result.length > 0) {
        const data = result[0];
        setCostRange({
          low: data.pfr_50th,
          average: data.pfr_75th,
          high: data.pfr_90th
        });
      }
    } catch (error) {
      console.error('Error looking up CPT code:', error);
    }
  };

  return (
    <div className="space-y-6">
      <CategorySelect
        category={category}
        service={service}
        onCategoryChange={setCategory}
        onServiceChange={setService}
      />

      <Separator className="my-4" />

      {category === "medication" && (
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
      )}

      {category === "surgical" && (
        <SurgicalForm
          onFrequencyChange={handleFrequencyChange}
          frequencyDetails={frequencyDetails}
          dateOfBirth={dateOfBirth}
          dateOfInjury={dateOfInjury}
          lifeExpectancy={lifeExpectancy}
          onSubmit={onSubmit}
        />
      )}

      {category === "interventional" && (
        <InterventionalForm
          onFrequencyChange={handleFrequencyChange}
          frequencyDetails={frequencyDetails}
          dateOfBirth={dateOfBirth}
          dateOfInjury={dateOfInjury}
          lifeExpectancy={lifeExpectancy}
          onSubmit={onSubmit}
        />
      )}

      {!["surgical", "interventional", "medication"].includes(category) && (
        <>
          <FrequencyForm
            frequencyDetails={frequencyDetails}
            onFrequencyChange={handleFrequencyChange}
            dateOfBirth={dateOfBirth}
            dateOfInjury={dateOfInjury}
            lifeExpectancy={lifeExpectancy}
          />

          {category !== "transportation" && (
            <>
              <Separator className="my-4" />
              <CostDetails
                cptCode={cptCode}
                costRange={costRange}
                onCPTCodeChange={setCptCode}
                onCostRangeChange={(field, value) => 
                  setCostRange(prev => ({ ...prev, [field]: value }))
                }
                onCPTLookup={handleCPTLookup}
              />
            </>
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
        </>
      )}
    </div>
  );
};

export default PlanForm;
