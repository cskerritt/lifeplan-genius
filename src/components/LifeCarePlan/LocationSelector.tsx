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
    if (zipCode.length !== 5) return;
    
    // Pad the ZIP code with leading zeros if needed
    const paddedZip = zipCode.padStart(5, '0');
    console.log('Looking up ZIP code:', paddedZip);
    onLookup(paddedZip);
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 5 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    onZipCodeChange(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            type="submit"
            disabled={isLoading || !zipCode || zipCode.length !== 5}
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Looking up...' : 'Lookup'}
          </Button>
        </div>
      </div>
    </form>
  );
}