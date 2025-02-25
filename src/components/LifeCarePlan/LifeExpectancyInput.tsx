
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LifeExpectancyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function LifeExpectancyInput({ value, onChange }: LifeExpectancyInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty string or decimal numbers (positive only)
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      // Only update if it's empty or a valid number
      if (newValue === '' || !isNaN(parseFloat(newValue))) {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="lifeExpectancyInput">Life Expectancy (years)</Label>
      <Input
        id="lifeExpectancyInput"
        type="number"
        step="0.1"
        min="0"
        placeholder="Enter life expectancy (e.g. 45.5)"
        value={value}
        onChange={handleChange}
        required
      />
    </div>
  );
}
