import React, { useEffect, useState } from 'react';
import { useLocationData } from '@/hooks/useLocationData';
import { StateSelector } from './StateSelector';
import { CitySelector } from './CitySelector';

interface LocationSelectorProps {
  city: string;
  state: string;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
}

export function LocationSelector({ 
  city, 
  state, 
  onCityChange, 
  onStateChange 
}: LocationSelectorProps) {
  const { locations, states, isLoading } = useLocationData();
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (state) {
      const stateCities = Array.from(new Set(
        locations
          .filter(loc => loc.state_id === state)
          .map(loc => loc.city)
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b));
      
      setCities(stateCities);

      // Reset city if it's not in the new list of cities
      if (city && !stateCities.includes(city)) {
        onCityChange('');
      }
    } else {
      setCities([]);
    }
  }, [state, locations, city, onCityChange]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <StateSelector
        value={state}
        states={states}
        isLoading={isLoading}
        onValueChange={onStateChange}
      />
      <CitySelector
        value={city}
        cities={cities}
        isLoading={isLoading}
        disabled={!state}
        onValueChange={onCityChange}
      />
    </div>
  );
}