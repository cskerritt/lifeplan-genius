
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
      console.log(`Found ${uniqueCities.length} cities for ${state}`);
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
    
    // Ensure ZIP code is exactly 5 digits with leading zeros
    const formattedZip = zipCode.toString().padStart(5, '0');
    console.log('🔍 Starting lookup for ZIP:', formattedZip);
    setIsLoading(true);
    
    try {
      // Step 1: Try direct lookup first
      console.log('Step 1: Attempting direct lookup from gaf_lookup table...');
      const { data: directData, error: directError } = await supabase
        .from('gaf_lookup')
        .select('*')
        .eq('zip', formattedZip)
        .maybeSingle();

      if (directError) {
        console.error('Direct lookup error:', directError);
        throw directError;
      }

      console.log('Direct lookup result:', directData);

      // Step 2: If direct lookup fails, try RPC function
      if (!directData) {
        console.log('Step 2: Direct lookup failed, trying RPC search_geographic_factors...');
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('search_geographic_factors', { zip_code: formattedZip });

        if (rpcError) {
          console.error('RPC lookup error:', rpcError);
          throw rpcError;
        }

        console.log('RPC lookup result:', rpcData);

        if (!rpcData || (Array.isArray(rpcData) && rpcData.length === 0)) {
          console.log('No data found for ZIP:', formattedZip);
          setGeoFactors(null);
          toast({
            variant: "destructive",
            title: "Location Not Found",
            description: "Please try another ZIP code or enter state/city manually"
          });
          return null;
        }

        // Use the first result from RPC if available
        const rpcResult = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        const factors: GafFactors = {
          mfr_code: Number(rpcResult.mfr_code),
          pfr_code: Number(rpcResult.pfr_code),
          city: rpcResult.city,
          state_name: rpcResult.state_name
        };
        console.log('Found factors from RPC:', factors);
        setGeoFactors(factors);
        return factors;
      }

      // Use direct lookup data if available
      const factors: GafFactors = {
        mfr_code: Number(directData.mfr_code),
        pfr_code: Number(directData.pfr_code),
        city: directData.city,
        state_name: directData.state_name
      };

      console.log('Found factors from direct lookup:', factors);
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
