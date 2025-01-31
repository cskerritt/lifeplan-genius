import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CPTCode } from '@/types/lifecare';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AddEntryFormProps {
  planId: string;
  category: string;
  zipCode: string;
  onClose: () => void;
  onSave: () => void;
}

export default function AddEntryForm({ planId, category, zipCode, onClose, onSave }: AddEntryFormProps) {
  const [item, setItem] = useState('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [minFrequency, setMinFrequency] = useState('');
  const [maxFrequency, setMaxFrequency] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [startAge, setStartAge] = useState('');
  const [endAge, setEndAge] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cptOptions, setCptOptions] = useState<CPTCode[]>([]);
  const [showCptOptions, setShowCptOptions] = useState(false);
  const [selectedCPT, setSelectedCPT] = useState<CPTCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('costs');

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

      setSelectedCPT({
        ...cpt,
        mfr_factor: geoData.mfr_factor || 1,
        pfr_factor: geoData.pfr_factor || 1
      });

      setSearchTerm(cpt.code);
      setItem(cpt.code_description);
      setShowCptOptions(false);
    } catch (error) {
      console.error('Error getting geographic factors:', error);
      setError('Error calculating adjusted rates');
    }
  };

  const calculateCosts = () => {
    if (!selectedCPT) return null;

    const mfrFactor = selectedCPT.mfr_factor || 1;
    const pfrFactor = selectedCPT.pfr_factor || 1;

    const minCost = selectedCPT.pfr_50th * pfrFactor;
    const maxCost = selectedCPT.pfr_75th * pfrFactor;
    const avgCost = (minCost + maxCost) / 2;

    return {
      min_cost: minCost,
      max_cost: maxCost,
      avg_cost: avgCost,
      mfr_adjusted: selectedCPT.mfu_50th * mfrFactor,
      pfr_adjusted: selectedCPT.pfr_50th * pfrFactor
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
      const annualCost = isOneTime ? 0 : costs.avg_cost * parseFloat(minFrequency);
      const yearsOfCare = parseFloat(endAge) - parseFloat(startAge);
      const lifetimeCost = isOneTime ? costs.avg_cost : annualCost * yearsOfCare;

      const { error: saveError } = await supabase
        .from('care_plan_entries')
        .insert({
          plan_id: planId,
          category,
          item,
          cpt_code: selectedCPT.code,
          cpt_description: selectedCPT.code_description,
          is_one_time: isOneTime,
          min_frequency: isOneTime ? null : parseFloat(minFrequency),
          max_frequency: isOneTime ? null : parseFloat(maxFrequency) || parseFloat(minFrequency),
          min_duration: isOneTime ? null : parseFloat(minDuration),
          max_duration: isOneTime ? null : parseFloat(maxDuration) || parseFloat(minDuration),
          annual_cost: annualCost,
          lifetime_cost: lifetimeCost,
          start_age: parseFloat(startAge),
          end_age: parseFloat(endAge),
          min_cost: costs.min_cost,
          max_cost: costs.max_cost,
          avg_cost: costs.avg_cost,
          mfr_adjusted: costs.mfr_adjusted,
          pfr_adjusted: costs.pfr_adjusted
        });

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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="costs">Cost Calculations</TabsTrigger>
              <TabsTrigger value="age">Age Range</TabsTrigger>
              <TabsTrigger value="frequency">Frequency</TabsTrigger>
            </TabsList>

            <TabsContent value="costs" className="space-y-4">
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
                        <div className="text-sm text-gray-500">{option.code_description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Item Description</Label>
                <Input
                  type="text"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  required
                />
              </div>

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
            </TabsContent>

            <TabsContent value="age" className="space-y-4">
              <div>
                <Label>Start Age</Label>
                <Input
                  type="number"
                  value={startAge}
                  onChange={(e) => setStartAge(e.target.value)}
                  required
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label>End Age</Label>
                <Input
                  type="number"
                  value={endAge}
                  onChange={(e) => setEndAge(e.target.value)}
                  required
                  min="0"
                  step="0.1"
                />
              </div>
            </TabsContent>

            <TabsContent value="frequency" className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="oneTime"
                  checked={isOneTime}
                  onChange={(e) => setIsOneTime(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <Label htmlFor="oneTime">One-time cost</Label>
              </div>

              {!isOneTime && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Frequency</Label>
                      <Input
                        type="number"
                        value={minFrequency}
                        onChange={(e) => setMinFrequency(e.target.value)}
                        required={!isOneTime}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Maximum Frequency</Label>
                      <Input
                        type="number"
                        value={maxFrequency}
                        onChange={(e) => setMaxFrequency(e.target.value)}
                        min={parseFloat(minFrequency) || 0}
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Duration (years)</Label>
                      <Input
                        type="number"
                        value={minDuration}
                        onChange={(e) => setMinDuration(e.target.value)}
                        required={!isOneTime}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label>Maximum Duration (years)</Label>
                      <Input
                        type="number"
                        value={maxDuration}
                        onChange={(e) => setMaxDuration(e.target.value)}
                        min={parseFloat(minDuration) || 0.1}
                        step="0.1"
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedCPT || !startAge || !endAge ||
                (!isOneTime && (!minFrequency || !minDuration))}
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}