import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CPTCode } from '@/types/lifecare';

interface CPTCodeSearchProps {
  onSelect: (cpt: CPTCode) => void;
  zipCode: string;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedCPT: CPTCode | null;
}

export function CPTCodeSearch({ 
  onSelect, 
  zipCode, 
  searchTerm, 
  onSearchTermChange,
  selectedCPT 
}: CPTCodeSearchProps) {
  const [cptOptions, setCptOptions] = useState<CPTCode[]>([]);
  const [showCptOptions, setShowCptOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCPTCodes = async (term: string) => {
    if (!term) {
      setCptOptions([]);
      setShowCptOptions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cpt_codes')
        .select('*')
        .or(`code.ilike.%${term}%,code_description.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setCptOptions(data as CPTCode[]);
      setShowCptOptions(true);
    } catch (error) {
      console.error('Error searching CPT codes:', error);
      setError('Error searching CPT codes');
    }
  };

  const handleCPTSelection = async (cpt: CPTCode) => {
    try {
      const { data: geoData, error: geoError } = await supabase
        .from('geographic_factors')
        .select('*')
        .eq('zip', zipCode.padStart(5, '0'))
        .maybeSingle();

      if (geoError) throw geoError;

      if (!geoData) {
        throw new Error('No geographic factors found for this ZIP code');
      }

      onSelect({
        ...cpt,
        mfr_factor: geoData.mfr_factor || 1,
        pfr_factor: geoData.pfr_factor || 1
      });

      onSearchTermChange(cpt.code);
      setShowCptOptions(false);
    } catch (error) {
      console.error('Error getting geographic factors:', error);
      setError('Error calculating adjusted rates');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700">CPT Code</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            onSearchTermChange(e.target.value);
            searchCPTCodes(e.target.value);
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Search CPT codes..."
        />
        {showCptOptions && cptOptions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
            {cptOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
                onClick={() => handleCPTSelection(option)}
              >
                <div className="font-medium">{option.code}</div>
                <div className="text-sm text-gray-500">{option.code_description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded">
          {error}
        </div>
      )}

      {selectedCPT && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Cost Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Base Rate</p>
              <p className="text-lg font-semibold">${selectedCPT.pfr_50th.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">MFR Adjusted</p>
              <p className="text-lg font-semibold">
                ${(selectedCPT.pfr_50th * (selectedCPT.mfr_factor || 1)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">PFR Adjusted</p>
              <p className="text-lg font-semibold">
                ${(selectedCPT.pfr_50th * (selectedCPT.pfr_factor || 1)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}