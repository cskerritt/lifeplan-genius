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

    console.log('Searching CPT codes with term:', term);
    try {
      const { data, error } = await supabase
        .from('cpt_codes')
        .select('*')
        .or(`code.ilike.%${term}%,code_description.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      
      console.log('CPT code search results:', data);
      setCptOptions(data as CPTCode[]);
      setShowCptOptions(true);
    } catch (error) {
      console.error('Error searching CPT codes:', error);
      setError('Error searching CPT codes');
    }
  };

  const handleCPTSelection = async (cpt: CPTCode) => {
    console.log('Selected CPT code (raw):', cpt);
    try {
      console.log('Fetching geographic factors for ZIP:', zipCode);
      const { data: geoData, error: geoError } = await supabase
        .from('geographic_factors')
        .select('*')
        .eq('zip', zipCode.padStart(5, '0'))
        .maybeSingle();

      if (geoError) throw geoError;

      console.log('Geographic factors data:', geoData);
      
      if (!geoData) {
        console.warn('No geographic factors found for ZIP code:', zipCode);
        throw new Error('No geographic factors found for this ZIP code');
      }

      // Log the raw values from the CPT code
      console.log('CPT code raw values:', {
        mfu_50th: cpt.mfu_50th,
        mfu_75th: cpt.mfu_75th,
        mfu_90th: cpt.mfu_90th,
        pfr_50th: cpt.pfr_50th,
        pfr_75th: cpt.pfr_75th,
        pfr_90th: cpt.pfr_90th
      });
      
      // Log the geographic factors
      console.log('Geographic factors:', {
        mfr_factor: geoData.mfr_factor || 1,
        pfr_factor: geoData.pfr_factor || 1
      });
      
      // Create the enhanced CPT code with geographic factors
      const enhancedCPT = {
        ...cpt,
        mfr_factor: geoData.mfr_factor || 1,
        pfr_factor: geoData.pfr_factor || 1
      };
      
      console.log('Enhanced CPT code with geo factors:', enhancedCPT);
      
      onSelect(enhancedCPT);
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
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700">MFR</p>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-500">50th Percentile:</span>
                <span className="text-sm font-medium">${selectedCPT.mfu_50th?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">75th Percentile:</span>
                <span className="text-sm font-medium">${selectedCPT.mfu_75th?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">Geographic Factor:</span>
                <span className="text-sm font-medium">{(selectedCPT.mfr_factor || 1).toFixed(4)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-500">Adjusted (50th):</span>
                <span className="text-sm font-semibold">${((selectedCPT.mfu_50th || 0) * (selectedCPT.mfr_factor || 1)).toFixed(2)}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">PFR</p>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-500">50th Percentile:</span>
                <span className="text-sm font-medium">${selectedCPT.pfr_50th?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">75th Percentile:</span>
                <span className="text-sm font-medium">${selectedCPT.pfr_75th?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">Geographic Factor:</span>
                <span className="text-sm font-medium">{(selectedCPT.pfr_factor || 1).toFixed(4)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-500">Adjusted (50th):</span>
                <span className="text-sm font-semibold">${((selectedCPT.pfr_50th || 0) * (selectedCPT.pfr_factor || 1)).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Combined Base Rate</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Low (50th)</p>
                <p className="text-lg font-semibold">
                  ${(((selectedCPT.mfu_50th || 0) + (selectedCPT.pfr_50th || 0)) / 2).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">High (75th)</p>
                <p className="text-lg font-semibold">
                  ${(((selectedCPT.mfu_75th || 0) + (selectedCPT.pfr_75th || 0)) / 2).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average</p>
                <p className="text-lg font-semibold">
                  ${((((selectedCPT.mfu_50th || 0) + (selectedCPT.pfr_50th || 0)) / 2) + 
                     (((selectedCPT.mfu_75th || 0) + (selectedCPT.pfr_75th || 0)) / 2)) / 2).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}