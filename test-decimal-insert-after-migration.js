// Test script to verify that decimal values can be inserted after the migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Error: The following required environment variables are missing:');
  missingEnvVars.forEach(varName => console.error(`- ${varName}`));
  console.error('\nPlease create or update your .env file with these variables.');
  process.exit(1);
}

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data with decimal values
const testData = {
  plan_id: '1575cabb-cee8-4051-b391-0c20af6444cd', // Use an existing plan ID
  category: 'test',
  item: 'Decimal Test Item After Migration',
  frequency: '4x per year',
  cpt_code: '99214',
  cpt_description: 'Office Visit',
  // Use decimal values for all cost fields
  min_cost: 75.25,
  avg_cost: 80.50,
  max_cost: 85.75,
  annual_cost: 322.00,
  lifetime_cost: 9338.00,
  start_age: 51,
  end_age: 80,
  is_one_time: false
};

// Log the test data
console.log('Test data:', testData);
console.log('Cost values:', {
  min_cost: testData.min_cost,
  avg_cost: testData.avg_cost,
  max_cost: testData.max_cost,
  annual_cost: testData.annual_cost,
  lifetime_cost: testData.lifetime_cost
});

// Insert the test data
async function insertTestData() {
  try {
    const { data, error } = await supabase
      .from('care_plan_entries')
      .insert(testData)
      .select();

    if (error) {
      console.error('Error inserting test data:', error);
      return;
    }

    console.log('Successfully inserted test data with decimal values!');
    console.log('Inserted record:', data);

    // Verify the inserted data
    const { data: verifyData, error: verifyError } = await supabase
      .from('care_plan_entries')
      .select('min_cost, avg_cost, max_cost, annual_cost, lifetime_cost')
      .eq('item', 'Decimal Test Item After Migration')
      .limit(1);

    if (verifyError) {
      console.error('Error verifying inserted data:', verifyError);
      return;
    }

    console.log('Verification of inserted data:');
    console.log(verifyData);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
insertTestData();
