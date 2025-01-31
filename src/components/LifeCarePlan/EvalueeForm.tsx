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

interface EvalueeFormProps {
  onSave?: (evaluee: any) => void;
}

export default function EvalueeForm({ onSave }: EvalueeFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formData, updateFormData } = useEvalueeFormState();
  const { geoFactors, lookupGeoFactors } = useGafLookup();
  
  const ageData = useAgeCalculations({
    dateOfBirth: formData.dateOfBirth,
    dateOfInjury: formData.dateOfInjury,
    lifeExpectancy: formData.lifeExpectancy
  });

  const { handleSubmit } = useEvalueeFormSubmit(onSave);

  const onFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e, formData, ageData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Life Care Plan</CardTitle>
        <CardDescription>Enter evaluee information to begin</CardDescription>
      </CardHeader>
      <CardContent>
        <EvalueeTabs
          formData={formData}
          onFormDataChange={updateFormData}
          onLocationChange={lookupGeoFactors}
          onCancel={() => navigate('/')}
          onSubmit={onFormSubmit}
          ageData={ageData}
          geoFactors={geoFactors}
        />
      </CardContent>
    </Card>
  );
}