import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGafLookup() {
  const [geoFactors, setGeoFactors] = useState<any>(null);
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

      if (error) {
        console.error('❌ Error fetching cities:', error);
        throw error;
      }

      console.log('📍 Found cities:', data);
      const uniqueCities = Array.from(new Set(data.map(row => row.city))).filter(Boolean);
      setCities(uniqueCities as string[]);

    } catch (error) {
      console.error('❌ Error in lookupCitiesByState:', error);
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
    console.log('🔍 Looking up ZIP:', zipCode);
    const cleanZip = zipCode.replace(/\D/g, '').padStart(5, '0');
    console.log('🧹 Cleaned ZIP:', cleanZip);
    
    if (cleanZip.length !== 5) {
      console.warn('⚠️ Invalid ZIP length:', cleanZip.length);
      toast({
        variant: "destructive",
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code"
      });
      return null;
    }

    setIsLoading(true);

    try {
      console.log('📡 Fetching from Supabase...');
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('city, state_name, mfr_code, pfr_code')
        .eq('zip', cleanZip)
        .maybeSingle();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('📦 Received data:', data);

      if (!data) {
        console.warn('⚠️ No data found for ZIP:', cleanZip);
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "No location data found for this ZIP code"
        });
        setGeoFactors(null);
        return null;
      }

      const factors = {
        mfr_code: data.mfr_code,
        pfr_code: data.pfr_code,
        city: data.city,
        state_name: data.state_name
      };

      console.log('✅ Processed factors:', factors);
      setGeoFactors(factors);
      
      toast({
        title: "Location Found",
        description: `Found location data for ${data.city}, ${data.state_name}`
      });

      return factors;

    } catch (error) {
      console.error('❌ Error in lookupGeoFactors:', error);
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