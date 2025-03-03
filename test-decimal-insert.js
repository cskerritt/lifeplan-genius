// Script to test inserting decimal values into the care_plan_entries table
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

// Test data with decimal values
const testData = {
  plan_id: 'test-plan-id',
  category: 'test-category',
  item: 'Test Item with Decimal Costs',
  frequency: '4-4x per year 29 years',
  cpt_code: '99214',
  cpt_description: 'Office or other outpatient visit',
  min_cost: 80.3,
  avg_cost: 100.5,
  max_cost: 120.7,
  annual_cost: 402.0,
  lifetime_cost: 11658.0,
  start_age: 51,
  end_age: 80,
  is_one_time: false
};

// Function to test inserting decimal values
async function testDecimalInsert() {
  console.log('Testing insertion of decimal values into care_plan_entries table...');
  console.log('Test data:', testData);
  
  try {
    // First, check the column types
    console.log('\nChecking column types...');
    const { data: columnTypesData, error: columnTypesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'care_plan_entries')
      .in('column_name', ['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost']);
    
    if (columnTypesError) {
      console.error('Error checking column types:', columnTypesError);
    } else if (columnTypesData) {
      console.log('Column types:');
      columnTypesData.forEach(column => {
        console.log(`${column.column_name}: ${column.data_type}`);
      });
    }
    
    // Insert the test data
    console.log('\nInserting test data with decimal values...');
    const { data, error } = await supabase
      .from('care_plan_entries')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('Error inserting test data:', error);
      console.error('Error details:', JSON.stringify(error));
      
      // If the error is related to column types, try to apply the migration
      if (error.code === '22P02' && error.message.includes('invalid input syntax for type integer')) {
        console.log('\nError indicates column type mismatch. Attempting to apply migration...');
        
        // SQL command to update the column types
        const sql = `
          -- Update cost columns from integer to numeric to support decimal values
          ALTER TABLE care_plan_entries
          ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
          ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
          ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
          ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
          ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;
        `;
        
        try {
          // Try to execute the SQL command directly
          const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', { sql });
          
          if (sqlError) {
            console.error('Error applying migration:', sqlError);
            console.log('\nAlternative approach: Please run the migration manually using the Supabase dashboard.');
            console.log('SQL command:');
            console.log(sql);
          } else {
            console.log('Migration applied successfully!');
            
            // Try inserting the test data again
            console.log('\nRetrying insertion of test data...');
            const { data: retryData, error: retryError } = await supabase
              .from('care_plan_entries')
              .insert(testData)
              .select();
            
            if (retryError) {
              console.error('Error inserting test data after migration:', retryError);
            } else {
              console.log('Test data inserted successfully after migration!');
              console.log('Inserted data:', retryData);
            }
          }
        } catch (sqlExecError) {
          console.error('Error executing SQL command:', sqlExecError);
        }
      }
    } else {
      console.log('Test data inserted successfully!');
      console.log('Inserted data:', data);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the test
testDecimalInsert();
