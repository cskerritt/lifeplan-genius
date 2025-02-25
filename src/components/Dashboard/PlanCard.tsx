
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
import { format, parseISO } from 'date-fns';

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
  const formattedDateOfBirth = plan.date_of_birth ? format(parseISO(plan.date_of_birth), 'MM/dd/yyyy') : '';
  const formattedDateOfInjury = plan.date_of_injury ? format(parseISO(plan.date_of_injury), 'MM/dd/yyyy') : '';

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 bg-white/50 backdrop-blur-sm border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-full bg-medical-50 text-medical-500">
              <User className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900">
              {plan.first_name} {plan.last_name}
            </span>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link to={`/plans/${plan.id}`}>
              <Button variant="outline" size="sm" className="hover:bg-medical-50 hover:text-medical-600">
                <FileText className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Life Care Plan</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the life care plan for {plan.first_name} {plan.last_name}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(plan.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete Plan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            {plan.city}, {plan.state} {plan.zip_code}
          </div>
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            Born: {formattedDateOfBirth}
          </div>
          {plan.date_of_injury && (
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              Injury Date: {formattedDateOfInjury}
            </div>
          )}
        </div>
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Care Items</span>
            <span className="text-sm font-medium text-medical-600">
              {plan.care_plan_entries?.length || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanCard;
