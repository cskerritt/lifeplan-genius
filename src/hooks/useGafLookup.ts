
import { useState, useCallback } from 'react';
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

  const lookupCitiesByState = useCallback(async (state: string) => {
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
  }, [toast]);

  const lookupGeoFactors = useCallback(async (zipCode: string) => {
    if (!zipCode) return;
    
    console.log('Looking up ZIP:', zipCode);
    setIsLoading(true);
    
    try {
      // First try direct lookup from gaf_lookup table
      const { data: directData, error: directError } = await supabase
        .from('gaf_lookup')
        .select('*')
        .eq('zip', zipCode)
        .maybeSingle();

      if (directError) {
        console.error('Direct lookup error:', directError);
        throw directError;
      }

      console.log('Direct lookup data:', directData);

      if (directData) {
        const factors: GafFactors = {
          mfr_code: Number(directData.mfr_code),
          pfr_code: Number(directData.pfr_code),
          city: directData.city,
          state_name: directData.state_name
        };

        console.log('Found GAF factors directly:', factors);
        setGeoFactors(factors);
        return factors;
      }

      // If no direct match, try the RPC function as backup
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('search_geographic_factors', { 
          zip_code: zipCode 
        });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw rpcError;
      }

      console.log('RPC lookup data:', rpcData);

      if (!rpcData || rpcData.length === 0) {
        console.log('No data found for ZIP:', zipCode);
        setGeoFactors(null);
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Please try another ZIP code or enter state/city manually"
        });
        return null;
      }

      const factors: GafFactors = {
        mfr_code: Number(rpcData[0].mfr_code),
        pfr_code: Number(rpcData[0].pfr_code),
        city: rpcData[0].city,
        state_name: rpcData[0].state_name
      };

      console.log('Found GAF factors via RPC:', factors);
      setGeoFactors(factors);
      return factors;

    } catch (error) {
      console.error('Error in lookupGeoFactors:', error);
      setGeoFactors(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to lookup location data"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { geoFactors, isLoading, cities, lookupGeoFactors, lookupCitiesByState };
}
