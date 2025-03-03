// Script to verify that the migration was successful
import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const SUPABASE_URL = 'https://ooewnlqozkypyceowuhy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgwNjM3OSwiZXhwIjoyMDUyMzgyMzc5fQ.aHAyAGaKzs4RP6-hbbwKWsCqJ2xcwDOex1gnTFH_0fI';

// Create a Supabase client with the service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyMigration() {
  console.log('Verifying that the migration was successful...');
  
  try {
    // First, get an existing plan ID
    const { data: planData, error: planError } = await supabase
      .from('life_care_plans')
      .select('id')
      .limit(1);
    
    if (planError) {
      console.error('Error getting plan ID:', planError);
      return;
    }
    
    if (!planData || planData.length === 0) {
      console.error('No plans found in the database');
      return;
    }
    
    const planId = planData[0].id;
    console.log(`Using existing plan ID: ${planId}`);
    
    // Test by inserting a record with decimal values
    const testValue = 80.3;
    console.log(`Testing insertion with decimal value: ${testValue}`);
    
    const { data: insertData, error: insertError } = await supabase
      .from('care_plan_entries')
      .insert({
        plan_id: planId,
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
      console.log('The migration may not have been successful.');
      
      if (insertError.code === '22P02' && insertError.message.includes('invalid input syntax for type integer')) {
        console.log('The columns are still integer type. The migration was not successful.');
      }
    } else {
      console.log('Successfully inserted test record with decimal value:', insertData);
      console.log('The migration was successful! The columns are now numeric type.');
      
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
    console.error('Exception during verification:', error);
  }
}

// Run the verification
verifyMigration(); 