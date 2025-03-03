import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/LifeCarePlan/LoadingState";
import { PlanHeader } from "@/components/LifeCarePlan/PlanHeader";
import EvalueeForm from "@/components/LifeCarePlan/EvalueeForm";
import PlanForm from "@/components/LifeCarePlan/PlanForm";
import PlanTable from "@/components/LifeCarePlan/PlanTable";
import JsonViewer from "@/components/Debug/JsonViewer";
import { usePlanItems } from "@/hooks/usePlanItems";
import { usePlanData } from "@/hooks/usePlanData";
import { useCostCalculations } from "@/hooks/useCostCalculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PlanDetail = () => {
  const { id = "new" } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("evaluee");
  const [responseData, setResponseData] = useState<any>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { evaluee, setEvaluee, isLoading, items, refetch } = usePlanData(id);
  const { addItem: originalAddItem, deleteItem: originalDeleteItem, calculateTotals } = usePlanItems(id, items, refetch, evaluee || undefined);
  const { fetchGeoFactors } = useCostCalculations();

  const handleEvalueeSave = async (newEvaluee: any) => {
    try {
      if (id !== "new") {
        if (newEvaluee.zipCode && (!evaluee || newEvaluee.zipCode !== evaluee.zipCode)) {
          const geoFactors = await fetchGeoFactors(newEvaluee.zipCode);
          setResponseData({ type: 'Geographic Factors', data: geoFactors });
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
      setResponseData({ type: 'Error', data: error });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the life care plan"
      });
    }
  };

  const handleAddItem = async (newItem: any) => {
    try {
      await originalAddItem(newItem);
      // Force a refresh of the data after adding
      setForceUpdate(prev => prev + 1);
      // Explicitly call refetch to ensure data is updated
      await refetch();
      
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
      await originalDeleteItem(itemId);
      setForceUpdate(prev => prev + 1);
      await refetch();
      
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

  useEffect(() => {
    if (id !== "new") {
      refetch();
    }
  }, [forceUpdate, id, refetch]);

  if (isLoading) {
    return <LoadingState />;
  }

  const { categoryTotals, grandTotal, lifetimeLow, lifetimeHigh } = calculateTotals();
  
  console.log('PlanDetail evaluee:', evaluee);
  const evalueeFullName = evaluee ? `${evaluee.firstName} ${evaluee.lastName}`.trim() : "Unknown";
  console.log('PlanDetail evalueeFullName:', evalueeFullName);

  return (
    <div className="space-y-6 pb-20">
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
                onSubmit={handleAddItem} 
                dateOfBirth={evaluee?.dateOfBirth || ''}
                dateOfInjury={evaluee?.dateOfInjury || ''}
                lifeExpectancy={evaluee?.lifeExpectancy || ''}
              />
            </div>
            <div>
              <PlanTable
                key={`plan-table-${items.length}-${forceUpdate}`}
                items={items}
                categoryTotals={categoryTotals}
                grandTotal={grandTotal}
                lifetimeLow={lifetimeLow}
                lifetimeHigh={lifetimeHigh}
                onDeleteItem={deleteItem}
                evalueeName={evalueeFullName}
                planId={id}
                evaluee={evaluee || undefined}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <PlanTable
            key={`summary-table-${items.length}-${forceUpdate}`}
            items={items}
            categoryTotals={categoryTotals}
            grandTotal={grandTotal}
            lifetimeLow={lifetimeLow}
            lifetimeHigh={lifetimeHigh}
            onDeleteItem={deleteItem}
            evalueeName={evalueeFullName}
            planId={id}
            evaluee={evaluee || undefined}
          />
        </TabsContent>
      </Tabs>

      <JsonViewer data={responseData} />
    </div>
  );
};

export default PlanDetail;
