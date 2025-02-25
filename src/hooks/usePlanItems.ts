
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CareItem, CategoryTotal } from "@/types/lifecare";
import { useToast } from "@/hooks/use-toast";
import { useCostCalculations } from "./useCostCalculations";

export const usePlanItems = (planId: string, items: CareItem[], onItemsChange: () => void) => {
  const { toast } = useToast();
  const { calculateAdjustedCosts, calculateAnnualCost, lookupCPTCode } = useCostCalculations();

  const calculateCosts = (baseRate: number, frequency: string) => {
    // Extract frequency numbers from strings like "2-3 times per year"
    const frequencyMatch = frequency.match(/(\d+)-(\d+)x?\s+(?:times?\s+)?per\s+year/i);
    const durationMatch = frequency.match(/(\d+)-(\d+)\s+years?/i);
    
    let lowFrequency = 1;
    let highFrequency = 1;
    let lowDuration = 1;
    let highDuration = 1;
    let isOneTime = frequency.toLowerCase().includes('one-time');

    if (frequencyMatch) {
      lowFrequency = parseInt(frequencyMatch[1]);
      highFrequency = parseInt(frequencyMatch[2]);
      console.log('Parsed frequency range:', { lowFrequency, highFrequency }, 'from:', frequency);
    }

    if (durationMatch) {
      lowDuration = parseInt(durationMatch[1]);
      highDuration = parseInt(durationMatch[2]);
      console.log('Parsed duration range:', { lowDuration, highDuration }, 'from:', frequency);
    }

    // Calculate costs with frequency
    const lowAnnualCost = baseRate * lowFrequency;
    const highAnnualCost = baseRate * highFrequency;
    const averageAnnualCost = (lowAnnualCost + highAnnualCost) / 2;

    console.log('Annual cost calculations:', {
      baseRate,
      lowFrequency,
      highFrequency,
      lowAnnualCost,
      highAnnualCost,
      averageAnnualCost
    });

    // Calculate lifetime costs
    // Low lifetime cost = low annual cost × low duration
    const lowLifetimeCost = lowAnnualCost * lowDuration;
    // High lifetime cost = high annual cost × high duration
    const highLifetimeCost = highAnnualCost * highDuration;
    const averageLifetimeCost = (lowLifetimeCost + highLifetimeCost) / 2;

    console.log('Lifetime cost calculations:', {
      lowDuration,
      highDuration,
      lowLifetimeCost,
      highLifetimeCost,
      averageLifetimeCost
    });

    if (isOneTime) {
      console.log('One-time cost, using base rate:', baseRate);
      return {
        annual: baseRate,
        lifetime: baseRate,
        low: baseRate,
        high: baseRate,
        average: baseRate
      };
    }

    // For annual costs, use the frequency-based calculations
    // For lifetime costs, use the duration-based calculations
    return {
      annual: averageAnnualCost,
      lifetime: averageLifetimeCost,
      low: lowLifetimeCost,      // Now using lifetime low cost
      high: highLifetimeCost,    // Now using lifetime high cost
      average: averageLifetimeCost
    };
  };

  const addItem = async (newItem: Omit<CareItem, "id" | "annualCost">) => {
    console.log('Adding new item:', newItem);
    try {
      let unitCost = newItem.costPerUnit;
      let cptDescription = null;
      
      if (newItem.cptCode && newItem.cptCode.trim() !== '') {
        const cptResult = await lookupCPTCode(newItem.cptCode);
        console.log('CPT code data found:', cptResult);
        
        if (cptResult && Array.isArray(cptResult) && cptResult.length > 0) {
          const cptData = cptResult[0];
          if (cptData.pfr_75th) {
            console.log('Using CPT code pricing:', cptData.pfr_75th);
            unitCost = cptData.pfr_75th;
            cptDescription = cptData.code_description;
          }
        }
      }

      const adjustedCosts = await calculateAdjustedCosts(
        unitCost,
        newItem.cptCode,
        newItem.category,
        newItem.costResources
      );
      console.log('Base adjusted costs:', adjustedCosts);

      // Calculate costs with frequency and duration
      const costs = calculateCosts(adjustedCosts.average, newItem.frequency);
      console.log('Final calculated costs:', costs);

      if (planId !== "new") {
        const insertData = {
          plan_id: planId,
          category: newItem.category,
          item: newItem.service,
          frequency: newItem.frequency,
          cpt_code: newItem.cptCode,
          cpt_description: cptDescription,
          min_cost: costs.low,
          avg_cost: costs.average,
          max_cost: costs.high,
          annual_cost: costs.annual,
          lifetime_cost: costs.lifetime,
          start_age: 0,
          end_age: 100,
          is_one_time: newItem.frequency.toLowerCase().includes('one-time')
        };

        console.log('Inserting data:', insertData);

        const { error } = await supabase
          .from('care_plan_entries')
          .insert(insertData);

        if (error) {
          console.error('Error inserting care plan entry:', error);
          throw error;
        }

        onItemsChange();
        
        toast({
          title: "Success",
          description: "Care item added successfully"
        });
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add care item"
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      console.log('Deleting item with ID:', itemId);
      
      if (planId !== "new") {
        const { error } = await supabase
          .from('care_plan_entries')
          .delete()
          .eq('id', itemId);

        if (error) {
          console.error('Error deleting care plan entry:', error);
          throw error;
        }

        onItemsChange();
        
        toast({
          title: "Success",
          description: "Care item deleted successfully"
        });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete care item"
      });
    }
  };

  const calculateTotals = useCallback(() => {
    const totals: CategoryTotal[] = items.reduce((acc, item) => {
      const existingCategory = acc.find((t) => t.category === item.category);
      if (existingCategory) {
        existingCategory.total += item.annualCost;
        existingCategory.costRange.low += item.costRange.low;
        existingCategory.costRange.average += item.costRange.average;
        existingCategory.costRange.high += item.costRange.high;
      } else {
        acc.push({
          category: item.category,
          total: item.annualCost,
          costRange: {
            low: item.costRange.low,
            average: item.costRange.average,
            high: item.costRange.high,
          },
        });
      }
      return acc;
    }, [] as CategoryTotal[]);

    const grandTotal = totals.reduce((sum, category) => sum + category.total, 0);

    return { categoryTotals: totals, grandTotal };
  }, [items]);

  return {
    addItem,
    deleteItem,
    calculateTotals
  };
};
