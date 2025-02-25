import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CareItem, CategoryTotal } from "@/types/lifecare";
import { useToast } from "@/hooks/use-toast";
import { useCostCalculations } from "./useCostCalculations";

export const usePlanItems = (planId: string) => {
  const [items, setItems] = useState<CareItem[]>([]);
  const { toast } = useToast();
  const { calculateAdjustedCosts, calculateAnnualCost, lookupCPTCode } = useCostCalculations();

  const addItem = async (newItem: Omit<CareItem, "id" | "annualCost">) => {
    console.log('Adding new item:', newItem);
    try {
      let cptData = null;
      if (newItem.cptCode && newItem.cptCode.trim() !== '') {
        const cptResult = await lookupCPTCode(newItem.cptCode);
        console.log('CPT code data found:', cptResult);
        
        if (cptResult && Array.isArray(cptResult) && cptResult.length > 0) {
          cptData = cptResult[0];
          if (cptData.pfr_75th) {
            console.log('Using CPT code pricing:', cptData.pfr_75th);
            newItem.costPerUnit = cptData.pfr_75th;
          }
        }
      }

      const adjustedCosts = await calculateAdjustedCosts(
        newItem.costPerUnit,
        newItem.cptCode,
        newItem.category,
        newItem.costResources
      );
      console.log('Adjusted costs calculated:', adjustedCosts);
      
      const isOneTime = newItem.frequency.toLowerCase().includes('one-time');
      const annualCost = calculateAnnualCost(
        newItem.frequency,
        adjustedCosts.average,
        isOneTime
      );
      console.log('Annual cost calculated:', annualCost);
      
      const item: CareItem = {
        ...newItem,
        id: crypto.randomUUID(),
        annualCost,
        costRange: adjustedCosts
      };

      if (planId !== "new") {
        console.log('Adding item to existing plan:', planId);
        const { data: planData } = await supabase
          .from('life_care_plans')
          .select('life_expectancy')
          .eq('id', planId)
          .single();
        
        const lifeExpectancy = planData?.life_expectancy || 1;
        const lifetimeCost = annualCost * lifeExpectancy;

        const cptDescription = cptData?.code_description;

        const { error } = await supabase
          .from('care_plan_entries')
          .insert({
            plan_id: planId,
            category: item.category,
            item: item.service,
            frequency: item.frequency,
            cpt_code: item.cptCode,
            cpt_description: cptDescription,
            min_cost: adjustedCosts.low,
            avg_cost: adjustedCosts.average,
            max_cost: adjustedCosts.high,
            annual_cost: annualCost,
            lifetime_cost: lifetimeCost,
            start_age: 0,
            end_age: 100,
            is_one_time: isOneTime,
            mfr_adjusted: adjustedCosts.average,
            pfr_adjusted: adjustedCosts.average
          });

        if (error) {
          console.error('Error inserting care plan entry:', error);
          throw error;
        }
      }

      setItems(prev => [...prev, item]);
      
      toast({
        title: "Success",
        description: "Care item added successfully"
      });
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
      }

      setItems(prev => {
        const updatedItems = prev.filter(item => item.id !== itemId);
        console.log('Updated items after deletion:', updatedItems);
        return updatedItems;
      });
      
      toast({
        title: "Success",
        description: "Care item deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete care item"
      });
    }
  };

  const calculateTotals = () => {
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
  };

  return {
    items,
    setItems,
    addItem,
    deleteItem,
    calculateTotals
  };
};
