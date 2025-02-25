
import { useCallback } from "react";
import { CareItem, CategoryTotal } from "@/types/lifecare";
import { useToast } from "@/hooks/use-toast";
import { useCostCalculations } from "./useCostCalculations";
import { usePlanItemCosts } from "./usePlanItemCosts";
import { usePlanItemsDb } from "./usePlanItemsDb";

export const usePlanItems = (planId: string, items: CareItem[], onItemsChange: () => void) => {
  const { toast } = useToast();
  const { calculateAdjustedCosts, lookupCPTCode } = useCostCalculations();
  const { calculateItemCosts } = usePlanItemCosts();
  const { insertPlanItem, deletePlanItem } = usePlanItemsDb(planId, onItemsChange);

  const addItem = async (newItem: Omit<CareItem, "id" | "annualCost">) => {
    console.log('Adding new item:', newItem);
    try {
      let unitCost = newItem.costPerUnit;
      let cptDescription = null;
      
      // For surgical and interventional items, use the provided cost range directly
      if (newItem.category === 'surgical' || newItem.category === 'interventional') {
        console.log('Using provided procedure costs:', newItem.costRange);
        const costs = calculateItemCosts(newItem.costRange.average, newItem.frequency);

        if (planId !== "new") {
          await insertPlanItem({
            plan_id: planId,
            category: newItem.category,
            item: newItem.service,
            frequency: newItem.frequency,
            cpt_code: newItem.cptCode,
            cpt_description: cptDescription,
            min_cost: newItem.costRange.low,
            avg_cost: newItem.costRange.average,
            max_cost: newItem.costRange.high,
            annual_cost: costs.annual,
            lifetime_cost: costs.lifetime,
            start_age: 0,
            end_age: 100,
            is_one_time: newItem.frequency.toLowerCase().includes('one-time')
          });
        }
        return;
      }
      
      // For non-surgical items, continue with existing logic
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
      const costs = calculateItemCosts(adjustedCosts.average, newItem.frequency);
      console.log('Final calculated costs:', costs);

      if (planId !== "new") {
        await insertPlanItem({
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
    
    // Calculate lifetime totals by summing the low and high ranges
    const lifetimeLow = totals.reduce((sum, category) => sum + category.costRange.low, 0);
    const lifetimeHigh = totals.reduce((sum, category) => sum + category.costRange.high, 0);

    return { 
      categoryTotals: totals, 
      grandTotal,
      lifetimeLow,
      lifetimeHigh
    };
  }, [items]);

  return {
    addItem,
    deleteItem: deletePlanItem,
    calculateTotals
  };
};
