// Script to apply migrations using Supabase JavaScript client with service role key
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

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

// Function to read a migration file
function readMigrationFile(filename) {
  const filePath = path.join('supabase', 'migrations', filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading migration file ${filename}:`, error);
    process.exit(1);
  }
}

// Main function to apply migrations
async function applyMigrations() {
  console.log('Applying migrations using Supabase client with service role key...');
  
  try {
    // Read migration files
    const ageIncrementsSQL = readMigrationFile('20250227152832_add_age_increments_columns.sql');
    const costColumnsSQL = readMigrationFile('20250227173300_update_cost_columns_to_numeric.sql');
    
    // Execute age increments migration
    console.log('Executing age increments migration...');
    const { data: ageIncrementsData, error: ageIncrementsError } = await supabase.rpc('apply_migration', {
      sql: ageIncrementsSQL
    });
    
    if (ageIncrementsError) {
      console.error('Error executing age increments migration:', ageIncrementsError);
      return;
    }
    
    console.log('Successfully executed age increments migration');
    
    // Execute cost columns migration
    console.log('Executing cost columns migration...');
    const { data: costColumnsData, error: costColumnsError } = await supabase.rpc('apply_migration', {
      sql: costColumnsSQL
    });
    
    if (costColumnsError) {
      console.error('Error executing cost columns migration:', costColumnsError);
      return;
    }
    
    console.log('Successfully executed cost columns migration');
    
    // Verify the column types
    console.log('\nVerifying column types...');
    const { data: columnTypesData, error: columnTypesError } = await supabase.rpc('get_column_types', {
      table_name: 'care_plan_entries',
      column_names: ['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost', 'use_age_increments', 'age_increments']
    });
    
    if (columnTypesError) {
      console.error('Error verifying column types:', columnTypesError);
      return;
    }
    
    console.log('Column types after migration:');
    columnTypesData.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
      
      // Check if the cost columns are numeric
      if (['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'].includes(row.column_name)) {
        if (row.data_type.toLowerCase() !== 'numeric') {
          console.warn(`Warning: ${row.column_name} is ${row.data_type}, not NUMERIC`);
        }
      }
      
      // Check if use_age_increments is boolean
      if (row.column_name === 'use_age_increments' && row.data_type.toLowerCase() !== 'boolean') {
        console.warn(`Warning: ${row.column_name} is ${row.data_type}, not BOOLEAN`);
      }
      
      // Check if age_increments is text
      if (row.column_name === 'age_increments' && row.data_type.toLowerCase() !== 'text') {
        console.warn(`Warning: ${row.column_name} is ${row.data_type}, not TEXT`);
      }
    });
    
    console.log('\nAll migrations successfully applied!');
  } catch (error) {
    console.error('Error applying migrations:', error);
  }
}

// Execute the main function
applyMigrations();
