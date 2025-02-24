
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
        .from('geographic_factors')
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
    
    try {
      // Make sure the ZIP is padded to 5 digits
      const paddedZip = zipCode.padStart(5, '0');
      
      const { data, error } = await supabase
        .from('geographic_factors')
        .select('city, state_name, mfr_factor, pfr_factor')
        .eq('zip', paddedZip)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.warn(`No data found for ZIP: ${zipCode}`);
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "No location data found for this ZIP code"
        });
        setGeoFactors(null);
        return null;
      }

      const factors: GafFactors = {
        mfr_code: Number(data.mfr_factor), // Convert from text to number
        pfr_code: Number(data.pfr_factor), // Convert from text to number
        city: data.city,
        state_name: data.state_name
      };

      console.log('Geographic factors found:', factors);
      setGeoFactors(factors);
      return factors;

    } catch (error) {
      console.error('Error in lookupGeoFactors:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to lookup location data"
      });
      setGeoFactors(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { geoFactors, isLoading, cities, lookupGeoFactors, lookupCitiesByState };
}
