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
        const { data: gafData, error: gafError } = await supabase
          .from('gaf_lookup')
          .select('city, state_id, state_name')
          .order('state_name', { ascending: true });

        if (gafError) throw gafError;

        if (gafData) {
          setLocations(gafData as Location[]);
          
          // Create a unique set of states using both state_id and state_name
          const uniqueStates = Array.from(
            new Map(
              gafData.map(loc => [
                loc.state_id,
                { id: loc.state_id, name: loc.state_name }
              ])
            ).values()
          );
          
          setStates(uniqueStates.sort((a, b) => a.name.localeCompare(b.name)));
        }

        console.log('Fetched states:', states.length);
        console.log('Fetched locations:', locations.length);
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