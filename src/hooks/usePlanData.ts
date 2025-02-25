
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Evaluee, CareCategory } from '@/types/lifecare';
import { useCostCalculations } from './useCostCalculations';

export const usePlanData = (id: string) => {
  const [evaluee, setEvaluee] = useState<Evaluee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  const { fetchGeoFactors } = useCostCalculations();
  const [items, setItems] = useState<any[]>([]);

  const fetchPlanData = useCallback(async () => {
    if (id === "new" || hasError) {
      setIsLoading(false);
      return;
    }

    try {
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

      if (entriesData) {
        const careItems = entriesData.map(entry => ({
          id: entry.id,
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
        }));
        setItems(careItems);
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      setHasError(true);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load the life care plan"
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast, fetchGeoFactors, hasError]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  return { evaluee, setEvaluee, isLoading, items, setItems, hasError };
};
