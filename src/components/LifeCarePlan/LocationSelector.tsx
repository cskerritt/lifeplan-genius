import React, { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<{ id: string; name: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gaf_lookup')
          .select('city, state_id, state_name')
          .order('state_name', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setLocations(data as Location[]);
          
          // Get unique states with their IDs
          const uniqueStates = Array.from(new Set(
            data.map(loc => JSON.stringify({ id: loc.state_id, name: loc.state_name }))
          )).map(str => JSON.parse(str));
          
          setStates(uniqueStates.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load locations. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [toast]);

  useEffect(() => {
    if (state) {
      // Filter and sort cities for selected state
      const stateCities = Array.from(new Set(
        locations
          .filter(loc => loc.state_id === state)
          .map(loc => loc.city)
          .filter(Boolean) // Remove null/undefined values
      )).sort((a, b) => a.localeCompare(b));
      
      setCities(stateCities);

      // If the current city is not in the new list of cities, reset it
      if (city && !stateCities.includes(city)) {
        onCityChange('');
      }
    } else {
      setCities([]);
    }
  }, [state, locations, city, onCityChange]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Select 
          value={state} 
          onValueChange={onStateChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "Loading states..." : "Select state"} />
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
          disabled={!state || isLoading}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={
                isLoading ? "Loading cities..." : 
                !state ? "Select state first" : 
                "Select city"
              } 
            />
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