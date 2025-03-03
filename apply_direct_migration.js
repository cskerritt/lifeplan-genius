// Script to directly apply the cost columns migration to the remote Supabase instance
import { createClient } from '@supabase/supabase-js';

// Supabase connection details (these should match what's in your application)
const SUPABASE_URL = 'https://ooewnlqozkypyceowuhy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgwNjM3OSwiZXhwIjoyMDUyMzgyMzc5fQ.aHAyAGaKzs4RP6-hbbwKWsCqJ2xcwDOex1gnTFH_0fI';

// Create a Supabase client with the service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('Applying migration to update cost columns from integer to numeric...');
  
  try {
    // First, let's verify we can connect to the database
    const { data: testData, error: testError } = await supabase
      .from('care_plan_entries')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Error connecting to Supabase:', testError);
      return;
    }
    
    console.log('Successfully connected to Supabase. Found entries:', testData.length);
    
    // Get a valid plan ID from the life_care_plans table
    const { data: planData, error: planError } = await supabase
      .from('life_care_plans')
      .select('id')
      .limit(1);
    
    if (planError) {
      console.error('Error fetching plan ID:', planError);
      return;
    }
    
    if (!planData || planData.length === 0) {
      console.error('No plans found in the database');
      return;
    }
    
    const validPlanId = planData[0].id;
    console.log('Using valid plan ID:', validPlanId);
    
    // Test by inserting a record with decimal values
    const testValue = 80.3;
    console.log(`Testing insertion with decimal value: ${testValue}`);
    
    const { data: insertData, error: insertError } = await supabase
      .from('care_plan_entries')
      .insert({
        plan_id: validPlanId, // Use a valid plan ID
        category: 'test',
        item: 'Migration Test',
        min_cost: testValue,
        avg_cost: testValue,
        max_cost: testValue,
        annual_cost: testValue,
        lifetime_cost: testValue,
        start_age: 0,
        end_age: 1
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting test record with decimal value:', insertError);
      
      if (insertError.code === '22P02' && insertError.message.includes('invalid input syntax for type integer')) {
        console.log('Confirmed the issue: columns are still integer type. Proceeding with migration...');
        
        // Since we can't execute arbitrary SQL through the REST API easily,
        // let's guide the user to apply the migration manually through the Supabase dashboard
        console.log('\n=== MANUAL MIGRATION INSTRUCTIONS ===');
        console.log('1. Log in to your Supabase dashboard at https://app.supabase.com/');
        console.log('2. Select your project');
        console.log('3. Go to the SQL Editor');
        console.log('4. Create a new query and paste the following SQL:');
        console.log(`
-- Update cost columns from integer to numeric to support decimal values
ALTER TABLE care_plan_entries
ALTER COLUMN min_cost TYPE NUMERIC,
ALTER COLUMN avg_cost TYPE NUMERIC,
ALTER COLUMN max_cost TYPE NUMERIC,
ALTER COLUMN annual_cost TYPE NUMERIC,
ALTER COLUMN lifetime_cost TYPE NUMERIC;

-- Update the comments to reflect the new column types
COMMENT ON COLUMN care_plan_entries.min_cost IS 'Minimum cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.avg_cost IS 'Average cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.max_cost IS 'Maximum cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.annual_cost IS 'Annual cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.lifetime_cost IS 'Lifetime cost (numeric to support decimal values)';
        `);
        console.log('5. Click "Run" to execute the query');
        console.log('6. After the migration is complete, restart your application');
        console.log('=== END OF INSTRUCTIONS ===\n');
      }
    } else {
      console.log('Successfully inserted test record with decimal value:', insertData);
      console.log('The columns are already numeric type. No migration needed.');
      
      // Clean up the test record
      const testId = insertData[0].id;
      const { error: deleteError } = await supabase
        .from('care_plan_entries')
        .delete()
        .eq('id', testId);
      
      if (deleteError) {
        console.error('Error cleaning up test record:', deleteError);
      } else {
        console.log('Test record cleaned up successfully');
      }
    }
    
  } catch (error) {
    console.error('Exception during migration:', error);
  }
}

// Run the migration
applyMigration(); 