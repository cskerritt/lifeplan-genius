import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LifeExpectancyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function LifeExpectancyInput({ value, onChange }: LifeExpectancyInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="lifeExpectancyInput">Life Expectancy (years)</Label>
      <Input
        id="lifeExpectancyInput"
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}