// Direct test script for inserting decimal values
import { createClient } from '@supabase/supabase-js';

// Supabase connection details with the correct anon key
const SUPABASE_URL = 'https://ooewnlqozkypyceowuhy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDYzNzksImV4cCI6MjA1MjM4MjM3OX0.SE6Wly7zpqKTMDM_uMuEYyeELelx1QVzpzADx6eGr30';

// Create a Supabase client with the anon key
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function runDirectTest() {
  console.log('Running direct test for decimal value insertion...');
  
  try {
    // First, try to get a valid plan ID
    console.log('Fetching a valid plan ID...');
    const { data: planData, error: planError } = await supabase
      .from('life_care_plans')
      .select('id')
      .limit(1);
    
    if (planError) {
      console.error('Error fetching plan ID:', planError);
      
      // Try with a fake plan ID anyway to check column types
      console.log('\nTrying with a fake plan ID to check column types...');
      await testWithFakePlanId();
      return;
    }
    
    if (!planData || planData.length === 0) {
      console.log('No plans found in the database');
      
      // Try with a fake plan ID anyway to check column types
      console.log('\nTrying with a fake plan ID to check column types...');
      await testWithFakePlanId();
      return;
    }
    
    const planId = planData[0].id;
    console.log(`Using valid plan ID: ${planId}`);
    
    // Test with a valid plan ID
    await testWithValidPlanId(planId);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function testWithValidPlanId(planId) {
  const testValue = 123.45;
  console.log(`Testing insertion with decimal value: ${testValue}`);
  
  try {
    const { data, error } = await supabase
      .from('care_plan_entries')
      .insert({
        plan_id: planId,
        category: 'test',
        item: 'Decimal Test',
        annual_cost: testValue,
        lifetime_cost: testValue,
        min_cost: testValue,
        avg_cost: testValue,
        max_cost: testValue,
        start_age: 0,
        end_age: 1
      })
      .select();
    
    if (error) {
      console.error('Error inserting with valid plan ID:', error);
      
      if (error.message && error.message.includes('invalid input syntax for type integer')) {
        console.log('❌ The migration was NOT successful. The columns are still INTEGER type.');
      } else {
        console.log('⚠️ Error occurred, but not related to column types.');
        console.log('This could be due to permissions or other issues.');
      }
    } else {
      console.log('✅ Successfully inserted decimal value!');
      console.log('The migration was successful. The columns are now NUMERIC type.');
      
      // Clean up the test record
      if (data && data.length > 0) {
        const testId = data[0].id;
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
    }
  } catch (error) {
    console.error('Unexpected error during valid plan ID test:', error);
  }
}

async function testWithFakePlanId() {
  const testValue = 123.45;
  console.log(`Testing insertion with decimal value: ${testValue}`);
  
  try {
    const { error } = await supabase
      .from('care_plan_entries')
      .insert({
        plan_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
        category: 'test',
        item: 'Decimal Test',
        annual_cost: testValue,
        lifetime_cost: testValue,
        min_cost: testValue,
        avg_cost: testValue,
        max_cost: testValue,
        start_age: 0,
        end_age: 1
      });
    
    if (error) {
      console.log('Error with fake plan ID:', error);
      
      if (error.message && error.message.includes('foreign key constraint')) {
        console.log('✅ Column types appear to be correct (numeric/decimal)');
        console.log('The error is due to foreign key constraint, not data type mismatch');
      } else if (error.message && (
                error.message.includes('invalid input syntax') || 
                error.message.includes('type integer'))) {
        console.log('❌ Column types are still INTEGER, not NUMERIC');
        console.log('Migration may have failed or not been applied');
      } else {
        console.log('⚠️ Unexpected error, unable to determine column types');
      }
    } else {
      console.log('✅ Test insert succeeded with decimal values');
      console.log('This is unexpected since we used a fake plan ID.');
    }
  } catch (error) {
    console.error('Unexpected error during fake plan ID test:', error);
  }
}

// Run the test
runDirectTest(); 