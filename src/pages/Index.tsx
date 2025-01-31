import { useState } from "react";
import PlanForm from "@/components/LifeCarePlan/PlanForm";
import PlanTable from "@/components/LifeCarePlan/PlanTable";
import EvalueeForm from "@/components/LifeCarePlan/EvalueeForm";
import { CareItem, Evaluee, CategoryTotal } from "@/types/lifecare";

const Index = () => {
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
    const annualCost = calculateAnnualCost(newItem.frequency, newItem.costPerUnit);
    const item: CareItem = {
      ...newItem,
      id: crypto.randomUUID(),
      annualCost,
    };
    setItems((prev) => [...prev, item]);
  };

  const calculateTotals = () => {
    const totals: CategoryTotal[] = [];
    let grandTotal = 0;

    items.forEach((item) => {
      grandTotal += item.annualCost;
      const categoryTotal = totals.find((t) => t.category === item.category);
      if (categoryTotal) {
        categoryTotal.total += item.annualCost;
      } else {
        totals.push({ category: item.category, total: item.annualCost });
      }
    });

    return { categoryTotals: totals, grandTotal };
  };

  const { categoryTotals, grandTotal } = calculateTotals();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Life Care Plan</h1>
        <p className="mt-2 text-gray-600">
          Create and manage detailed life care plans
        </p>
      </div>

      {!evaluee ? (
        <EvalueeForm onSave={handleEvalueeSave} />
      ) : (
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
      )}
    </div>
  );
};

export default Index;