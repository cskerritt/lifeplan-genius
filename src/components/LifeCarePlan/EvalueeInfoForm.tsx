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
  const { isLoading, lookupGeoFactors } = useGafLookup();

  const handleFieldChange = (field: string, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleZipLookup = async (zipCode: string) => {
    const formattedZip = zipCode.padStart(5, '0');
    console.log('Looking up ZIP:', formattedZip);
    
    const gafData = await lookupGeoFactors(formattedZip);
    
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
        onZipCodeChange={(value) => handleFieldChange('zipCode', value)}
        onLookup={handleZipLookup}
        isLoading={isLoading}
      />

      {formData.city && formData.state && (
        <div className="space-y-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="lifeExpectancy">Life Expectancy (years)</Label>
        <Input
          id="lifeExpectancy"
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