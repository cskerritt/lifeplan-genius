import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import { StateSelector } from './StateSelector';
import { CitySelector } from './CitySelector';

interface LocationSelectorProps {
  zipCode: string;
  state: string;
  city: string;
  cities: string[];
  onZipCodeChange: (zipCode: string) => void;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onLookup: (zipCode: string) => void;
  isLoading?: boolean;
}

export function LocationSelector({ 
  zipCode, 
  state,
  city,
  cities,
  onZipCodeChange,
  onStateChange,
  onCityChange,
  onLookup,
  isLoading 
}: LocationSelectorProps) {
  const handleZipLookup = () => {
    if (zipCode.length === 5) {
      onLookup(zipCode);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    onZipCodeChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleZipLookup();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <StateSelector
          value={state}
          onValueChange={onStateChange}
          isLoading={isLoading}
        />

        <CitySelector
          value={city}
          cities={cities}
          isLoading={isLoading}
          disabled={!state}
          onValueChange={onCityChange}
        />

        <div className="space-y-2">
          <Label htmlFor="zipCodeInput">ZIP Code</Label>
          <div className="flex gap-2">
            <Input
              id="zipCodeInput"
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={handleZipChange}
              onKeyDown={handleKeyDown}
              maxLength={5}
              pattern="[0-9]{5}"
              className="flex-1"
            />
            <Button 
              type="button"
              onClick={handleZipLookup}
              disabled={isLoading || !zipCode || zipCode.length !== 5}
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Looking up...' : 'Lookup'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}