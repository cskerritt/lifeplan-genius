// Script to apply the SQL migration directly using the Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  console.error('Please check your .env file and ensure both variables are set correctly.');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL command to update the column types
const sql = `
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
`;

// Function to execute the SQL command
async function applyMigration() {
  console.log('Applying migration to update cost columns from integer to numeric...');
  
  try {
    // Execute the SQL command
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL command:', error);
      return;
    }
    
    console.log('Migration applied successfully!');
    
    // Verify the column types
    console.log('\nVerifying column types...');
    const { data: columnTypesData, error: columnTypesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'care_plan_entries' 
        AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
      `
    });
    
    if (columnTypesError) {
      console.error('Error verifying column types:', columnTypesError);
      return;
    }
    
    console.log('Column types after migration:');
    if (columnTypesData && columnTypesData.length > 0) {
      columnTypesData.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}`);
        
        // Check if the cost columns are numeric
        if (['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'].includes(row.column_name)) {
          if (row.data_type.toLowerCase() !== 'numeric') {
            console.warn(`Warning: ${row.column_name} is ${row.data_type}, not NUMERIC`);
          }
        }
      });
    } else {
      console.log('No column information found.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the migration
applyMigration();
