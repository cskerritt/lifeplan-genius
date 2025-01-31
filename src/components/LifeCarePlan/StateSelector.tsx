import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StateSelectorProps {
  value: string;
  states: { id: string; name: string; }[];
  isLoading: boolean;
  onValueChange: (value: string) => void;
}

export function StateSelector({ value, states, isLoading, onValueChange }: StateSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="state">State</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading states..." : "Select state"} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {states.map(state => (
            <SelectItem key={state.id} value={state.id}>
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}