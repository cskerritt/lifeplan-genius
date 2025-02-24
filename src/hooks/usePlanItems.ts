
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CareItem, CategoryTotal } from "@/types/lifecare";
import { useToast } from "@/hooks/use-toast";
import { useCostCalculations } from "./useCostCalculations";

export const usePlanItems = (planId: string) => {
  const [items, setItems] = useState<CareItem[]>([]);
  const { toast } = useToast();
  const { calculateAdjustedCosts, calculateAnnualCost } = useCostCalculations();

  const addItem = async (newItem: Omit<CareItem, "id" | "annualCost">) => {
    console.log('Adding new item:', newItem);
    try {
      const adjustedCosts = await calculateAdjustedCosts(newItem.costPerUnit, newItem.cptCode);
      console.log('Adjusted costs calculated:', adjustedCosts);
      
      const annualCost = calculateAnnualCost(
        newItem.frequency,
        adjustedCosts.average
      );
      
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

        const { error } = await supabase
          .from('care_plan_entries')
          .insert({
            plan_id: planId,
            category: item.category,
            item: item.service,
            frequency: item.frequency,
            cpt_code: item.cptCode,
            min_cost: adjustedCosts.low,
            avg_cost: adjustedCosts.average,
            max_cost: adjustedCosts.high,
            annual_cost: annualCost,
            start_age: 0,
            end_age: 100,
            lifetime_cost: lifetimeCost,
            is_one_time: false
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
    calculateTotals
  };
};
