import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

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
  const [error, setError] = useState<string | null>(null);

  // Validate state against GAF lookup table
  const validateState = async (stateInput: string) => {
    if (!stateInput) {
      setError(null);
      return;
    }

    try {
      const { data, error: queryError } = await supabase
        .from('gaf_lookup')
        .select('state_name')
        .ilike('state_name', stateInput)
        .limit(1);

      if (queryError) throw queryError;

      if (data && data.length > 0) {
        setError(null);
        // Update with the correct case from the database
        onValueChange(data[0].state_name);
      } else {
        setError('Please enter a valid US state name');
      }
    } catch (err) {
      console.error('Error validating state:', err);
      setError('Error validating state');
    }
  };

  // Debounce validation to avoid too many database calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateState(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="state-input">State</Label>
      <Input
        id="state-input"
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
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