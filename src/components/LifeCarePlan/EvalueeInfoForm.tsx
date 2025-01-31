import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BasicInfoForm } from './BasicInfoForm';
import { LocationSelector } from './LocationSelector';

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
  const handleFieldChange = (field: string, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleCityChange = (city: string) => {
    handleFieldChange('city', city);
    onLocationChange(city, formData.state);
  };

  const handleStateChange = (state: string) => {
    handleFieldChange('state', state);
    if (formData.city) {
      onLocationChange(formData.city, state);
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
        city={formData.city}
        state={formData.state}
        onCityChange={handleCityChange}
        onStateChange={handleStateChange}
      />

      <div className="space-y-2">
        <Label htmlFor="zipCode">ZIP Code</Label>
        <Input
          id="zipCode"
          value={formData.zipCode}
          onChange={(e) => handleFieldChange('zipCode', e.target.value)}
          pattern="[0-9]{5}"
          required
        />
      </div>

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