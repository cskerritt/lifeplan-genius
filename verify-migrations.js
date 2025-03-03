// Script to verify that migrations were successfully applied
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

// Function to verify the schema of the care_plan_entries table
async function verifySchema() {
  console.log('Verifying schema of care_plan_entries table...');
  
  try {
    // Query to get column information
    const { data, error } = await supabase
      .from('care_plan_entries')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying care_plan_entries table:', error);
      return;
    }
    
    // Check if the table has data
    if (data && data.length > 0) {
      console.log('Successfully queried care_plan_entries table');
      
      // Check if the new columns exist
      const entry = data[0];
      const hasUseAgeIncrements = 'use_age_increments' in entry;
      const hasAgeIncrements = 'age_increments' in entry;
      
      console.log('\nVerifying age increments columns:');
      console.log(`- use_age_increments column exists: ${hasUseAgeIncrements ? 'Yes' : 'No'}`);
      console.log(`- age_increments column exists: ${hasAgeIncrements ? 'Yes' : 'No'}`);
      
      if (hasUseAgeIncrements && hasAgeIncrements) {
        console.log('✅ Age increments migration was successfully applied');
      } else {
        console.log('❌ Age increments migration was NOT successfully applied');
      }
      
      // Check if cost columns are numeric
      console.log('\nVerifying cost columns:');
      const costColumns = ['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'];
      let allNumeric = true;
      
      costColumns.forEach(column => {
        const value = entry[column];
        const isNumeric = value === null || typeof value === 'number';
        console.log(`- ${column} is numeric: ${isNumeric ? 'Yes' : 'No'}`);
        
        if (!isNumeric) {
          allNumeric = false;
        }
      });
      
      if (allNumeric) {
        console.log('✅ Cost columns migration was successfully applied');
      } else {
        console.log('❌ Cost columns migration was NOT successfully applied');
      }
      
      console.log('\nSummary:');
      if (hasUseAgeIncrements && hasAgeIncrements && allNumeric) {
        console.log('✅ All migrations were successfully applied');
      } else {
        console.log('❌ Some migrations were NOT successfully applied');
      }
    } else {
      console.log('No data found in care_plan_entries table. Cannot verify schema.');
      
      // Try to get column information directly from the database
      console.log('\nAttempting to get column information from database...');
      const { data: columnData, error: columnError } = await supabase.rpc('get_column_info', {
        table_name: 'care_plan_entries'
      });
      
      if (columnError) {
        console.error('Error getting column information:', columnError);
        return;
      }
      
      if (columnData && columnData.length > 0) {
        console.log('Column information:');
        columnData.forEach(column => {
          console.log(`- ${column.column_name}: ${column.data_type}`);
        });
      } else {
        console.log('No column information found.');
      }
    }
  } catch (error) {
    console.error('Error verifying schema:', error);
  }
}

// Execute the function
verifySchema();
