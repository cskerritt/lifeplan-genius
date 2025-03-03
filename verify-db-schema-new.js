// Script to verify that the migration was successful
import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const SUPABASE_URL = 'https://ooewnlqozkypyceowuhy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDYzNzksImV4cCI6MjA1MjM4MjM3OX0.SE6Wly7zpqKTMDM_uMuEYyeELelx1QVzpzADx6eGr30';

// Create a Supabase client with the anon key
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyColumnTypes() {
  console.log('Verifying database column types...');
  
  try {
    // Try a direct test with a fake plan ID
    // If the columns are numeric, we should get a foreign key error
    // If the columns are still integer, we should get a type error
    console.log('Testing with a sample insert...');
    
    const testValue = 123.45;
    console.log(`Testing insertion with decimal value: ${testValue}`);
    
    const { data: insertData, error: insertError } = await supabase
      .from('care_plan_entries')
      .insert({
        plan_id: '00000000-0000-0000-0000-000000000000', // Fake UUID that should trigger FK error
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
      console.log('Insert test result:', insertError);
      
      // Check if the error is due to foreign key constraint (expected)
      // rather than data type mismatch (which would indicate the migration failed)
      if (insertError.message && insertError.message.includes('foreign key constraint')) {
        console.log('✅ Column types appear to be correct (numeric/decimal)');
        console.log('The error is due to foreign key constraint, not data type mismatch');
      } else if (insertError.message && (
                insertError.message.includes('invalid input syntax') || 
                insertError.message.includes('type integer'))) {
        console.log('❌ Column types are still INTEGER, not NUMERIC');
        console.log('Migration may have failed or not been applied');
      } else {
        console.log('⚠️ Unexpected error, unable to determine column types');
        console.log('Full error:', insertError);
      }
    } else {
      console.log('✅ Test insert succeeded with decimal values');
      console.log('This is unexpected since we used a fake plan ID.');
      
      // Clean up test record
      const testId = insertData[0].id;
      await supabase
        .from('care_plan_entries')
        .delete()
        .eq('id', testId);
    }
    
    // Alternative approach: Try to get the table schema
    console.log('\nAttempting to get table schema information...');
    
    // This will only work if the user has the right permissions
    const { data: schemaData, error: schemaError } = await supabase
      .from('care_plan_entries')
      .select('annual_cost')
      .limit(1);
    
    if (schemaError) {
      console.error('Error getting schema information:', schemaError);
    } else {
      console.log('Successfully retrieved schema information');
      console.log('Sample data:', schemaData);
      
      if (schemaData && schemaData.length > 0) {
        const sampleValue = schemaData[0].annual_cost;
        console.log('Sample annual_cost value:', sampleValue);
        console.log('Value type:', typeof sampleValue);
        
        // If the value is a number with decimal places, it's likely numeric
        if (typeof sampleValue === 'number' && sampleValue % 1 !== 0) {
          console.log('✅ The annual_cost column appears to be NUMERIC (contains decimal values)');
        } else if (typeof sampleValue === 'number' && sampleValue % 1 === 0) {
          console.log('⚠️ The annual_cost column appears to be INTEGER (no decimal values)');
          console.log('However, this could also be a NUMERIC value that happens to be a whole number');
        } else {
          console.log('⚠️ Unable to determine column type from sample value');
        }
      } else {
        console.log('No data found in care_plan_entries table');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the verification
verifyColumnTypes(); 