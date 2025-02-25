
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
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
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(!initialData);
  const { formData, updateFormData } = useEvalueeFormState(initialData);
  const { geoFactors, lookupGeoFactors } = useGafLookup();
  
  const ageData = useAgeCalculations({
    dateOfBirth: formData.dateOfBirth,
    dateOfInjury: formData.dateOfInjury,
    lifeExpectancy: formData.lifeExpectancy
  });

  const { handleSubmit } = useEvalueeFormSubmit(onSave);

  const handleLocationChange = (city: string, state: string) => {
    // No changes needed here as form data is already updated
  };

  const onFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e, formData, ageData, id);
    setIsEditing(false);
  };

  const renderReadOnlyField = (label: string, value: string) => (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base">{value || '-'}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>{initialData ? "Life Care Plan Details" : "New Life Care Plan"}</CardTitle>
          <CardDescription>
            {initialData ? "Review evaluee information" : "Enter evaluee information to begin"}
          </CardDescription>
        </div>
        {initialData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel Editing" : "Edit Information"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <EvalueeTabs
            formData={formData}
            onFormDataChange={updateFormData}
            onLocationChange={handleLocationChange}
            onCancel={() => {
              if (initialData) {
                setIsEditing(false);
              } else {
                navigate('/');
              }
            }}
            onSubmit={onFormSubmit}
            ageData={ageData}
            geoFactors={geoFactors}
            isEditing={!!initialData}
          />
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {renderReadOnlyField("First Name", formData.firstName)}
            {renderReadOnlyField("Last Name", formData.lastName)}
            {renderReadOnlyField("Date of Birth", formData.dateOfBirth)}
            {renderReadOnlyField("Date of Injury", formData.dateOfInjury)}
            {renderReadOnlyField("Gender", formData.gender)}
            {renderReadOnlyField("State", formData.state)}
            {renderReadOnlyField("City", formData.city)}
            {renderReadOnlyField("ZIP Code", formData.zipCode)}
            {renderReadOnlyField("Life Expectancy (years)", formData.lifeExpectancy)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
