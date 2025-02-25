
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/LifeCarePlan/LoadingState";
import { PlanHeader } from "@/components/LifeCarePlan/PlanHeader";
import EvalueeForm from "@/components/LifeCarePlan/EvalueeForm";
import PlanForm from "@/components/LifeCarePlan/PlanForm";
import PlanTable from "@/components/LifeCarePlan/PlanTable";
import { usePlanItems } from "@/hooks/usePlanItems";
import { usePlanData } from "@/hooks/usePlanData";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PlanDetail = () => {
  const { id = "new" } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("evaluee");
  const { evaluee, setEvaluee, isLoading, items, setItems, refetch } = usePlanData(id);
  const { addItem, deleteItem, calculateTotals } = usePlanItems(id, refetch);
  const { fetchGeoFactors } = useCostCalculations();

  const handleEvalueeSave = async (newEvaluee: any) => {
    try {
      if (id !== "new") {
        if (newEvaluee.zipCode && (!evaluee || newEvaluee.zipCode !== evaluee.zipCode)) {
          await fetchGeoFactors(newEvaluee.zipCode);
        }
        
        setEvaluee(newEvaluee);
        setActiveTab("plan");
        
        toast({
          title: "Success",
          description: "Life care plan updated successfully"
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the life care plan"
      });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const { categoryTotals, grandTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      <PlanHeader isNew={id === "new"} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          <EvalueeForm onSave={handleEvalueeSave} initialData={evaluee} />
        </TabsContent>

        <TabsContent value="plan">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PlanForm 
                onSubmit={addItem} 
                dateOfBirth={evaluee?.dateOfBirth || ''}
                dateOfInjury={evaluee?.dateOfInjury || ''}
                lifeExpectancy={evaluee?.lifeExpectancy || ''}
              />
            </div>
            <div>
              <PlanTable
                items={items}
                categoryTotals={categoryTotals}
                grandTotal={grandTotal}
                onDeleteItem={deleteItem}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <PlanTable
            items={items}
            categoryTotals={categoryTotals}
            grandTotal={grandTotal}
            onDeleteItem={deleteItem}
            evalueeName={`${evaluee?.firstName} ${evaluee?.lastName}`}
            planId={id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanDetail;
