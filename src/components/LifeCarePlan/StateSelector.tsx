import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StateSelectorProps {
  value: string;
  states: { id: string; name: string; }[];
  isLoading: boolean;
  onValueChange: (value: string) => void;
}

export function StateSelector({ value, states, isLoading, onValueChange }: StateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="state">State</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading states..." : "Select state"} />
        </SelectTrigger>
        <SelectContent className="w-[300px]">
          <div className="p-2">
            <Input
              placeholder="Search states..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          </div>
          <ScrollArea className="h-[200px]">
            {filteredStates.map(state => (
              <SelectItem key={state.id} value={state.id} className="cursor-pointer">
                {state.name}
              </SelectItem>
            ))}
            {filteredStates.length === 0 && (
              <div className="p-2 text-sm text-gray-500 text-center">
                No states found
              </div>
            )}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}