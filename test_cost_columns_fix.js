// This script tests the cost columns fix by attempting to insert a care plan entry with decimal costs
const { supabase } = require('./src/integrations/supabase/client');

console.log('Testing cost columns fix...');
console.log('Attempting to insert a care plan entry with decimal costs...');

// Test data with decimal costs
const testData = {
  plan_id: 'test-plan-id',
  category: 'medical',
  item: 'Test Item with Decimal Costs',
  frequency: '1x per year',
  cpt_code: '99214',
  cpt_description: 'Office Visit',
  min_cost: 123.45,
  avg_cost: 234.56,
  max_cost: 345.67,
  annual_cost: 234.56,
  lifetime_cost: 7036.80,
  start_age: 51,
  end_age: 81,
  is_one_time: false
};

async function runTest() {
  try {
    console.log('Test data:', testData);
    
    // Insert the test data
    const { data, error } = await supabase
      .from('care_plan_entries')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('Error inserting test data:', error);
      console.log('TEST FAILED: The migration may not have been applied correctly.');
      return;
    }
    
    console.log('Test data inserted successfully:', data);
    console.log('');
    console.log('TEST PASSED: The cost columns now accept decimal values.');
    console.log('');
    
    // Clean up the test data
    console.log('Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('care_plan_entries')
      .delete()
      .eq('item', 'Test Item with Decimal Costs');
    
    if (deleteError) {
      console.error('Error cleaning up test data:', deleteError);
      return;
    }
    
    console.log('Test data cleaned up successfully.');
    console.log('');
    console.log('VERIFICATION COMPLETE: The cost columns migration has been successfully applied.');
  } catch (error) {
    console.error('Unexpected error during test:', error);
    console.log('TEST FAILED: An unexpected error occurred.');
  }
}

// Run the test
runTest();
