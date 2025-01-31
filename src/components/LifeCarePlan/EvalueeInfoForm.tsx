import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BasicInfoForm } from './BasicInfoForm';
import { LocationSelector } from './LocationSelector';
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
}

export default function EvalueeInfoForm({
  formData,
  onFormDataChange,
  onLocationChange,
  onCancel,
  onSubmit
}: EvalueeInfoFormProps) {
  const { isLoading, cities, lookupGeoFactors, lookupCitiesByState } = useGafLookup();

  const handleFieldChange = (field: string, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleStateChange = async (state: string) => {
    handleFieldChange('state', state);
    handleFieldChange('city', '');
    await lookupCitiesByState(state);
  };

  const handleCityChange = (city: string) => {
    handleFieldChange('city', city);
    onLocationChange(city, formData.state);
  };

  const handleZipLookup = async (zipCode: string) => {
    console.log('Looking up ZIP:', zipCode);
    
    const gafData = await lookupGeoFactors(zipCode);
    
    if (gafData) {
      handleFieldChange('city', gafData.city || '');
      handleFieldChange('state', gafData.state_name || '');
      onLocationChange(gafData.city || '', gafData.state_name || '');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
        onCityChange={handleCityChange}
        onLookup={handleZipLookup}
        isLoading={isLoading}
      />

      <div className="space-y-2">
        <Label htmlFor="lifeExpectancyInput">Life Expectancy (years)</Label>
        <Input
          id="lifeExpectancyInput"
          type="number"
          step="0.01"
          value={formData.lifeExpectancy}
          onChange={(e) => handleFieldChange('lifeExpectancy', e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Plan
        </Button>
      </div>
    </form>
  );
}