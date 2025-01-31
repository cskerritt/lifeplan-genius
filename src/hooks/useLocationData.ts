import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface Location {
  city: string;
  state_id: string;
  state_name: string;
}

interface State {
  id: string;
  name: string;
}

export function useLocationData() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        // Fetch distinct states from gaf_lookup
        const { data: statesData, error: statesError } = await supabase
          .from('gaf_lookup')
          .select('state_id, state_name')
          .order('state_name');

        if (statesError) throw statesError;

        if (statesData) {
          // Create a unique set of states
          const uniqueStatesMap = new Map();
          statesData.forEach(state => {
            if (!uniqueStatesMap.has(state.state_id)) {
              uniqueStatesMap.set(state.state_id, {
                id: state.state_id,
                name: state.state_name
              });
            }
          });

          const uniqueStates = Array.from(uniqueStatesMap.values())
            .sort((a, b) => a.name.localeCompare(b.name));

          setStates(uniqueStates);
          console.log('States loaded:', uniqueStates.length);
        }

        // Then fetch all locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('gaf_lookup')
          .select('city, state_id, state_name')
          .order('city');

        if (locationsError) throw locationsError;

        if (locationsData) {
          setLocations(locationsData);
          console.log('Locations loaded:', locationsData.length);
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

  return { locations, states, isLoading };
}