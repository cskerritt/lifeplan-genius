import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { FileText, User, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { toast } = useToast();
  console.log("Fetching life care plans..."); // Debug log

  const { data: plans, isLoading, error } = useQuery({
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Life Care Plans Dashboard</h1>
        <p className="mt-2 text-gray-600">
          View and manage your life care plans
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card key={plan.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  {plan.first_name} {plan.last_name}
                </span>
                <Link to={`/plans/${plan.id}`}>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {plan.city}, {plan.state} {plan.zip_code}
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                DOB: {new Date(plan.date_of_birth).toLocaleDateString()}
              </div>
              {plan.date_of_injury && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
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

        {(!plans || plans.length === 0) && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No life care plans found</p>
            <Button className="mt-4" asChild>
              <Link to="/plans/new">Create New Plan</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;