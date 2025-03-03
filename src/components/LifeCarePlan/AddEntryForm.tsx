import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AgeIncrement, CPTCode } from '@/types/lifecare';
import { calculateAgeFromDOB } from '@/utils/calculations/durationCalculator';
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
  lowFrequencyPerYear: number;
  highFrequencyPerYear: number;
  lowDurationYears: number;
  highDurationYears: number;
}

export default function AddEntryForm({ planId, category, zipCode, onClose, onSave, dateOfBirth, dateOfInjury, lifeExpectancy }: AddEntryFormProps) {
  const [item, setItem] = useState('');
  const [frequencyDetails, setFrequencyDetails] = useState<FrequencyDetails>({
    startAge: 0,
    stopAge: 100,
    timesPerYear: 1,
    isOneTime: false,
    customFrequency: "",
    lowFrequencyPerYear: 1,
    highFrequencyPerYear: 1,
    lowDurationYears: 1,
    highDurationYears: 1
  });
  
  // Age increments state
  const [useAgeIncrements, setUseAgeIncrements] = useState(false);
  const [ageIncrements, setAgeIncrements] = useState<AgeIncrement[]>([]);
  const currentAge = calculateAgeFromDOB(dateOfBirth);
  
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

    console.log('Selected CPT code for cost calculation:', selectedCPT);
    
    // Log all the raw values from the CPT code
    console.log('Raw CPT code values:', {
      mfu_50th: selectedCPT.mfu_50th,
      mfu_75th: selectedCPT.mfu_75th,
      mfu_90th: selectedCPT.mfu_90th,
      pfr_50th: selectedCPT.pfr_50th,
      pfr_75th: selectedCPT.pfr_75th,
      pfr_90th: selectedCPT.pfr_90th,
      mfr_factor: selectedCPT.mfr_factor,
      pfr_factor: selectedCPT.pfr_factor
    });
    
    // Store the raw base rates without any adjustments
    const minCost = selectedCPT.pfr_50th || 0;
    const maxCost = selectedCPT.pfr_75th || 0;
    const avgCost = (minCost + maxCost) / 2;

    console.log('Base rates (unadjusted):', {
      minCost,
      maxCost,
      avgCost
    });

    // Store the geographic adjustment factors separately
    // Make sure we have the factors, defaulting to 1 if not available
    const mfrFactor = selectedCPT.mfr_factor || 1;
    const pfrFactor = selectedCPT.pfr_factor || 1;

    console.log('Geographic factors:', {
      mfrFactor,
      pfrFactor
    });

    // Store both MFR and PFR raw values
    // Note: The CPTCode interface uses mfu_* for Medicare values, but we store them as mfr_* in the database
    const mfrMin = selectedCPT.mfu_50th || 0;
    const mfrMax = selectedCPT.mfu_75th || 0;
    const pfrMin = selectedCPT.pfr_50th || 0;
    const pfrMax = selectedCPT.pfr_75th || 0;

    console.log('Raw MFR and PFR values:', {
      mfrMin,
      mfrMax,
      pfrMin,
      pfrMax
    });

    // Calculate adjusted values
    const mfrMinAdjusted = mfrMin * mfrFactor;
    const mfrMaxAdjusted = mfrMax * mfrFactor;
    const pfrMinAdjusted = pfrMin * pfrFactor;
    const pfrMaxAdjusted = pfrMax * pfrFactor;

    console.log('Adjusted MFR and PFR values:', {
      mfrMinAdjusted,
      mfrMaxAdjusted,
      pfrMinAdjusted,
      pfrMaxAdjusted
    });

    // Calculate combined values
    const combinedMinAdjusted = (mfrMinAdjusted + pfrMinAdjusted) / 2;
    const combinedMaxAdjusted = (mfrMaxAdjusted + pfrMaxAdjusted) / 2;
    const combinedAvgAdjusted = (combinedMinAdjusted + combinedMaxAdjusted) / 2;

    console.log('Combined adjusted values:', {
      combinedMinAdjusted,
      combinedMaxAdjusted,
      combinedAvgAdjusted
    });

    console.log('Calculated costs with detailed values:', {
      min_cost: minCost,
      max_cost: maxCost,
      avg_cost: avgCost,
      mfr_min: mfrMin,
      mfr_max: mfrMax,
      pfr_min: pfrMin,
      pfr_max: pfrMax,
      mfr_factor: mfrFactor,
      pfr_factor: pfrFactor,
      mfr_min_adjusted: mfrMinAdjusted,
      mfr_max_adjusted: mfrMaxAdjusted,
      pfr_min_adjusted: pfrMinAdjusted,
      pfr_max_adjusted: pfrMaxAdjusted
    });

    return {
      min_cost: minCost,
      max_cost: maxCost,
      avg_cost: avgCost,
      mfr_min: mfrMin,
      mfr_max: mfrMax,
      pfr_min: pfrMin,
      pfr_max: pfrMax,
      mfr_factor: mfrFactor,
      pfr_factor: pfrFactor
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
    
    // Validate end age against life expectancy
    if (!frequencyDetails.isOneTime && endAge) {
      const endAgeNum = parseFloat(endAge);
      const currentAgeNum = calculateAgeFromDOB(dateOfBirth);
      const maxAllowedAge = currentAgeNum + lifeExpectancy;
      
      if (endAgeNum > maxAllowedAge) {
        setError(`End age (${endAgeNum}) cannot exceed maximum allowed age (${maxAllowedAge}) based on life expectancy`);
        return;
      }
    }

    setLoading(true);
    try {
      // Calculate annual and lifetime costs based on frequency and duration
      // but store the raw base rates separately
      const baseRate = costs.avg_cost;
      const annualCost = frequencyDetails.isOneTime ? 0 : costs.avg_cost * parseFloat(minFrequency);
      const yearsOfCare = parseFloat(endAge) - parseFloat(startAge);
      const lifetimeCost = frequencyDetails.isOneTime ? costs.avg_cost : annualCost * yearsOfCare;

      // Prepare data for saving
      const entryData: any = {
        plan_id: planId,
        category,
        item,
        cpt_code: selectedCPT.code,
        cpt_description: selectedCPT.code_description,
        annual_cost: annualCost,
        lifetime_cost: lifetimeCost,
        // Store the raw base rates
        min_cost: costs.min_cost,
        max_cost: costs.max_cost,
        avg_cost: costs.avg_cost,
        // Store MFR and PFR raw values
        mfr_min: costs.mfr_min,
        mfr_max: costs.mfr_max,
        pfr_min: costs.pfr_min,
        pfr_max: costs.pfr_max,
        // Store the adjustment factors separately
        mfr_factor: costs.mfr_factor,
        pfr_factor: costs.pfr_factor,
        // Store the frequency information
        frequency: frequencyDetails.isOneTime ? "One-time" : minFrequency + "x per year"
      };

      // Add age increment data if using age increments
      if (useAgeIncrements && ageIncrements.length > 0) {
        entryData.use_age_increments = true;
        entryData.age_increments = JSON.stringify(ageIncrements);
        entryData.is_one_time = false;
        
        // Use the min and max ages from the age increments
        const sortedIncrements = [...ageIncrements].sort((a, b) => a.startAge - b.startAge);
        entryData.start_age = sortedIncrements[0].startAge;
        entryData.end_age = sortedIncrements[sortedIncrements.length - 1].endAge;
      } else {
        // Use standard frequency data
        entryData.is_one_time = frequencyDetails.isOneTime;
        entryData.min_frequency = frequencyDetails.isOneTime ? null : parseFloat(minFrequency);
        entryData.max_frequency = frequencyDetails.isOneTime ? null : parseFloat(maxFrequency) || parseFloat(minFrequency);
        entryData.min_duration = frequencyDetails.isOneTime ? null : parseFloat(minDuration);
        entryData.max_duration = frequencyDetails.isOneTime ? null : parseFloat(maxDuration) || parseFloat(minDuration);
        entryData.start_age = parseFloat(startAge);
        entryData.end_age = parseFloat(endAge);
        entryData.use_age_increments = false;
      }

      const { error: saveError } = await supabase
        .from('care_plan_entries')
        .insert(entryData);

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
                maxAge={currentAge + lifeExpectancy}
                currentAge={currentAge}
              />
            </TabsContent>

            <TabsContent value="frequency">
              <FrequencyForm
                frequencyDetails={frequencyDetails}
                onFrequencyChange={handleFrequencyChange}
                dateOfBirth={dateOfBirth}
                dateOfInjury={dateOfInjury}
                lifeExpectancy={lifeExpectancy.toString()}
                useAgeIncrements={useAgeIncrements}
                onUseAgeIncrementsChange={setUseAgeIncrements}
                ageIncrements={ageIncrements}
                onAgeIncrementsChange={setAgeIncrements}
                currentAge={currentAge}
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
              disabled={loading || !selectedCPT || 
                (useAgeIncrements ? ageIncrements.length === 0 : (!startAge || !endAge || (!frequencyDetails.isOneTime && !minFrequency)))}
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
