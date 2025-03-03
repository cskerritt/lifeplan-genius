import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Evaluee, CareCategory } from '@/types/lifecare';
import { useCostCalculations } from './useCostCalculations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { executeQuery } from '@/utils/browserDbConnection';

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
      try {
        // Fetch plan data using direct PostgreSQL connection
        console.log('Fetching plan data with direct PostgreSQL connection...');
        const planQuery = `
          SELECT * FROM life_care_plans
          WHERE id = $1
          LIMIT 1
        `;
        const planResult = await executeQuery(planQuery, [id]);
        
        if (!planResult.rows || planResult.rows.length === 0) {
          throw new Error('Plan not found');
        }
        
        const planData = planResult.rows[0];
        console.log('Plan data fetched successfully:', planData);

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

        // Fetch care plan entries using direct PostgreSQL connection
        console.log('Fetching care plan entries with direct PostgreSQL connection...');
        const entriesQuery = `
          SELECT * FROM care_plan_entries
          WHERE plan_id = $1
          ORDER BY category
        `;
        const entriesResult = await executeQuery(entriesQuery, [id]);
        
        if (!entriesResult.rows) {
          return [];
        }
        
        console.log('Care plan entries fetched successfully:', entriesResult.rows.length, 'entries');

        // Transform and return entries data
        return entriesResult.rows.map(entry => {
          // Parse age increments if they exist
          let ageIncrements = undefined;
          let useAgeIncrements = false;
          
          if (entry.age_increments) {
            try {
              ageIncrements = JSON.parse(entry.age_increments);
              useAgeIncrements = true;
              console.log('Parsed age increments:', ageIncrements);
            } catch (error) {
              console.error('Error parsing age increments:', error);
            }
          }
          
          return {
            id: entry.id.toString(),
            category: entry.category as CareCategory,
            service: entry.item,
            frequency: entry.frequency || '',
            cptCode: entry.cpt_code || '',
            costPerUnit: parseFloat(entry.avg_cost) || 0,
            annualCost: parseFloat(entry.annual_cost) || 0,
            costRange: {
              low: parseFloat(entry.min_cost) || 0,
              average: parseFloat(entry.avg_cost) || 0,
              high: parseFloat(entry.max_cost) || 0
            },
            startAge: entry.start_age !== null && entry.start_age !== undefined ? parseFloat(entry.start_age) : undefined,
            endAge: entry.end_age !== null && entry.end_age !== undefined ? parseFloat(entry.end_age) : undefined,
            isOneTime: !!entry.is_one_time,
            // Add MFR and PFR values
            mfrMin: entry.mfr_min !== null ? parseFloat(entry.mfr_min) : undefined,
            mfrMax: entry.mfr_max !== null ? parseFloat(entry.mfr_max) : undefined,
            pfrMin: entry.pfr_min !== null ? parseFloat(entry.pfr_min) : undefined,
            pfrMax: entry.pfr_max !== null ? parseFloat(entry.pfr_max) : undefined,
            // Add geographic adjustment factors
            mfrFactor: entry.mfr_factor !== null ? parseFloat(entry.mfr_factor) : undefined,
            pfrFactor: entry.pfr_factor !== null ? parseFloat(entry.pfr_factor) : undefined,
            // Add age increment fields
            useAgeIncrements: useAgeIncrements,
            ageIncrements: ageIncrements
          };
        }) || [];
      } catch (error) {
        console.error('Error fetching plan data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch plan data. Please try again."
        });
        throw error;
      }
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
