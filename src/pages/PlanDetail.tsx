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

  const handleAddItem = async (newItem: Omit<CareItem, "id" | "annualCost">) => {
    const annualCost = calculateAnnualCost(
      newItem.frequency,
      newItem.costPerUnit
    );
    
    const item: CareItem = {
      ...newItem,
      id: crypto.randomUUID(),
      annualCost,
    };

    try {
      if (id !== "new") {
        const { error } = await supabase
          .from('care_plan_entries')
          .insert([{
            plan_id: id,
            category: item.category,
            item: item.service,
            frequency: item.frequency,
            cpt_code: item.cptCode,
            min_cost: item.costRange.low,
            avg_cost: item.costRange.average,
            max_cost: item.costRange.high,
            annual_cost: item.annualCost
          }]);

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

  const calculateAnnualCost = (frequency: string, costPerUnit: number) => {
    const frequencyLower = frequency.toLowerCase();
    if (frequencyLower.includes("per week")) {
      const timesPerWeek = parseInt(frequency);
      return timesPerWeek * costPerUnit * 52;
    }
    if (frequencyLower.includes("monthly")) {
      return costPerUnit * 12;
    }
    if (frequencyLower.includes("quarterly")) {
      return costPerUnit * 4;
    }
    if (frequencyLower.includes("annually")) {
      return costPerUnit;
    }
    return costPerUnit;
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
