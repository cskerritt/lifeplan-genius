// Simple script to test inserting a record with decimal values
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get the Supabase URL and anon key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_ANON_KEY environment variable is not set.');
  console.error('Please check your .env file and ensure both variables are set correctly.');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Function to test inserting a record
async function testInsert() {
  console.log('Testing insertion of a record with decimal values...');
  console.log('Test data:', testData);
  
  try {
    // Insert the test data
    const { data, error } = await supabase
      .from('care_plan_entries')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('Error inserting test data:', error);
      console.error('Error details:', JSON.stringify(error));
      
      // If the error is related to column types, print a warning
      if (error.code === '22P02' && error.message.includes('invalid input syntax for type integer')) {
        console.error('\nError indicates column type mismatch. The migration has not been applied.');
        console.error('Please run the migration to update the column types to numeric.');
      }
    } else {
      console.log('Test data inserted successfully!');
      console.log('Inserted data:', data);
      console.log('\nThe migration has been applied successfully!');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the test
testInsert();
