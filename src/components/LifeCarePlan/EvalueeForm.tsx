import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAgeCalculations } from '@/hooks/useAgeCalculations';
import { useEvalueeFormSubmit } from '@/hooks/useEvalueeFormSubmit';
import { useGafLookup } from '@/hooks/useGafLookup';
import { useEvalueeFormState } from '@/hooks/useEvalueeFormState';
import { useEvalueesDb } from '@/hooks/useEvalueesDb';
import EvalueeTabs from './EvalueeTabs';
import DuplicateEvalueeDialog from './DuplicateEvalueeDialog';
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
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const { formData, updateFormData } = useEvalueeFormState(initialData);
  const { geoFactors, lookupGeoFactors } = useGafLookup();
  const { duplicateEvaluee } = useEvalueesDb(() => {
    // Refresh the page after duplication
    if (id && id !== 'new') {
      navigate(`/plans`);
    }
  });
  
  useEffect(() => {
    if (formData.zipCode && formData.zipCode.length === 5) {
      lookupGeoFactors(formData.zipCode);
    }
  }, [formData.zipCode]);

  const ageData = useAgeCalculations({
    dateOfBirth: formData.dateOfBirth,
    dateOfInjury: formData.dateOfInjury,
    lifeExpectancy: formData.lifeExpectancy
  });

  const { handleSubmit } = useEvalueeFormSubmit((updatedData) => {
    updateFormData({
      firstName: updatedData.first_name,
      lastName: updatedData.last_name,
      dateOfBirth: updatedData.date_of_birth,
      dateOfInjury: updatedData.date_of_injury || '',
      gender: updatedData.gender,
      zipCode: updatedData.zip_code || '',
      city: updatedData.city,
      state: updatedData.state,
      lifeExpectancy: updatedData.life_expectancy?.toString() || '',
    });
    
    if (onSave) {
      onSave(updatedData);
    }
  });

  const handleLocationChange = (city: string, state: string) => {
    // No changes needed here as form data is already updated
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e, formData, ageData, id);
    setIsEditing(false);
  };

  const handleDuplicateEvaluee = (evalueeId: string, modifications: any) => {
    if (id && id !== 'new') {
      duplicateEvaluee(evalueeId, modifications);
    }
  };

  const formatNumber = (value: number | undefined | null) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(4);
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
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDuplicateDialog(true)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel Editing" : "Edit Information"}
            </Button>
          </div>
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
          <div className="space-y-6">
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
            
            <div className="mt-6 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Geographic Adjustment Factors</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">MFR Code</p>
                  <p className="text-base font-medium">
                    {geoFactors ? formatNumber(geoFactors.mfr_code) : 'Loading...'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">PFR Code</p>
                  <p className="text-base font-medium">
                    {geoFactors ? formatNumber(geoFactors.pfr_code) : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Duplicate Evaluee Dialog */}
      <DuplicateEvalueeDialog
        evaluee={initialData}
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        onDuplicate={handleDuplicateEvaluee}
      />
    </Card>
  );
}
