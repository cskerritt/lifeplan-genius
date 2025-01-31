import React, { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

interface LocationSelectorProps {
  city: string;
  state: string;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
}

interface Location {
  city: string;
  state_id: string;
  state_name: string;
}

export function LocationSelector({ 
  city, 
  state, 
  onCityChange, 
  onStateChange 
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('city, state_id, state_name')
        .order('state_name', { ascending: true });

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      if (data) {
        setLocations(data as Location[]);
        
        // Get unique states
        const uniqueStates = Array.from(new Set(
          data.map(loc => JSON.stringify({ id: loc.state_id, name: loc.state_name }))
        )).map(str => JSON.parse(str));
        setStates(uniqueStates);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (state) {
      // Filter cities for selected state
      const stateCities = Array.from(new Set(
        locations
          .filter(loc => loc.state_id === state)
          .map(loc => loc.city)
          .filter(Boolean) // Remove null/undefined values
      )).sort();
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [state, locations]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Select value={state} onValueChange={onStateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {states.map(state => (
              <SelectItem key={state.id} value={state.id}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City/Town</Label>
        <Select 
          value={city} 
          onValueChange={onCityChange}
          disabled={!state}
        >
          <SelectTrigger>
            <SelectValue placeholder={state ? "Select city" : "Select state first"} />
          </SelectTrigger>
          <SelectContent>
            {cities.map(city => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}