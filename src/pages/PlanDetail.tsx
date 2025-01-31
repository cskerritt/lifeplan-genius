import { useState } from "react";
import { useParams } from "react-router-dom";
import EvalueeForm from "@/components/LifeCarePlan/EvalueeForm";
import PlanForm from "@/components/LifeCarePlan/PlanForm";
import PlanTable from "@/components/LifeCarePlan/PlanTable";
import { CareItem, Evaluee } from "@/types/lifecare";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PlanDetail = () => {
  const { id } = useParams();
  const [evaluee, setEvaluee] = useState<Evaluee | null>(null);
  const [items, setItems] = useState<CareItem[]>([]);

  const handleEvalueeSave = (newEvaluee: Evaluee) => {
    setEvaluee(newEvaluee);
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

  const handleAddItem = (newItem: Omit<CareItem, "id" | "annualCost">) => {
    const annualCost = calculateAnnualCost(
      newItem.frequency,
      newItem.costPerUnit
    );
    const item: CareItem = {
      ...newItem,
      id: crypto.randomUUID(),
      annualCost,
    };
    setItems((prev) => [...prev, item]);
  };

  const calculateTotals = () => {
    const totals = items.reduce((acc, item) => {
      const existingCategory = acc.find((t) => t.category === item.category);
      if (existingCategory) {
        existingCategory.total += item.annualCost;
      } else {
        acc.push({ category: item.category, total: item.annualCost });
      }
      return acc;
    }, [] as { category: string; total: number }[]);

    const grandTotal = totals.reduce((sum, category) => sum + category.total, 0);

    return { categoryTotals: totals, grandTotal };
  };

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
            <EvalueeForm onSave={handleEvalueeSave} />
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