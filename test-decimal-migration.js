// Simple script to test if the migration to change cost columns to numeric type was applied correctly
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const SUPABASE_URL = "https://ooewnlqozkypyceowuhy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDYzNzksImV4cCI6MjA1MjM4MjM3OX0.SE6Wly7zpqKTMDM_uMuEYyeELelx1QVzpzADx6eGr30";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testDecimalMigration() {
  console.log('Testing if cost columns accept decimal values...');
  
  // Test data with decimal costs
  const testData = {
    plan_id: '00000000-0000-0000-0000-000000000000', // Fake UUID that should trigger FK error
    category: 'test',
    item: 'Migration Test',
    min_cost: 123.45,
    avg_cost: 234.56,
    max_cost: 345.67,
    annual_cost: 234.56,
    lifetime_cost: 7036.80,
    start_age: 0,
    end_age: 1
  };
  
  console.log('Test data:', testData);
  console.log('Attempting to insert test data...');
  
  try {
    const { data, error } = await supabase
      .from('care_plan_entries')
      .insert(testData)
      .select();
    
    if (error) {
      console.log('Insert error:', error);
      
      // Check if the error is due to foreign key constraint (expected)
      // rather than data type mismatch (which would indicate the migration failed)
      if (error.message && error.message.includes('foreign key constraint')) {
        console.log('✅ Column types appear to be correct (numeric/decimal)');
        console.log('The error is due to foreign key constraint, not data type mismatch');
        return true;
      } else if (error.message && (
                error.message.includes('invalid input syntax') || 
                error.message.includes('type integer'))) {
        console.log('❌ Column types are still INTEGER, not NUMERIC');
        console.log('Migration may have failed or not been applied');
        return false;
      } else {
        console.log('⚠️ Unexpected error, unable to determine column types');
        console.log('Full error:', error);
        return false;
      }
    } else {
      console.log('✅ Test insert succeeded with decimal values');
      console.log('This is unexpected since we used a fake plan ID.');
      
      // Clean up test record
      if (data && data.length > 0) {
        const testId = data[0].id;
        await supabase
          .from('care_plan_entries')
          .delete()
          .eq('id', testId);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Unexpected error during test:', error);
    return false;
  }
}

// Run the test
testDecimalMigration()
  .then(success => {
    if (success) {
      console.log('\n✅ MIGRATION SUCCESSFUL: Cost columns now accept decimal values');
    } else {
      console.log('\n❌ MIGRATION FAILED: Cost columns still expect integer values');
    }
  })
  .catch(error => {
    console.error('Error running test:', error);
  });
