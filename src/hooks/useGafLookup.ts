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

  const lookupGeoFactors = useCallback(async (zipCode: string) => {
    if (!zipCode) return;
    
    // Ensure ZIP code is exactly 5 digits with leading zeros
    const formattedZip = zipCode.toString().padStart(5, '0');
    console.log('🔍 Looking up ZIP:', formattedZip);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('mfr_code, pfr_code, city, state_name')
        .eq('zip', formattedZip)
        .maybeSingle();

      if (error) {
        console.error('Lookup error:', error);
        throw error;
      }

      console.log('Lookup result:', data);

      if (!data) {
        console.log('No data found for ZIP:', formattedZip);
        setGeoFactors(null);
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Please try another ZIP code or enter state manually"
        });
        return null;
      }

      const factors: GafFactors = {
        mfr_code: Number(data.mfr_code),
        pfr_code: Number(data.pfr_code),
        city: data.city,
        state_name: data.state_name
      };

      console.log('Found factors:', factors);
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

  return { geoFactors, isLoading, cities, lookupGeoFactors };
}
