import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CPTCode } from '@/types/lifecare';
import { CPTCodeSearch } from './CPTCodeSearch';
import { AgeRangeForm } from './AgeRangeForm';
import { FrequencyForm } from './FrequencyForm';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AddEntryFormProps {
  planId: string;
  category: string;
  zipCode: string;
  onClose: () => void;
  onSave: () => void;
  dateOfBirth: string;
  dateOfInjury: string;
  lifeExpectancy: number;
}

interface FrequencyDetails {
  startAge: number;
  stopAge: number;
  timesPerYear: number;
  isOneTime: boolean;
  customFrequency: string;
}

export default function AddEntryForm({ planId, category, zipCode, onClose, onSave, dateOfBirth, dateOfInjury, lifeExpectancy }: AddEntryFormProps) {
  const [item, setItem] = useState('');
  const [frequencyDetails, setFrequencyDetails] = useState<FrequencyDetails>({
    startAge: 0,
    stopAge: 100,
    timesPerYear: 1,
    isOneTime: false,
    customFrequency: "",
  });
  const [minFrequency, setMinFrequency] = useState('');
  const [maxFrequency, setMaxFrequency] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [startAge, setStartAge] = useState('');
  const [endAge, setEndAge] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCPT, setSelectedCPT] = useState<CPTCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('costs');

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

  const handleFrequencyChange = (field: keyof FrequencyDetails, value: number | boolean | string) => {
    setFrequencyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateFrequencyCosts = (baseCosts: ReturnType<typeof calculateCosts>) => {
    if (!baseCosts) return null;

    if (frequencyDetails.isOneTime) {
      return {
        min_annual_cost: 0,
        max_annual_cost: 0,
        avg_annual_cost: 0,
        one_time_cost: baseCosts.avg_cost
      };
    }

    const minFreq = parseFloat(minFrequency) || 0;
    const maxFreq = parseFloat(maxFrequency) || minFreq;
    const minDur = parseFloat(minDuration) || 1;
    const maxDur = parseFloat(maxDuration) || minDur;

    const minAnnualCost = baseCosts.min_cost * minFreq;
    const maxAnnualCost = baseCosts.max_cost * maxFreq;
    const avgAnnualCost = (minAnnualCost + maxAnnualCost) / 2;

    return {
      min_annual_cost: minAnnualCost,
      max_annual_cost: maxAnnualCost,
      avg_annual_cost: avgAnnualCost,
      one_time_cost: null
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
      const annualCost = frequencyDetails.isOneTime ? 0 : costs.avg_cost * parseFloat(minFrequency);
      const yearsOfCare = parseFloat(endAge) - parseFloat(startAge);
      const lifetimeCost = frequencyDetails.isOneTime ? costs.avg_cost : annualCost * yearsOfCare;

      const { error: saveError } = await supabase
        .from('care_plan_entries')
        .insert({
          plan_id: planId,
          category,
          item,
          cpt_code: selectedCPT.code,
          cpt_description: selectedCPT.code_description,
          is_one_time: frequencyDetails.isOneTime,
          min_frequency: frequencyDetails.isOneTime ? null : parseFloat(minFrequency),
          max_frequency: frequencyDetails.isOneTime ? null : parseFloat(maxFrequency) || parseFloat(minFrequency),
          min_duration: frequencyDetails.isOneTime ? null : parseFloat(minDuration),
          max_duration: frequencyDetails.isOneTime ? null : parseFloat(maxDuration) || parseFloat(minDuration),
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
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

            <TabsContent value="costs">
              <CPTCodeSearch
                onSelect={setSelectedCPT}
                zipCode={zipCode}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                selectedCPT={selectedCPT}
              />
            </TabsContent>

            <TabsContent value="age">
              <AgeRangeForm
                startAge={startAge}
                endAge={endAge}
                onStartAgeChange={setStartAge}
                onEndAgeChange={setEndAge}
              />
            </TabsContent>

            <TabsContent value="frequency">
              <FrequencyForm
                frequencyDetails={frequencyDetails}
                onFrequencyChange={handleFrequencyChange}
                dateOfBirth={dateOfBirth}
                dateOfInjury={dateOfInjury}
                lifeExpectancy={lifeExpectancy}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCPT || !startAge || !endAge ||
                (!frequencyDetails.isOneTime && (!minFrequency ))}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
