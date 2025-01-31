import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const EmptyState = () => {
  return (
    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
      <p className="text-gray-600">No life care plans found</p>
      <Button className="mt-4 bg-medical-500 hover:bg-medical-600" asChild>
        <Link to="/plans/new">
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Link>
      </Button>
    </div>
  );
};

export default EmptyState;