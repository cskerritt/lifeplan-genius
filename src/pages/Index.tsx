
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import SearchBar from "@/components/Dashboard/SearchBar";
import PlanCard from "@/components/Dashboard/PlanCard";
import EmptyState from "@/components/Dashboard/EmptyState";

const Index = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ["life-care-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
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
          created_at,
          care_plan_entries (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching plans",
          description: error.message,
        });
        throw error;
      }

      return data || [];
    },
  });

  const handleDelete = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('life_care_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Life care plan deleted successfully",
      });
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
