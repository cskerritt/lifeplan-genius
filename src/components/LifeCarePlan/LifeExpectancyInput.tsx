
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
    // Only allow non-negative numbers
    if (newValue === '' || (!isNaN(parseFloat(newValue)) && parseFloat(newValue) >= 0)) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="lifeExpectancyInput">Life Expectancy (years)</Label>
      <Input
        id="lifeExpectancyInput"
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={handleChange}
        required
      />
    </div>
  );
}
