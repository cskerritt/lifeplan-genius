
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EvalueeInfoForm from './EvalueeInfoForm';
import DemographicsDisplay from './DemographicsDisplay';

interface EvalueeTabsProps {
  formData: any;
  onFormDataChange: (data: any) => void;
  onLocationChange: (city: string, state: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  ageData: any;
  geoFactors: any;
  isEditing?: boolean;
}

export default function EvalueeTabs({
  formData,
  onFormDataChange,
  onLocationChange,
  onCancel,
  onSubmit,
  ageData,
  geoFactors,
  isEditing
}: EvalueeTabsProps) {
  return (
    <Tabs defaultValue="evaluee">
      <TabsList>
        <TabsTrigger value="evaluee">Evaluee Information</TabsTrigger>
        <TabsTrigger value="demographics">Demographics & Factors</TabsTrigger>
      </TabsList>

      <TabsContent value="evaluee">
        <EvalueeInfoForm
          formData={formData}
          onFormDataChange={onFormDataChange}
          onLocationChange={onLocationChange}
          onCancel={onCancel}
          onSubmit={onSubmit}
          isEditing={isEditing}
        />
      </TabsContent>

      <TabsContent value="demographics">
        <DemographicsDisplay
          ageData={ageData}
          geoFactors={geoFactors}
        />
      </TabsContent>
    </Tabs>
  );
}
