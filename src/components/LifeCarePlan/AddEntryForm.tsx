import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CPTCode } from '@/types/lifecare';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddEntryFormProps {
  planId: string;
  category: string;
  zipCode: string;
  onClose: () => void;
  onSave: () => void;
}

export default function AddEntryForm({ planId, category, zipCode, onClose, onSave }: AddEntryFormProps) {
  const [item, setItem] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startAge, setStartAge] = useState('');
  const [endAge, setEndAge] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cptOptions, setCptOptions] = useState<CPTCode[]>([]);
  const [showCptOptions, setShowCptOptions] = useState(false);
  const [selectedCPT, setSelectedCPT] = useState<CPTCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCPTCodes = async (term: string) => {
    if (!term) {
      setCptOptions([]);
      setShowCptOptions(false);
      return;
    }
    const { data, error } = await supabase
      .from('cpt_codes')
      .select('*')
      .ilike('code_description', `%${term}%`);
    if (error) {
      console.error('Error fetching CPT codes:', error);
      return;
    }
    setCptOptions(data);
    setShowCptOptions(true);
  };

  const handleCPTSelection = (cpt: CPTCode) => {
    setSelectedCPT(cpt);
    setSearchTerm(cpt.code);
    setShowCptOptions(false);
  };

  const calculateCosts = () => {
    // Implement your cost calculation logic here
    return {
      min_cost: 0,
      max_cost: 0,
      avg_cost: 0,
      mfr_adjusted: 0,
      pfr_adjusted: 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCPT) {
      setError('Please select a CPT code');
      return;
    }

    const costs = calculateCosts();
    if (!costs) {
      setError('Error calculating costs');
      return;
    }

    setLoading(true);
    try {
      const annualCost = costs.avg_cost * parseFloat(frequency);
      const yearsOfCare = parseFloat(endAge) - parseFloat(startAge);
      const lifetimeCost = annualCost * yearsOfCare;

      const { error: saveError } = await supabase
        .from('care_plan_entries')
        .insert([{
          plan_id: planId,
          category,
          item,
          cpt_code: selectedCPT.code,
          cpt_description: selectedCPT.description,
          frequency: parseFloat(frequency),
          annual_cost: annualCost,
          lifetime_cost: lifetimeCost,
          start_age: parseFloat(startAge),
          end_age: parseFloat(endAge),
          min_cost: costs.min_cost,
          max_cost: costs.max_cost,
          avg_cost: costs.avg_cost,
          mfr_adjusted: costs.mfr_adjusted,
          pfr_adjusted: costs.pfr_adjusted
        }]);

      if (saveError) throw saveError;
      onSave();
    } catch (error) {
      console.error('Error saving entry:', error);
      setError('Error saving entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Add {category} Entry</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">
              {error}
            </div>
          )}

          <div className="relative">
            <Label>CPT Code</Label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchCPTCodes(e.target.value);
              }}
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
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Item</Label>
            <Input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Enter item"
            />
          </div>

          <div>
            <Label>Frequency</Label>
            <Input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Enter frequency"
            />
          </div>

          <div>
            <Label>Start Age</Label>
            <Input
              type="number"
              value={startAge}
              onChange={(e) => setStartAge(e.target.value)}
              placeholder="Enter start age"
            />
          </div>

          <div>
            <Label>End Age</Label>
            <Input
              type="number"
              value={endAge}
              onChange={(e) => setEndAge(e.target.value)}
              placeholder="Enter end age"
            />
          </div>

          <Button type="submit" loading={loading}>
            Add Entry
          </Button>
        </form>
      </div>
    </div>
  );
}
