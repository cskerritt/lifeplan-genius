import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useGafLookup() {
  const { toast } = useToast();
  const [geoFactors, setGeoFactors] = useState<any>(null);

  const lookupGeoFactors = async (city: string, state: string) => {
    console.log('Looking up GAF for:', city, state);

    try {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('mfr_code, pfr_code')
        .ilike('city', city)
        .eq('state_id', state)
        .maybeSingle();

      if (error) throw error;
      
      console.log('GAF lookup result:', data);

      if (data) {
        setGeoFactors({
          mfr_code: data.mfr_code,
          pfr_code: data.pfr_code
        });
      } else {
        setGeoFactors(null);
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "No geographic adjustment factors found for this location"
        });
      }
    } catch (error) {
      console.error('Error fetching geographic factors:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch geographic factors"
      });
    }
  };

  return { geoFactors, lookupGeoFactors };
}