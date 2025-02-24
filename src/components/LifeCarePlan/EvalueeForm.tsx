
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAgeCalculations } from '@/hooks/useAgeCalculations';
import { useEvalueeFormSubmit } from '@/hooks/useEvalueeFormSubmit';
import { useGafLookup } from '@/hooks/useGafLookup';
import { useEvalueeFormState } from '@/hooks/useEvalueeFormState';
import EvalueeTabs from './EvalueeTabs';
import { Evaluee } from '@/types/lifecare';

interface EvalueeFormProps {
  onSave?: (evaluee: any) => void;
  initialData?: Evaluee | null;
}

export default function EvalueeForm({ onSave, initialData }: EvalueeFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formData, updateFormData } = useEvalueeFormState(initialData);
  const { geoFactors, lookupGeoFactors } = useGafLookup();
  
  const ageData = useAgeCalculations({
    dateOfBirth: formData.dateOfBirth,
    dateOfInjury: formData.dateOfInjury,
    lifeExpectancy: formData.lifeExpectancy
  });

  const { handleSubmit } = useEvalueeFormSubmit(onSave);

  const handleLocationChange = (city: string, state: string) => {
    // We don't need to do anything here since the form data is already updated
    // by the time this is called
  };

  const onFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e, formData, ageData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Life Care Plan" : "New Life Care Plan"}</CardTitle>
        <CardDescription>
          {initialData ? "Update evaluee information" : "Enter evaluee information to begin"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EvalueeTabs
          formData={formData}
          onFormDataChange={updateFormData}
          onLocationChange={handleLocationChange}
          onCancel={() => navigate('/')}
          onSubmit={onFormSubmit}
          ageData={ageData}
          geoFactors={geoFactors}
        />
      </CardContent>
    </Card>
  );
}
