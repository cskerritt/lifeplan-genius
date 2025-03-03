import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StateSelectorProps {
  value: string;
  isLoading?: boolean;
  onValueChange: (value: string) => void;
}

export function StateSelector({ 
  value, 
  isLoading = false, 
  onValueChange 
}: StateSelectorProps) {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // Update input value when value prop changes (e.g. from ZIP lookup)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced validation of state
  useEffect(() => {
    const validateState = async () => {
      if (!inputValue) {
        setError(null);
        return;
      }

      try {
        // Use a more lenient search with wildcards
        const { data, error: queryError } = await supabase
          .from('gaf_lookup')
          .select('state_name')
          .ilike('state_name', `%${inputValue}%`)
          .limit(1);

        if (queryError) throw queryError;

        if (data && data.length > 0) {
          setError(null);
          // Update with the correct case from the database
          onValueChange(data[0].state_name);
        } else {
          // Check against a list of valid US states if not found in database
          const validStates = [
            "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
            "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
            "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
            "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", 
            "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
            "New Hampshire", "New Jersey", "New Mexico", "New York", 
            "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", 
            "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
            "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
            "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
          ];
          
          const matchedState = validStates.find(state => 
            state.toLowerCase().includes(inputValue.toLowerCase())
          );
          
          if (matchedState) {
            setError(null);
            onValueChange(matchedState);
          } else {
            setError('Please enter a valid US state name');
          }
        }
      } catch (err) {
        console.error('Error validating state:', err);
        setError('Error validating state');
      }
    };

    const timeoutId = setTimeout(() => {
      validateState();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [inputValue, onValueChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="state-input">State</Label>
      <Input
        id="state-input"
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter state name"
        disabled={isLoading}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
