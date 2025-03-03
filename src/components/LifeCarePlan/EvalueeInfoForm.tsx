import React from 'react';
import { BasicInfoForm } from './BasicInfoForm';
import { LocationSelector } from './LocationSelector';
import { LifeExpectancyInput } from './LifeExpectancyInput';
import { FormActions } from './EvalueeFormActions';
import { useGafLookup } from '@/hooks/useGafLookup';

interface EvalueeInfoFormProps {
  formData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dateOfInjury: string;
    gender: string;
    city: string;
    state: string;
    zipCode: string;
    lifeExpectancy: string;
  };
  onFormDataChange: (data: any) => void;
  onLocationChange: (city: string, state: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing?: boolean;
}

export default function EvalueeInfoForm({
  formData,
  onFormDataChange,
  onLocationChange,
  onCancel,
  onSubmit,
  isEditing
}: EvalueeInfoFormProps) {
  const { isLoading, cities, lookupGeoFactors } = useGafLookup();

  const handleFieldChange = (field: string, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleStateChange = async (state: string) => {
    handleFieldChange('state', state);
    // City is no longer needed, but we'll keep it in the form data for compatibility
    handleFieldChange('city', '');
  };

  const handleZipLookup = async (zipCode: string) => {
    const trimmedZip = zipCode.trim();
    if (!/^\d{5}$/.test(trimmedZip) || trimmedZip === "00000") {
      console.warn("Invalid zip code provided:", trimmedZip);
      return;
    }
    
    console.log("Looking up ZIP:", trimmedZip);
    const gafData = await lookupGeoFactors(trimmedZip);
    
    if (gafData) {
      // City is no longer displayed, but we'll keep it in the form data for compatibility
      handleFieldChange('city', gafData.city || '');
      handleFieldChange('state', gafData.state_name || '');
      onLocationChange(gafData.city || '', gafData.state_name || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicInfoForm
        firstName={formData.firstName}
        lastName={formData.lastName}
        dateOfBirth={formData.dateOfBirth}
        dateOfInjury={formData.dateOfInjury}
        gender={formData.gender}
        onFieldChange={handleFieldChange}
      />

      <LocationSelector
        zipCode={formData.zipCode}
        state={formData.state}
        city={formData.city}
        cities={cities}
        onZipCodeChange={(value) => handleFieldChange('zipCode', value)}
        onStateChange={handleStateChange}
        onCityChange={(city) => handleFieldChange('city', city)}
        onLookup={handleZipLookup}
        isLoading={isLoading}
      />

      <LifeExpectancyInput
        value={formData.lifeExpectancy}
        onChange={(value) => handleFieldChange('lifeExpectancy', value)}
      />

      <FormActions onCancel={onCancel} isEditing={isEditing} />
    </form>
  );
}
