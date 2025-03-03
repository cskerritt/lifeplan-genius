import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const SUPABASE_URL = "https://ooewnlqozkypyceowuhy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDYzNzksImV4cCI6MjA1MjM4MjM3OX0.SE6Wly7zpqKTMDM_uMuEYyeELelx1QVzpzADx6eGr30";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runSql() {
  console.log('Running SQL commands to update cost columns to numeric type...');
  
  try {
    // Execute the SQL commands
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
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

    if (error) {
      console.error('Error executing SQL commands:', error);
    } else {
      console.log('SQL commands executed successfully:', data);
    }
  } catch (error) {
    console.error('Exception executing SQL commands:', error);
  }
}

runSql();
