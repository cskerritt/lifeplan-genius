import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, User, Trash2, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface PlanCardProps {
  plan: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    city: string;
    state: string;
    zip_code: string;
    date_of_injury?: string;
    care_plan_entries?: any[];
  };
  onDelete: (id: string) => void;
}

const PlanCard = ({ plan, onDelete }: PlanCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <User className="w-5 h-5 mr-2 text-medical-500" />
            {plan.first_name} {plan.last_name}
          </span>
          <div className="flex gap-2">
            <Link to={`/plans/${plan.id}`}>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                View
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Life Care Plan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this life care plan? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(plan.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          {plan.city}, {plan.state} {plan.zip_code}
        </div>
        <div className="flex items-center text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          DOB: {new Date(plan.date_of_birth).toLocaleDateString()}
        </div>
        {plan.date_of_injury && (
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            Injury Date: {new Date(plan.date_of_injury).toLocaleDateString()}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">
            {plan.care_plan_entries?.length || 0} care items
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanCard;