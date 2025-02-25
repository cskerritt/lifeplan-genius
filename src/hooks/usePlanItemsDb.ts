
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CareItem } from "@/types/lifecare";

interface InsertData {
  plan_id: string;
  category: string;
  item: string;
  frequency: string;
  cpt_code: string | null;
  cpt_description: string | null;
  min_cost: number;
  avg_cost: number;
  max_cost: number;
  annual_cost: number;
  lifetime_cost: number;
  start_age: number;
  end_age: number;
  is_one_time: boolean;
}

export const usePlanItemsDb = (planId: string, onItemsChange: () => void) => {
  const { toast } = useToast();

  const insertPlanItem = async (insertData: InsertData) => {
    console.log('Inserting data:', insertData);

    const { error } = await supabase
      .from('care_plan_entries')
      .insert(insertData);

    if (error) {
      console.error('Error inserting care plan entry:', error);
      throw error;
    }

    onItemsChange();
    
    toast({
      title: "Success",
      description: "Care item added successfully"
    });
  };

  const deletePlanItem = async (itemId: string) => {
    console.log('Deleting item with ID:', itemId);
    
    const { error } = await supabase
      .from('care_plan_entries')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting care plan entry:', error);
      throw error;
    }

    onItemsChange();
    
    toast({
      title: "Success",
      description: "Care item deleted successfully"
    });
  };

  return {
    insertPlanItem,
    deletePlanItem
  };
};
