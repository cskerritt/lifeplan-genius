
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EvalueeForm from "@/components/LifeCarePlan/EvalueeForm";
import PlanForm from "@/components/LifeCarePlan/PlanForm";
import PlanTable from "@/components/LifeCarePlan/PlanTable";
import { Evaluee, CareCategory } from "@/types/lifecare";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanItems } from "@/hooks/usePlanItems";
import { useCostCalculations } from "@/hooks/useCostCalculations";

const PlanDetail = () => {
  const { id = "new" } = useParams();
  const { toast } = useToast();
  const [evaluee, setEvaluee] = useState<Evaluee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { items, setItems, addItem, calculateTotals } = usePlanItems(id);
  const { fetchGeoFactors } = useCostCalculations();

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

        // Fetch geographic factors when zip code changes
        if (newEvaluee.zipCode && (!evaluee || newEvaluee.zipCode !== evaluee.zipCode)) {
          await fetchGeoFactors(newEvaluee.zipCode);
        }

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
          const evalueeData = {
            id: planData.id,
            firstName: planData.first_name,
            lastName: planData.last_name,
            dateOfBirth: planData.date_of_birth,
            dateOfInjury: planData.date_of_injury,
            gender: planData.gender,
            zipCode: planData.zip_code,
            city: planData.city,
            state: planData.state,
            address: planData.street_address,
            phone: '',
            email: ''
          };

          setEvaluee(evalueeData);

          // Fetch geographic factors only if we have a zip code
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
  }, [id]); // Remove setItems and fetchGeoFactors from dependencies

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const { categoryTotals, grandTotal } = calculateTotals();

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
              <PlanForm onSubmit={addItem} />
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
