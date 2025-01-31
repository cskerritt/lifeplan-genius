import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useGafLookup() {
  const { toast } = useToast();
  const [geoFactors, setGeoFactors] = useState<any>(null);

  const lookupGeoFactors = async (zipCode: string) => {
    console.log('Looking up GAF for ZIP:', zipCode);

    if (!zipCode || zipCode.length !== 5) {
      toast({
        variant: "destructive",
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('mfr_code, pfr_code, city, state_name')
        .eq('zip', zipCode)
        .maybeSingle();

      if (error) throw error;
      
      console.log('GAF lookup result:', data);

      if (data) {
        setGeoFactors({
          mfr_code: data.mfr_code,
          pfr_code: data.pfr_code,
          city: data.city,
          state: data.state_name
        });
        
        toast({
          title: "Location Found",
          description: `Found factors for ${data.city}, ${data.state_name}`
        });
      } else {
        setGeoFactors(null);
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "No geographic adjustment factors found for this ZIP code"
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