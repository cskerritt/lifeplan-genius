// Script to apply the migration directly to the database
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase connection details - use the same as in verify-db-schema.mjs
const SUPABASE_URL = 'https://ooewnlqozkypyceowuhy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDYzNzksImV4cCI6MjA1MjM4MjM3OX0.SE6Wly7zpqKTMDM_uMuEYyeELelx1QVzpzADx6eGr30';

// Create a Supabase client with the anon key
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function applyMigration() {
  console.log('Applying migration to update cost columns to numeric type...');
  
  try {
    // SQL to update column types
    const sql = `
      -- Update cost columns from integer to numeric to support decimal values
      ALTER TABLE care_plan_entries
      ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
      ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
      ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
      ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
      ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;
    `;
    
    console.log('Executing SQL:');
    console.log(sql);
    
    // Execute the SQL directly using Supabase's rpc function
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      
      // If the rpc function doesn't exist, we need to create it first
      if (error.message && error.message.includes('function "exec_sql" does not exist')) {
        console.log('The exec_sql function does not exist. You need to create it first.');
        console.log('Please run this SQL in the Supabase SQL Editor:');
        console.log(`
          CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `);
      }
    } else {
      console.log('Migration applied successfully!');
      
      // Verify the column types
      console.log('Verifying column types...');
      
      // Try to insert a test record with decimal values
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
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the migration
applyMigration(); 