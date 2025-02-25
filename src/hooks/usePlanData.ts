
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Evaluee, CareCategory } from '@/types/lifecare';
import { useCostCalculations } from './useCostCalculations';
import { useQuery } from '@tanstack/react-query';

export const usePlanData = (id: string) => {
  const { toast } = useToast();
  const { fetchGeoFactors } = useCostCalculations();
  const [evaluee, setEvaluee] = useState<Evaluee | null>(null);

  const {
    data: items = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['plan-data', id],
    enabled: id !== 'new',
    queryFn: async () => {
      const { data: planData, error: planError } = await supabase
        .from('life_care_plans')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (planError) throw planError;

      if (!planData) {
        throw new Error('Plan not found');
      }

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

      setEvaluee(evalueeData);

      if (planData.zip_code) {
        await fetchGeoFactors(planData.zip_code);
      }

      const { data: entriesData, error: entriesError } = await supabase
        .from('care_plan_entries')
        .select('*')
        .eq('plan_id', id);

      if (entriesError) throw entriesError;

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

  const setItems = useCallback(async (newItems: any[]) => {
    if (id === 'new') return;
    
    try {
      for (const item of newItems) {
        const { error } = await supabase
          .from('care_plan_entries')
          .upsert({
            plan_id: id,
            category: item.category,
            item: item.service,
            frequency: item.frequency || '',
            cpt_code: item.cptCode || '',
            min_cost: item.costRange.low,
            avg_cost: item.costRange.average,
            max_cost: item.costRange.high,
            annual_cost: item.annualCost,
            lifetime_cost: item.annualCost * (Number(evaluee?.lifeExpectancy) || 1),
            start_age: 0,
            end_age: 100,
            is_one_time: item.frequency.toLowerCase().includes('one-time')
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update care plan items"
      });
    }
  }, [id, toast, evaluee?.lifeExpectancy]);

  return {
    evaluee,
    setEvaluee,
    isLoading,
    items,
    setItems,
    hasError: !!error
  };
};
