import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { FileText, User, MapPin, Calendar, Plus, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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

const Index = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  console.log("Fetching life care plans..."); // Debug log

  const { data: plans, isLoading, error, refetch } = useQuery({
    queryKey: ["life-care-plans"],
    queryFn: async () => {
      console.log("Executing query..."); // Debug log
      const { data, error } = await supabase
        .from("life_care_plans")
        .select(`
          *,
          care_plan_entries (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase error:", error); // Debug log
        toast({
          variant: "destructive",
          title: "Error fetching plans",
          description: error.message,
        });
        throw error;
      }

      console.log("Fetched data:", data); // Debug log
      return data;
    },
  });

  const handleDelete = async (planId: string) => {
    const { error } = await supabase
      .from('life_care_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting plan",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Success",
      description: "Life care plan deleted successfully",
    });
    refetch();
  };

  const filteredPlans = plans?.filter(plan => {
    const searchLower = searchTerm.toLowerCase();
    return (
      plan.first_name.toLowerCase().includes(searchLower) ||
      plan.last_name.toLowerCase().includes(searchLower) ||
      plan.city.toLowerCase().includes(searchLower) ||
      plan.state.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load life care plans</p>
        <pre className="mt-2 text-sm text-gray-600">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Life Care Plans Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage and track your life care plans
          </p>
        </div>
        <Button asChild className="bg-medical-500 hover:bg-medical-600">
          <Link to="/plans/new">
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search by name, city, or state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans?.map((plan) => (
          <Card key={plan.id} className="hover:shadow-lg transition-shadow">
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
                          onClick={() => handleDelete(plan.id)}
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
        ))}

        {(!filteredPlans || filteredPlans.length === 0) && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {searchTerm
                ? "No life care plans found matching your search"
                : "No life care plans found"}
            </p>
            <Button className="mt-4 bg-medical-500 hover:bg-medical-600" asChild>
              <Link to="/plans/new">
                <Plus className="w-4 h-4 mr-2" />
                Create New Plan
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;