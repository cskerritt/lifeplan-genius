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
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('city')
        .eq('state_name', state)
        .not('city', 'is', null);

      if (error) throw error;

      // Get unique cities
      const uniqueCities = Array.from(new Set(data.map(row => row.city))).filter(Boolean);
      setCities(uniqueCities as string[]);

    } catch (error) {
      console.error('Error looking up cities:', error);
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
    const cleanZip = zipCode.replace(/\D/g, '').padStart(5, '0');
    console.log('Looking up ZIP:', cleanZip);
    
    if (cleanZip.length !== 5) {
      toast({
        variant: "destructive",
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code"
      });
      return null;
    }

    setIsLoading(true);

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
          description: "No location data found for this ZIP code"
        });
        return null;
      }

      toast({
        title: "Location Found",
        description: `Found location data for ${data.city || ''}, ${data.state_name || ''}`
      });

      setGeoFactors(data);
      return data;

    } catch (error) {
      console.error('Error looking up location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to lookup location data"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { geoFactors, cities, isLoading, lookupGeoFactors, lookupCitiesByState };
}