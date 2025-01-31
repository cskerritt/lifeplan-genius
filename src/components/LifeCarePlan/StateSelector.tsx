import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface State {
  id: string;
  name: string;
}

interface StateSelectorProps {
  value: string;
  states: State[];
  isLoading: boolean;
  onValueChange: (value: string) => void;
}

export function StateSelector({ 
  value, 
  states = [], 
  isLoading = false, 
  onValueChange 
}: StateSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="state">State</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={isLoading}
      >
        <SelectTrigger id="state">
          <SelectValue placeholder={isLoading ? "Loading states..." : "Select state"} />
        </SelectTrigger>
        <SelectContent>
          {Array.isArray(states) && states.map((state) => (
            <SelectItem key={state.id} value={state.id}>
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}