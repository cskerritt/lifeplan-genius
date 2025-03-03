// Direct SQL fix to update cost columns from integer to numeric
import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const SUPABASE_URL = 'https://ooewnlqozkypyceowuhy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDYzNzksImV4cCI6MjA1MjM4MjM3OX0.SE6Wly7zpqKTMDM_uMuEYyeELelx1QVzpzADx6eGr30';

// Create a Supabase client with the anon key
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function applyMigration() {
  console.log('Applying migration to update cost columns from integer to numeric...');
  
  try {
    // We'll use the Supabase REST API to execute the SQL commands
    // Since we can't directly execute SQL with the JavaScript client,
    // we'll create a function in the database that we can call
    
    // First, let's try to create a function that will execute our SQL
    console.log('Creating SQL function to update column types...');
    
    const { data: functionData, error: functionError } = await supabase
      .from('_functions')
      .insert({
        name: 'update_cost_columns_to_numeric',
        definition: `
          -- Update cost columns from integer to numeric to support decimal values
          ALTER TABLE care_plan_entries
          ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
          ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
          ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
          ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
          ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;

          -- Update the comments to reflect the new column types
          COMMENT ON COLUMN care_plan_entries.min_cost IS 'Minimum cost (numeric to support decimal values)';
          COMMENT ON COLUMN care_plan_entries.avg_cost IS 'Average cost (numeric to support decimal values)';
          COMMENT ON COLUMN care_plan_entries.max_cost IS 'Maximum cost (numeric to support decimal values)';
          COMMENT ON COLUMN care_plan_entries.annual_cost IS 'Annual cost (numeric to support decimal values)';
          COMMENT ON COLUMN care_plan_entries.lifetime_cost IS 'Lifetime cost (numeric to support decimal values)';
        `
      });
    
    if (functionError) {
      console.error('Error creating function:', functionError);
      
      // If we can't create a function, let's try an alternative approach
      console.log('Trying alternative approach...');
      
      // We'll use the Supabase CLI to apply the migration
      console.log('Please run the following command manually to apply the migration:');
      console.log('npx supabase migration up');
      
      console.log('\nAlternatively, you can run the SQL commands directly in the Supabase dashboard:');
      console.log(`
        -- Update cost columns from integer to numeric to support decimal values
        ALTER TABLE care_plan_entries
        ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
        ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
        ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
        ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
        ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;

        -- Update the comments to reflect the new column types
        COMMENT ON COLUMN care_plan_entries.min_cost IS 'Minimum cost (numeric to support decimal values)';
        COMMENT ON COLUMN care_plan_entries.avg_cost IS 'Average cost (numeric to support decimal values)';
        COMMENT ON COLUMN care_plan_entries.max_cost IS 'Maximum cost (numeric to support decimal values)';
        COMMENT ON COLUMN care_plan_entries.annual_cost IS 'Annual cost (numeric to support decimal values)';
        COMMENT ON COLUMN care_plan_entries.lifetime_cost IS 'Lifetime cost (numeric to support decimal values)';
      `);
      
      return;
    }
    
    console.log('Function created successfully:', functionData);
    
    // Now, let's call the function
    console.log('Calling function to update column types...');
    
    const { data: callData, error: callError } = await supabase
      .rpc('update_cost_columns_to_numeric');
    
    if (callError) {
      console.error('Error calling function:', callError);
      return;
    }
    
    console.log('Function called successfully:', callData);
    console.log('Migration applied successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the migration
applyMigration();
