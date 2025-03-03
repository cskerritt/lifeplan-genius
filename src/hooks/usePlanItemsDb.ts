import { useToast } from "@/hooks/use-toast";
import { CareItem } from "@/types/lifecare";
import { executeQuery, shouldUseDirectConnection } from "@/utils/browserDbConnection";

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
  age_increments?: string; // JSON string of age increments
}

export const usePlanItemsDb = (planId: string, onItemsChange: () => void) => {
  const { toast } = useToast();

  const insertPlanItem = async (insertData: InsertData) => {
    console.log('Inserting data:', insertData);
    console.log('Original cost values:', {
      min_cost: insertData.min_cost,
      avg_cost: insertData.avg_cost,
      max_cost: insertData.max_cost,
      annual_cost: insertData.annual_cost,
      lifetime_cost: insertData.lifetime_cost
    });
    console.log('Original age values:', {
      start_age: insertData.start_age,
      end_age: insertData.end_age
    });

    try {
      // Helper function to safely format a number with 2 decimal places
      const safeFormat = (value: number | undefined | null): number => {
        if (value === undefined || value === null || isNaN(value)) {
          return 0;
        }
        return Number(value.toFixed(2));
      };
      
      // Create a new object with all cost and age values explicitly formatted as numeric
      // This ensures PostgreSQL recognizes them as numeric rather than integer
      const processedData = {
        ...insertData,
        // Format as number with 2 decimal places, with null checks
        min_cost: safeFormat(insertData.min_cost),
        avg_cost: safeFormat(insertData.avg_cost),
        max_cost: safeFormat(insertData.max_cost),
        annual_cost: safeFormat(insertData.annual_cost),
        lifetime_cost: safeFormat(insertData.lifetime_cost),
        // Also format age values with 2 decimal places
        start_age: safeFormat(insertData.start_age),
        end_age: safeFormat(insertData.end_age)
      };

      console.log('Processed data for insertion:', processedData);
      console.log('Processed cost values:', {
        min_cost: processedData.min_cost,
        avg_cost: processedData.avg_cost,
        max_cost: processedData.max_cost,
        annual_cost: processedData.annual_cost,
        lifetime_cost: processedData.lifetime_cost
      });
      console.log('Processed age values:', {
        start_age: processedData.start_age,
        end_age: processedData.end_age
      });

      // Verify that all cost and age values are valid numbers
      const numericValues = [
        processedData.min_cost,
        processedData.avg_cost,
        processedData.max_cost,
        processedData.annual_cost,
        processedData.lifetime_cost,
        processedData.start_age,
        processedData.end_age
      ];

      const allValidNumbers = numericValues.every(value => 
        !isNaN(value) && typeof value === 'number'
      );

      if (!allValidNumbers) {
        console.error('Numeric values are not all valid numbers:', numericValues);
        throw new Error('Cost and age values must be valid numbers');
      }

      // Always use direct PostgreSQL connection
      console.log('Using direct PostgreSQL connection for insertion...');
      
      // Construct the SQL query for direct insertion
      const query = `
        INSERT INTO care_plan_entries (
          plan_id, category, item, frequency, cpt_code, cpt_description,
          min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
          start_age, end_age, is_one_time, age_increments
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING *;
      `;
      
      // Prepare the parameters
      const params = [
        processedData.plan_id,
        processedData.category,
        processedData.item,
        processedData.frequency,
        processedData.cpt_code,
        processedData.cpt_description,
        processedData.min_cost,
        processedData.avg_cost,
        processedData.max_cost,
        processedData.annual_cost,
        processedData.lifetime_cost,
        processedData.start_age,
        processedData.end_age,
        processedData.is_one_time,
        processedData.age_increments || null
      ];
      
      // Execute the query
      const result = await executeQuery(query, params);
      console.log('Direct PostgreSQL insertion successful:', result.rows[0]);
      
      // Ensure the callback is called to trigger a refresh
      if (typeof onItemsChange === 'function') {
        onItemsChange();
      }
      
      toast({
        title: "Success",
        description: "Care item added successfully"
      });
      
      return result;
    } catch (error) {
      console.error('Exception in insertPlanItem:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add care item. Please try again."
      });
      throw error;
    }
  };

  const deletePlanItem = async (itemId: string) => {
    console.log('Deleting item with ID:', itemId);
    
    try {
      // Always use direct PostgreSQL connection
      console.log('Using direct PostgreSQL connection for deletion...');
      
      const query = `DELETE FROM care_plan_entries WHERE id = $1 RETURNING *;`;
      const result = await executeQuery(query, [itemId]);
      
      console.log('Direct PostgreSQL deletion successful:', result.rowCount, 'rows deleted');
      
      // Ensure the callback is called to trigger a refresh
      if (typeof onItemsChange === 'function') {
        onItemsChange();
      }
      
      return result;
    } catch (error) {
      console.error('Exception in deletePlanItem:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete care item. Please try again."
      });
      throw error;
    }
  };

  return {
    insertPlanItem,
    deletePlanItem
  };
};
