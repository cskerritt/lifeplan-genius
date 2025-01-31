import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

interface LocationSelectorProps {
  zipCode: string;
  onZipCodeChange: (zipCode: string) => void;
  onLookup: (zipCode: string) => void;
  isLoading?: boolean;
}

export function LocationSelector({ 
  zipCode, 
  onZipCodeChange, 
  onLookup,
  isLoading 
}: LocationSelectorProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove any non-numeric characters and ensure it's exactly 5 digits
    const cleanZip = zipCode.replace(/\D/g, '').slice(0, 5);
    if (cleanZip.length === 5) {
      onLookup(cleanZip);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 5 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    onZipCodeChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="zipCode">ZIP Code</Label>
        <div className="flex gap-2">
          <Input
            id="zipCode"
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={handleZipChange}
            maxLength={5}
            pattern="[0-9]{5}"
            className="flex-1"
            required
          />
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !zipCode || zipCode.length !== 5}
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Looking up...' : 'Lookup'}
          </Button>
        </div>
      </div>
    </div>
  );
}