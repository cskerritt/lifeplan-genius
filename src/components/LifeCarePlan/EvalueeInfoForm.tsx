import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const handleCityStateChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    onFormDataChange(newFormData);
    if (newFormData.city && newFormData.state) {
      onLocationChange(newFormData.city, newFormData.state);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onFormDataChange({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onFormDataChange({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => onFormDataChange({ ...formData, dateOfBirth: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfInjury">Date of Injury</Label>
          <Input
            id="dateOfInjury"
            type="date"
            value={formData.dateOfInjury}
            onChange={(e) => onFormDataChange({ ...formData, dateOfInjury: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => onFormDataChange({ ...formData, gender: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City/Town</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleCityStateChange('city', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select
            value={formData.state}
            onValueChange={(value) => handleCityStateChange('state', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {/* Add all US states */}
              <SelectItem value="AL">Alabama</SelectItem>
              <SelectItem value="AK">Alaska</SelectItem>
              <SelectItem value="AZ">Arizona</SelectItem>
              {/* ... Add all other states */}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => onFormDataChange({ ...formData, zipCode: e.target.value })}
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
            onChange={(e) => onFormDataChange({ ...formData, lifeExpectancy: e.target.value })}
            required
          />
        </div>
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