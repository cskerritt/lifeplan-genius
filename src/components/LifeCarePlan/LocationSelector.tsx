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
    onLookup(zipCode);
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
            onChange={(e) => onZipCodeChange(e.target.value)}
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
            Lookup
          </Button>
        </div>
      </div>
    </form>
  );
}