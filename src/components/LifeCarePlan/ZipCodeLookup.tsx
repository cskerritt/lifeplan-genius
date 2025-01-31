import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ZipCodeLookupProps {
  onZipFound: (data: {
    city: string;
    state_name: string;
    mfr_code: number;
    pfr_code: number;
  }) => void;
  disabled?: boolean;
}

export function ZipCodeLookup({ onZipFound, disabled = false }: ZipCodeLookupProps) {
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.length !== 5) {
      toast({
        variant: "destructive",
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gaf_lookup')
        .select('city, state_name, mfr_code, pfr_code')
        .eq('zip', zipCode.padStart(5, '0'))
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "No location data found for this ZIP code"
        });
        return;
      }

      toast({
        title: "Location Found",
        description: `Found location data for ${data.city}, ${data.state_name}`
      });

      onZipFound(data);
    } catch (error) {
      console.error('Error looking up ZIP:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to lookup location data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 5 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
  };

  return (
    <form onSubmit={handleZipSubmit} className="space-y-2">
      <Label htmlFor="zipCode">ZIP Code</Label>
      <div className="flex gap-2">
        <Input
          id="zipCode"
          placeholder="Enter ZIP code"
          value={zipCode}
          onChange={handleZipChange}
          maxLength={5}
          pattern="[0-9]{5}"
          disabled={disabled || isLoading}
          className="flex-1"
        />
        <Button 
          type="submit"
          disabled={disabled || isLoading || zipCode.length !== 5}
        >
          <Search className="h-4 w-4 mr-2" />
          {isLoading ? 'Looking up...' : 'Lookup'}
        </Button>
      </div>
    </form>
  );
}