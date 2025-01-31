import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const EmptyState = () => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200">
      <FileText className="h-12 w-12 text-medical-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Life Care Plans Found</h3>
      <p className="text-gray-600 mb-6 text-center max-w-sm">
        Get started by creating your first life care plan. Click the button below to begin.
      </p>
      <Button className="bg-medical-500 hover:bg-medical-600" asChild>
        <Link to="/plans/new">
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Link>
      </Button>
    </div>
  );
};

export default EmptyState;