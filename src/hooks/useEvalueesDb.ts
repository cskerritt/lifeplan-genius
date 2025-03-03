import { useToast } from "@/hooks/use-toast";
import { Evaluee } from "@/types/lifecare";
import { executeQuery } from "@/utils/browserDbConnection";

interface EvalueeData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  date_of_injury?: string;
  gender: string;
  street_address: string;
  city: string;
  state: string;
  zip_code?: string;
  life_expectancy?: string;
  race?: string;
  county_apc?: string;
  county_drg?: string;
  age_at_injury?: number;
  statistical_lifespan?: number;
  use_age_increments?: boolean;
}

export const useEvalueesDb = (onEvalueeChange: () => void) => {
  const { toast } = useToast();

  const duplicateEvaluee = async (evalueeId: string, modifications: Partial<EvalueeData> = {}) => {
    console.log('Duplicating evaluee with ID:', evalueeId);
    console.log('With modifications:', modifications);
    
    try {
      // First, fetch the evaluee to duplicate
      const fetchQuery = `
        SELECT * FROM life_care_plans
        WHERE id = $1
        LIMIT 1
      `;
      const fetchResult = await executeQuery(fetchQuery, [evalueeId]);
      
      if (!fetchResult.rows || fetchResult.rows.length === 0) {
        throw new Error('Evaluee not found');
      }
      
      // Create a new evaluee based on the original
      const originalEvaluee = fetchResult.rows[0];
      
      // Generate a new ID using uuid
      const newId = crypto.randomUUID ? crypto.randomUUID() : 'temp-id';
      
      // Create the new evaluee data with modifications
      const newEvalueeData = {
        ...originalEvaluee,
        id: newId, // Use the new ID
        ...modifications // Apply any modifications
      };
      
      // Remove the created_at and updated_at fields to let the database set them
      delete newEvalueeData.created_at;
      delete newEvalueeData.updated_at;
      
      console.log('New evaluee data for duplication:', newEvalueeData);
      
      // Construct the SQL query for direct insertion
      const insertQuery = `
        INSERT INTO life_care_plans (
          id, user_id, first_name, last_name, date_of_birth, date_of_injury,
          race, gender, street_address, city, state, zip_code,
          county_apc, county_drg, age_at_injury, statistical_lifespan, use_age_increments
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *;
      `;
      
      // Prepare the parameters
      const params = [
        newEvalueeData.id,
        newEvalueeData.user_id,
        newEvalueeData.first_name,
        newEvalueeData.last_name,
        newEvalueeData.date_of_birth,
        newEvalueeData.date_of_injury,
        newEvalueeData.race,
        newEvalueeData.gender,
        newEvalueeData.street_address,
        newEvalueeData.city,
        newEvalueeData.state,
        newEvalueeData.zip_code,
        newEvalueeData.county_apc,
        newEvalueeData.county_drg,
        newEvalueeData.age_at_injury,
        newEvalueeData.statistical_lifespan,
        newEvalueeData.use_age_increments
      ];
      
      // Execute the query to create the new evaluee
      const result = await executeQuery(insertQuery, params);
      console.log('Direct PostgreSQL duplication successful for evaluee:', result.rows[0]);
      
      // Now fetch all care plan entries for the original evaluee
      const entriesQuery = `
        SELECT * FROM care_plan_entries
        WHERE plan_id = $1
      `;
      const entriesResult = await executeQuery(entriesQuery, [evalueeId]);
      
      if (entriesResult.rows && entriesResult.rows.length > 0) {
        console.log(`Found ${entriesResult.rows.length} care plan entries to duplicate`);
        
        // Duplicate each care plan entry
        for (const entry of entriesResult.rows) {
          // Generate a new ID for the entry
          const newEntryId = crypto.randomUUID ? crypto.randomUUID() : 'temp-entry-id';
          
          // Create a new entry with the new evaluee ID
          const insertEntryQuery = `
            INSERT INTO care_plan_entries (
              id, plan_id, category, item, frequency, cpt_code, cpt_description,
              min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
              start_age, end_age, is_one_time, notes, use_age_increments, age_increments,
              is_manual_cost, rationale
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
          `;
          
          // Prepare the parameters for the entry
          const entryParams = [
            newEntryId,
            newId, // Use the new evaluee ID
            entry.category,
            entry.item,
            entry.frequency,
            entry.cpt_code,
            entry.cpt_description,
            entry.min_cost,
            entry.avg_cost,
            entry.max_cost,
            entry.annual_cost,
            entry.lifetime_cost,
            entry.start_age,
            entry.end_age,
            entry.is_one_time,
            entry.notes,
            entry.use_age_increments,
            entry.age_increments,
            entry.is_manual_cost || false,
            entry.rationale
          ];
          
          // Execute the query to create the new entry
          await executeQuery(insertEntryQuery, entryParams);
        }
        
        console.log(`Successfully duplicated ${entriesResult.rows.length} care plan entries`);
      }
      
      // Ensure the callback is called to trigger a refresh
      if (typeof onEvalueeChange === 'function') {
        onEvalueeChange();
      }
      
      toast({
        title: "Success",
        description: "Evaluee and care plan items duplicated successfully"
      });
      
      return result.rows[0];
    } catch (error) {
      console.error('Exception in duplicateEvaluee:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to duplicate evaluee. Please try again."
      });
      throw error;
    }
  };

  return {
    duplicateEvaluee
  };
};
