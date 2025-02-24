import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EvalueeForm from "@/components/LifeCarePlan/EvalueeForm";
import PlanForm from "@/components/LifeCarePlan/PlanForm";
import PlanTable from "@/components/LifeCarePlan/PlanTable";
import { CareItem, Evaluee, CategoryTotal } from "@/types/lifecare";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evaluee, setEvaluee] = useState<Evaluee | null>(null);
  const [items, setItems] = useState<CareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [geoFactors, setGeoFactors] = useState<{ mfr_factor: number; pfr_factor: number } | null>(null);

  const fetchGeoFactors = async (zipCode: string) => {
    try {
      const { data, error } = await supabase
        .rpc('search_geographic_factors', { zip_code: zipCode });

      if (error) throw error;

      if (data && data.length > 0) {
        setGeoFactors({
          mfr_factor: data[0].mfr_code,
          pfr_factor: data[0].pfr_code
        });
      }
    } catch (error) {
      console.error('Error fetching geographic factors:', error);
    }
  };

  const lookupCPTCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('cpt_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error looking up CPT code:', error);
      return null;
    }
  };

  const calculateAdjustedCosts = async (
    baseRate: number,
    cptCode: string | null = null
  ) => {
    try {
      let low = baseRate;
      let average = baseRate;
      let high = baseRate;

      if (cptCode) {
        const cptData = await lookupCPTCode(cptCode);
        if (cptData) {
          low = cptData.pfr_50th;
          average = cptData.pfr_75th;
          high = cptData.pfr_90th;
        }
      }

      if (geoFactors) {
        const { mfr_factor, pfr_factor } = geoFactors;
        low *= ((mfr_factor + pfr_factor) / 2);
        average *= ((mfr_factor + pfr_factor) / 2) * 1.15;
        high *= ((mfr_factor + pfr_factor) / 2) * 1.25;
      }

      return {
        low: Math.round(low * 100) / 100,
        average: Math.round(average * 100) / 100,
        high: Math.round(high * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating adjusted costs:', error);
      return { low: baseRate, average: baseRate, high: baseRate };
    }
  };

  const calculateAnnualCost = (frequency: string, costPerUnit: number) => {
    const frequencyLower = frequency.toLowerCase();
    let multiplier = 1;

    if (frequencyLower.includes("per week")) {
      const timesPerWeek = parseInt(frequency);
      multiplier = timesPerWeek * 52;
    } else if (frequencyLower.includes("monthly")) {
      multiplier = 12;
    } else if (frequencyLower.includes("quarterly")) {
      multiplier = 4;
    } else if (frequencyLower.includes("annually")) {
      multiplier = 1;
    }

    return Math.round(costPerUnit * multiplier * 100) / 100;
  };

  const handleAddItem = async (newItem: Omit<CareItem, "id" | "annualCost">) => {
    try {
      const adjustedCosts = await calculateAdjustedCosts(newItem.costPerUnit, newItem.cptCode);
      
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

      if (id !== "new") {
        const { data: planData } = await supabase
          .from('life_care_plans')
          .select('life_expectancy')
          .eq('id', id)
          .single();
        
        const lifeExpectancy = planData?.life_expectancy || 1;
        const lifetimeCost = annualCost * lifeExpectancy;

        const { error } = await supabase
          .from('care_plan_entries')
          .insert({
            plan_id: id,
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

        if (error) throw error;
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

  useEffect(() => {
    const fetchPlanData = async () => {
      if (id === "new") {
        setIsLoading(false);
        return;
      }

      try {
        const { data: planData, error: planError } = await supabase
          .from('life_care_plans')
          .select('*')
          .eq('id', id)
          .single();

        if (planError) throw planError;

        if (planData) {
          setEvaluee({
            id: planData.id,
            firstName: planData.first_name,
            lastName: planData.last_name,
            dateOfBirth: planData.date_of_birth,
            gender: planData.gender,
            address: planData.street_address,
            phone: '',
            email: ''
          });

          const { data: entriesData, error: entriesError } = await supabase
            .from('care_plan_entries')
            .select('*')
            .eq('plan_id', id);

          if (entriesError) throw entriesError;

          if (entriesData) {
            const careItems: CareItem[] = entriesData.map(entry => ({
              id: entry.id,
              category: entry.category as any,
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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load the life care plan"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanData();
  }, [id]);

  const handleEvalueeSave = async (newEvaluee: any) => {
    try {
      if (id !== "new") {
        const { error } = await supabase
          .from('life_care_plans')
          .update({
            first_name: newEvaluee.firstName,
            last_name: newEvaluee.lastName,
            date_of_birth: newEvaluee.dateOfBirth,
            date_of_injury: newEvaluee.dateOfInjury,
            gender: newEvaluee.gender,
            zip_code: newEvaluee.zipCode,
            city: newEvaluee.city,
            state: newEvaluee.state,
            life_expectancy: parseFloat(newEvaluee.lifeExpectancy)
          })
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Life care plan updated successfully"
        });
      }
      setEvaluee(newEvaluee);
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the life care plan"
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

  const { categoryTotals, grandTotal } = calculateTotals();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {id === "new" ? "New Life Care Plan" : "Edit Life Care Plan"}
        </h1>
        <p className="mt-2 text-gray-600">
          {id === "new"
            ? "Create a new life care plan"
            : "Update existing life care plan"}
        </p>
      </div>

      <Tabs defaultValue="evaluee" className="w-full">
        <TabsList>
          <TabsTrigger value="evaluee">Evaluee Information</TabsTrigger>
          <TabsTrigger value="plan" disabled={!evaluee}>
            Care Plan Items
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={!evaluee}>
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evaluee">
          <Card>
            <EvalueeForm onSave={handleEvalueeSave} initialData={evaluee} />
          </Card>
        </TabsContent>

        <TabsContent value="plan">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PlanTable
                items={items}
                categoryTotals={categoryTotals}
                grandTotal={grandTotal}
              />
            </div>
            <div>
              <PlanForm onSubmit={handleAddItem} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <PlanTable
              items={items}
              categoryTotals={categoryTotals}
              grandTotal={grandTotal}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanDetail;
