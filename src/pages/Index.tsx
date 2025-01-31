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

  const { data: plans, isLoading, error, refetch } = useQuery({
    queryKey: ["life-care-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_care_plans")
        .select(`
          *,
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

      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans?.length ? (
          filteredPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default Index;