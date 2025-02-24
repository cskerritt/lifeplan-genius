
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CitySelectorProps {
  value: string;
  cities: string[];
  isLoading: boolean;
  disabled: boolean;
  onValueChange: (value: string) => void;
}

export function CitySelector({ value, cities, isLoading, disabled, onValueChange }: CitySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="city">City/Town</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue 
            placeholder={
              isLoading ? "Loading cities..." : 
              disabled ? "Select state first" : 
              "Select city"
            } 
          />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {cities.map(city => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
