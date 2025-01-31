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
  const { toast } = useToast();

  const lookupGeoFactors = async (zipCode: string) => {
    // Clean and pad the ZIP code
    const cleanZip = zipCode.replace(/\D/g, '').padStart(5, '0');
    
    // Validate the ZIP code format
    if (cleanZip.length !== 5) {
      toast({
        variant: "destructive",
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code"
      });
      return null;
    }

    setIsLoading(true);
    console.log('Looking up GAF for ZIP:', cleanZip);

    try {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('mfr_code, pfr_code, city, state_name')
        .eq('zip', cleanZip)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "No data found for this ZIP code"
        });
        return null;
      }

      setGeoFactors(data);
      return data;

    } catch (error) {
      console.error('Error looking up geographic factors:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch location data"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { geoFactors, isLoading, lookupGeoFactors };
}