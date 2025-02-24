
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GafFactors {
  mfr_code: number;
  pfr_code: number;
  city?: string;
  state_name?: string;
}

export function useGafLookup() {
  const [geoFactors, setGeoFactors] = useState<GafFactors | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const { toast } = useToast();

  const lookupCitiesByState = async (state: string) => {
    console.log('🔍 Looking up cities for state:', state);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('city')
        .eq('state_name', state)
        .not('city', 'is', null);

      if (error) throw error;

      const uniqueCities = Array.from(new Set(data.map(row => row.city))).filter(Boolean);
      setCities(uniqueCities as string[]);

    } catch (error) {
      console.error('Error in lookupCitiesByState:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to lookup cities"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const lookupGeoFactors = async (zipCode: string) => {
    console.log('Looking up ZIP:', zipCode);
    setIsLoading(true);
    setGeoFactors(null); // Reset any previous data
    
    try {
      if (!/^\d{5}$/.test(zipCode)) {
        throw new Error('Invalid ZIP code format');
      }

      // Query with exact ZIP match
      const { data, error } = await supabase
        .rpc('search_geographic_factors', { zip_code: zipCode });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "No location data found for this ZIP code"
        });
        return null;
      }

      const factors: GafFactors = {
        mfr_code: Number(data[0].mfr_code),
        pfr_code: Number(data[0].pfr_code),
        city: data[0].city,
        state_name: data[0].state_name
      };

      console.log('Found GAF factors:', factors);
      setGeoFactors(factors);
      return factors;

    } catch (error) {
      console.error('Error in lookupGeoFactors:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to lookup location data"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { geoFactors, isLoading, cities, lookupGeoFactors, lookupCitiesByState };
}
