import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import SearchBar from "@/components/Dashboard/SearchBar";
import PlanCard from "@/components/Dashboard/PlanCard";
import EmptyState from "@/components/Dashboard/EmptyState";

const Index = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: plans = [], isLoading, error, refetch } = useQuery({
    queryKey: ["life-care-plans"],
    queryFn: async () => {
      console.log("Fetching life care plans...");
      try {
        // Get the current user
        const authResult = await supabase.auth.getUser();
        if (!authResult.data.user) {
          throw new Error("User not authenticated");
        }

        // First, fetch all life care plans
        const plansQuery = supabase
          .from("life_care_plans")
          .select(`
            id,
            first_name,
            last_name,
            date_of_birth,
            date_of_injury,
            city,
            state,
            zip_code,
            created_at
          `);
        
        // Execute the query
        const result = await plansQuery.execute();

        if (result.error) {
          console.error("Error fetching plans:", result.error);
          toast({
            variant: "destructive",
            title: "Error fetching plans",
            description: result.error.message,
          });
          throw result.error;
        }

        // Now fetch the care plan entries for each plan
        const plansWithEntries = await Promise.all(
          result.data.map(async (plan) => {
            try {
              // For each plan, fetch its entries
              const entriesQuery = supabase
                .from("care_plan_entries")
                .select("*");
              
              // Execute the query with a filter
              const entriesResult = await entriesQuery.eq("plan_id", plan.id).execute();
              
              // Combine the plan with its entries
              return {
                ...plan,
                care_plan_entries: entriesResult.error ? [] : entriesResult.data
              };
            } catch (error) {
              console.error(`Error fetching entries for plan ${plan.id}:`, error);
              return {
                ...plan,
                care_plan_entries: []
              };
            }
          })
        );

        // Sort the data by created_at in descending order
        const sortedData = plansWithEntries ? [...plansWithEntries].sort((a, b) => {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }) : [];

        console.log("Fetched plans:", sortedData);
        return sortedData;
      } catch (error: any) {
        console.error("Error in query function:", error);
        toast({
          variant: "destructive",
          title: "Error fetching plans",
          description: error.message,
        });
        throw error;
      }
    },
    // Ensure the query is always fresh when the component mounts
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Force a refetch when the component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  const queryClient = useQueryClient();

  const handleDelete = async (planId: string) => {
    try {
      // Optimistic UI update - remove the plan from the UI immediately
      queryClient.setQueryData(["life-care-plans"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((plan: any) => plan.id !== planId);
      });

      // First delete related records in life_care_plan_totals
      const { error: totalsError } = await supabase
        .from('life_care_plan_totals')
        .delete()
        .eq('plan_id', planId);

      if (totalsError) throw totalsError;

      // Delete records from life_care_plan_category_totals
      const { error: categoryTotalsError } = await supabase
        .from('life_care_plan_category_totals')
        .delete()
        .eq('plan_id', planId);

      if (categoryTotalsError) throw categoryTotalsError;

      // Then delete care plan entries
      const { error: entriesError } = await supabase
        .from('care_plan_entries')
        .delete()
        .eq('plan_id', planId);

      if (entriesError) throw entriesError;

      // Finally delete the plan itself
      const { error } = await supabase
        .from('life_care_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Life care plan deleted successfully",
      });

      // After successful deletion, refetch the plans to ensure data consistency
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting plan",
        description: error.message,
      });
    }
  };

  const filteredPlans = plans.filter(plan => {
    const searchLower = searchTerm.toLowerCase();
    return (
      plan.first_name?.toLowerCase().includes(searchLower) ||
      plan.last_name?.toLowerCase().includes(searchLower) ||
      plan.city?.toLowerCase().includes(searchLower) ||
      plan.state?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Life Care Plans</h1>
          <p className="mt-1 text-gray-600">
            Manage and track your life care plans
          </p>
        </div>
        <Button asChild className="bg-medical-500 hover:bg-medical-600 whitespace-nowrap">
          <Link to="/plans/new">
            <Plus className="w-4 h-4 mr-2" />
            New Plan
          </Link>
        </Button>
      </div>

      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4 rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans?.length ? (
            filteredPlans.map((plan) => (
              <PlanCard 
                key={plan.id} 
                plan={{
                  id: plan.id,
                  first_name: plan.first_name,
                  last_name: plan.last_name,
                  date_of_birth: plan.date_of_birth,
                  date_of_injury: plan.date_of_injury,
                  city: plan.city,
                  state: plan.state,
                  zip_code: plan.zip_code,
                  care_plan_entries: plan.care_plan_entries
                }} 
                onDelete={handleDelete}
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
