import PlanForm from "@/components/LifeCarePlan/PlanForm";
import PlanTable from "@/components/LifeCarePlan/PlanTable";

const Index = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Life Care Plan</h1>
        <p className="mt-2 text-gray-600">
          Create and manage detailed life care plans
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PlanTable />
        </div>
        <div>
          <PlanForm />
        </div>
      </div>
    </div>
  );
};

export default Index;