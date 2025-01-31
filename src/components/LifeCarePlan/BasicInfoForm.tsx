import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BasicInfoFormProps {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dateOfInjury: string;
  gender: string;
  onFieldChange: (field: string, value: string) => void;
}

export function BasicInfoForm({
  firstName,
  lastName,
  dateOfBirth,
  dateOfInjury,
  gender,
  onFieldChange,
}: BasicInfoFormProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => onFieldChange('firstName', e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => onFieldChange('lastName', e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => onFieldChange('dateOfBirth', e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateOfInjury">Date of Injury</Label>
        <Input
          id="dateOfInjury"
          type="date"
          value={dateOfInjury}
          onChange={(e) => onFieldChange('dateOfInjury', e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select
          value={gender}
          onValueChange={(value) => onFieldChange('gender', value)}
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
    </div>
  );
}