
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true;

    const fetchPlanData = async () => {
      if (id === "new") {
        setIsLoading(false);
        return;
      }

      try {
        // Check if we've already had an error to prevent infinite retries
        if (hasError) {
          return;
        }

        const { data: planData, error: planError } = await supabase
          .from('life_care_plans')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (planError) throw planError;

        // If plan doesn't exist, handle gracefully
        if (!planData) {
          throw new Error('Plan not found');
        }

        if (isMounted && planData) {
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

          if (isMounted && entriesData) {
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
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
        if (isMounted) {
          setHasError(true);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load the life care plan"
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPlanData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [id, toast, fetchGeoFactors, hasError]);

  return { evaluee, setEvaluee, isLoading, items, setItems, hasError };
};
