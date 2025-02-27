import { useCallback } from "react";
import { CareItem, CategoryTotal } from "@/types/lifecare";
import { useToast } from "@/hooks/use-toast";
import { useCostCalculations } from "./useCostCalculations";
import { usePlanItemCosts } from "./usePlanItemCosts";
import { usePlanItemsDb } from "./usePlanItemsDb";
import { v4 as uuidv4 } from "uuid";
import { 
  calculateLifetimeCost, 
  isOneTimeItem, 
  getItemDuration,
  calculateCategoryLifetimeCost,
  getCategoryAgeRange
} from "@/utils/export/utils";

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
    // First, group items by category
    const groupedItems = items.reduce<Record<string, CareItem[]>>((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    // Calculate totals for each category
    const totals: CategoryTotal[] = Object.entries(groupedItems).map(([category, categoryItems]) => {
      // Calculate annual costs (sum of all non-one-time items)
      const annualTotal = categoryItems
        .filter(item => !isOneTimeItem(item))
        .reduce((sum, item) => sum + item.annualCost, 0);
      
      // Calculate cost ranges
      const lowTotal = categoryItems.reduce((sum, item) => sum + item.costRange.low, 0);
      const avgTotal = categoryItems.reduce((sum, item) => sum + item.costRange.average, 0);
      const highTotal = categoryItems.reduce((sum, item) => sum + item.costRange.high, 0);
      
      return {
        category: category as any,
        total: annualTotal,
        costRange: {
          low: lowTotal,
          average: avgTotal,
          high: highTotal
        }
      };
    });

    // Calculate grand total (sum of all category annual totals)
    const grandTotal = totals.reduce((sum, category) => sum + category.total, 0);
    
    // Calculate lifetime totals properly using age ranges
    let lifetimeLow = 0;
    let lifetimeHigh = 0;
    
    // Process each category
    Object.values(groupedItems).forEach(categoryItems => {
      // Get age range for the category
      const ageRange = getCategoryAgeRange(categoryItems);
      
      // Calculate annual costs for this category
      const annualCost = categoryItems
        .filter(item => !isOneTimeItem(item))
        .reduce((sum, item) => sum + item.annualCost, 0);
      
      // Calculate one-time costs for this category
      const oneTimeCost = categoryItems
        .filter(item => isOneTimeItem(item))
        .reduce((sum, item) => sum + item.costRange.average, 0);
      
      // Calculate lifetime costs based on age ranges
      if (ageRange.startAge !== undefined && ageRange.endAge !== undefined) {
        const duration = ageRange.endAge - ageRange.startAge;
        // Add annual costs multiplied by duration
        lifetimeLow += (annualCost * 0.8) * duration; // Using 80% of annual cost for low estimate
        lifetimeHigh += (annualCost * 1.2) * duration; // Using 120% of annual cost for high estimate
      } else {
        // If no category age range, calculate using individual item durations
        categoryItems.forEach(item => {
          if (isOneTimeItem(item)) {
            // Add one-time costs directly
            lifetimeLow += item.costRange.low;
            lifetimeHigh += item.costRange.high;
          } else if (item.startAge !== undefined && item.endAge !== undefined) {
            // Calculate based on individual item duration
            const duration = getItemDuration(item);
            lifetimeLow += item.costRange.low * duration;
            lifetimeHigh += item.costRange.high * duration;
          }
        });
      }
      
      // Add one-time costs
      lifetimeLow += oneTimeCost * 0.8; // Using 80% of one-time cost for low estimate
      lifetimeHigh += oneTimeCost * 1.2; // Using 120% of one-time cost for high estimate
    });

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
