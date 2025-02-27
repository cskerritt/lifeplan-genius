import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Evaluee, CareCategory } from '@/types/lifecare';
import { useCostCalculations } from './useCostCalculations';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const usePlanData = (id: string) => {
  const { toast } = useToast();
  const { fetchGeoFactors } = useCostCalculations();
  const [evaluee, setEvaluee] = useState<Evaluee | null>(null);
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['plan-data', id],
    enabled: id !== 'new',
    queryFn: async () => {
      // Fetch plan data
      const { data: planData, error: planError } = await supabase
        .from('life_care_plans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (planError) throw planError;

      if (!planData) {
        throw new Error('Plan not found');
      }

      // Transform plan data to evaluee format
      const evalueeData: Evaluee = {
        id: planData.id,
        firstName: planData.first_name || '',
        lastName: planData.last_name || '',
        dateOfBirth: planData.date_of_birth || '',
        dateOfInjury: planData.date_of_injury || '',
        gender: planData.gender || '',
        zipCode: planData.zip_code || '',
        city: planData.city || '',
        state: planData.state || '',
        address: planData.street_address || '',
        phone: '',
        email: '',
        lifeExpectancy: planData.life_expectancy?.toString() || ''
      };

      console.log('usePlanData evalueeData:', evalueeData);
      setEvaluee(evalueeData);

      if (planData.zip_code) {
        await fetchGeoFactors(planData.zip_code);
      }

      // Fetch care plan entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('care_plan_entries')
        .select('*')
        .eq('plan_id', id)
        .order('category');

      if (entriesError) throw entriesError;

      // Transform and return entries data
      return entriesData?.map(entry => ({
        id: entry.id.toString(),
        category: entry.category as CareCategory,
        service: entry.item,
        frequency: entry.frequency || '',
        cptCode: entry.cpt_code || '',
        costPerUnit: entry.avg_cost || 0,
        annualCost: entry.annual_cost || 0,
        costRange: {
          low: entry.min_cost || 0,
          average: entry.avg_cost || 0,
          high: entry.max_cost || 0
        }
      })) || [];
    }
  });

  return {
    evaluee,
    setEvaluee,
    isLoading,
    items,
    hasError: !!error,
    refetch
  };
};
