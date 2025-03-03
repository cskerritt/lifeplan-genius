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
  is_manual_cost?: boolean;
  notes?: string;
  rationale?: string;
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
          console.warn(`Invalid numeric value detected: ${value}, defaulting to 0`);
          return 0;
        }
        // Ensure the value is a number and format it with 2 decimal places
        const numValue = Number(value);
        if (isNaN(numValue)) {
          console.warn(`Value could not be converted to number: ${value}, defaulting to 0`);
          return 0;
        }
        return Number(numValue.toFixed(2));
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
      if (
        isNaN(processedData.min_cost) ||
        isNaN(processedData.avg_cost) ||
        isNaN(processedData.max_cost) ||
        isNaN(processedData.annual_cost) ||
        isNaN(processedData.lifetime_cost) ||
        isNaN(processedData.start_age) ||
        isNaN(processedData.end_age)
      ) {
        console.error('Invalid numeric values detected in processed data:', processedData);
        throw new Error('Invalid numeric values detected in cost or age fields');
      }

      // Ensure costs are not zero when they shouldn't be
      if (processedData.annual_cost === 0 && !processedData.is_one_time) {
        console.warn('Annual cost is zero for a non-one-time item. This may be an error.');
        // If avg_cost is available, calculate a basic annual cost based on frequency
        if (processedData.avg_cost > 0) {
          // Extract frequency multiplier from the frequency string (simple approach)
          const freqMatch = processedData.frequency.match(/(\d+)x/i);
          const freqMultiplier = freqMatch ? parseInt(freqMatch[1]) : 1;
          
          // Set a basic annual cost
          processedData.annual_cost = processedData.avg_cost * freqMultiplier;
          console.log(`Calculated annual cost from avg_cost: ${processedData.annual_cost}`);
        }
      }

      // Use direct PostgreSQL connection for insertion
      console.log('Using direct PostgreSQL connection for insertion...');
      
      // Log the exact query and parameters being sent
      const query = `
        INSERT INTO care_plan_entries (
          plan_id, category, item, frequency, cpt_code, cpt_description,
          min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
          start_age, end_age, is_one_time, age_increments
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING *;
      `;
      
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
        processedData.age_increments
      ];
      
      console.log('INSERT query:', query);
      console.log('INSERT params:', params);
      console.log('INSERT cost values being sent:', {
        min_cost: processedData.min_cost,
        avg_cost: processedData.avg_cost,
        max_cost: processedData.max_cost,
        annual_cost: processedData.annual_cost,
        lifetime_cost: processedData.lifetime_cost
      });
      
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
      
      // Validate the itemId to prevent SQL injection
      if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
        throw new Error('Invalid item ID provided for deletion');
      }
      
      const query = `DELETE FROM care_plan_entries WHERE id = $1 RETURNING *;`;
      
      // Log the query and parameters for debugging
      console.log('Delete query:', query);
      console.log('Delete parameters:', [itemId]);
      
      const result = await executeQuery(query, [itemId]);
      
      console.log('Direct PostgreSQL deletion result:', result);
      console.log('Direct PostgreSQL deletion successful:', result.rowCount, 'rows deleted');
      
      // Check if any rows were actually deleted
      if (result.rowCount === 0) {
        console.warn('No rows were deleted. Item may not exist:', itemId);
      }
      
      // Ensure the callback is called to trigger a refresh
      if (typeof onItemsChange === 'function') {
        console.log('Calling onItemsChange callback after deletion');
        onItemsChange();
      }
      
      return result;
    } catch (error) {
      console.error('Exception in deletePlanItem:', error);
      
      // Provide more detailed error information
      let errorMessage = 'Failed to delete care item. Please try again.';
      
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check for specific error types
        if (error.message.includes('connection')) {
          errorMessage = 'Database connection error. Please check your connection and try again.';
        }
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
      
      throw error;
    }
  };

  const duplicatePlanItem = async (itemId: string, modifications: Partial<InsertData> = {}) => {
    console.log('Duplicating item with ID:', itemId);
    console.log('With modifications:', modifications);
    
    try {
      // First, fetch the item to duplicate
      const fetchQuery = `SELECT * FROM care_plan_entries WHERE id = $1;`;
      const fetchResult = await executeQuery(fetchQuery, [itemId]);
      
      if (fetchResult.rows.length === 0) {
        throw new Error('Item not found');
      }
      
      // Create a new item based on the original
      const originalItem = fetchResult.rows[0];
      
      // Generate a new ID using uuid
      const newId = crypto.randomUUID ? crypto.randomUUID() : 'temp-id';
      
      // Create the new item data with modifications
      const newItemData = {
        ...originalItem,
        id: newId, // Use the new ID
        ...modifications // Apply any modifications
      };
      
      // Remove the created_at and updated_at fields to let the database set them
      delete newItemData.created_at;
      delete newItemData.updated_at;
      
      console.log('New item data for duplication:', newItemData);
      
      // Helper function to safely format a number with 2 decimal places
      const safeFormat = (value: number | undefined | null): number => {
        if (value === undefined || value === null || isNaN(value)) {
          return 0;
        }
        return Number(value.toFixed(2));
      };
      
      // Create a new object with all cost and age values explicitly formatted as numeric
      const processedData = {
        ...newItemData,
        // Format as number with 2 decimal places, with null checks
        min_cost: safeFormat(newItemData.min_cost),
        avg_cost: safeFormat(newItemData.avg_cost),
        max_cost: safeFormat(newItemData.max_cost),
        annual_cost: safeFormat(newItemData.annual_cost),
        lifetime_cost: safeFormat(newItemData.lifetime_cost),
        // Also format age values with 2 decimal places
        start_age: safeFormat(newItemData.start_age),
        end_age: safeFormat(newItemData.end_age)
      };
      
      // Construct the SQL query for direct insertion
      const insertQuery = `
        INSERT INTO care_plan_entries (
          id, plan_id, category, item, frequency, cpt_code, cpt_description,
          min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
          start_age, end_age, is_one_time, age_increments
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *;
      `;
      
      // Prepare the parameters
      const params = [
        processedData.id,
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
      const result = await executeQuery(insertQuery, params);
      console.log('Direct PostgreSQL duplication successful:', result.rows[0]);
      
      // Ensure the callback is called to trigger a refresh
      if (typeof onItemsChange === 'function') {
        onItemsChange();
      }
      
      toast({
        title: "Success",
        description: "Care item duplicated successfully"
      });
      
      return result;
    } catch (error) {
      console.error('Exception in duplicatePlanItem:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate care item. Please try again."
      });
      throw error;
    }
  };

  return {
    insertPlanItem,
    deletePlanItem,
    duplicatePlanItem
  };
};
