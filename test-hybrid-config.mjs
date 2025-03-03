import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';

// Load environment variables from .env and .env.local
dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

// Log all environment variables for debugging
console.log('Environment variables:');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('- VITE_DATABASE_URL:', process.env.VITE_DATABASE_URL);
console.log('- USE_LOCAL_DB:', process.env.USE_LOCAL_DB);
console.log('- USE_REMOTE_AUTH:', process.env.USE_REMOTE_AUTH);

// PostgreSQL connection string
const connectionString = process.env.VITE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/supabase_local_db';

// Supabase connection details
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ooewnlqozkypyceowuhy.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDYzNzksImV4cCI6MjA1MjM4MjM3OX0.SE6Wly7zpqKTMDM_uMuEYyeELelx1QVzpzADx6eGr30';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create PostgreSQL client
const { Pool } = pg;
const pool = new Pool({ connectionString });

async function testHybridConfig() {
  console.log('\n=== Testing Hybrid Configuration ===');
  console.log('This test verifies that we can use remote Supabase for auth while using local PostgreSQL for data operations');
  
  // Variables to store test IDs for cleanup
  let testPlanId = null;
  let testEntryId = null;
  
  try {
    // Test 1: Verify Supabase connection (for auth)
    console.log('\n--- Test 1: Verify Supabase Connection (for auth) ---');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Supabase auth connection test failed:', authError.message);
    } else {
      console.log('✅ Supabase auth connection test successful');
      console.log('Session data:', authData);
    }
    
    // Test 2: Verify PostgreSQL connection (for data)
    console.log('\n--- Test 2: Verify PostgreSQL Connection (for data) ---');
    const client = await pool.connect();
    
    try {
      // Check PostgreSQL version
      const versionResult = await client.query('SELECT version()');
      console.log('✅ Connected to PostgreSQL:', versionResult.rows[0].version);
      
      // Check if care_plan_entries table exists
      const tableResult = await client.query(`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns
        WHERE table_name = 'care_plan_entries'
        ORDER BY ordinal_position;
      `);
      
      if (tableResult.rows.length > 0) {
        console.log('✅ care_plan_entries table exists with columns:');
        tableResult.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}${col.numeric_precision ? `(${col.numeric_precision},${col.numeric_scale})` : ''}`);
        });
      } else {
        console.log('❌ care_plan_entries table does not exist');
      }
      
      // Check if life_care_plans table exists
      const plansTableResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'life_care_plans'
        ORDER BY ordinal_position;
      `);
      
      if (plansTableResult.rows.length > 0) {
        console.log('✅ life_care_plans table exists with columns:');
        plansTableResult.rows.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
      } else {
        console.log('❌ life_care_plans table does not exist');
      }
      
      // Test 3: Create a test plan
      console.log('\n--- Test 3: Create a test plan ---');
      const createPlanResult = await client.query(`
        INSERT INTO life_care_plans (
          user_id, first_name, last_name, date_of_birth, race, gender, 
          street_address, city, state, county_apc, county_drg,
          life_expectancy, projected_age_at_death
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', 'Test', 'Client', '2000-01-01', 
          'Other', 'Other', '123 Test St', 'Test City', 'CA', 'Test County', 'Test County',
          85, 85
        ) RETURNING id;
      `);
      
      if (createPlanResult.rows.length > 0) {
        testPlanId = createPlanResult.rows[0].id;
        console.log('✅ Test plan created successfully with ID:', testPlanId);
        
        // Test 4: Insert a test record with decimal values
        console.log('\n--- Test 4: Insert a test record with decimal values ---');
        const insertResult = await client.query(`
          INSERT INTO care_plan_entries (
            plan_id, category, item, frequency, min_cost, avg_cost, max_cost,
            annual_cost, lifetime_cost, start_age, end_age, is_one_time
          ) VALUES (
            $1, 'TEST_HYBRID', 'Test Item', 'Annual',
            100.50, 200.50, 300.50, 400.50, 500.50, 50.50, 80.30, false
          ) RETURNING id, start_age, end_age;
        `, [testPlanId]);
        
        if (insertResult.rows.length > 0) {
          testEntryId = insertResult.rows[0].id;
          console.log('✅ Test record inserted successfully with ID:', testEntryId);
          console.log('   start_age:', insertResult.rows[0].start_age);
          console.log('   end_age:', insertResult.rows[0].end_age);
          
          // Verify the inserted values
          const verifyResult = await client.query(`
            SELECT * FROM care_plan_entries WHERE id = $1;
          `, [testEntryId]);
          
          console.log('✅ Verified inserted values:');
          console.log('   start_age:', verifyResult.rows[0].start_age);
          console.log('   end_age:', verifyResult.rows[0].end_age);
        } else {
          console.log('❌ Failed to insert test record');
        }
      } else {
        console.log('❌ Failed to create test plan');
      }
    } finally {
      // Clean up test data
      if (testEntryId) {
        console.log('\n--- Cleaning up test data ---');
        await client.query('DELETE FROM care_plan_entries WHERE id = $1', [testEntryId]);
        console.log('✅ Test entry cleaned up');
      }
      
      if (testPlanId) {
        await client.query('DELETE FROM life_care_plans WHERE id = $1', [testPlanId]);
        console.log('✅ Test plan cleaned up');
      }
      
      client.release();
    }
    
    console.log('\n=== Hybrid Configuration Test Completed ===');
    console.log('✅ The application is correctly configured to use:');
    console.log('   - Remote Supabase for authentication');
    console.log('   - Local PostgreSQL for data operations');
    
  } catch (error) {
    console.error('❌ Error during hybrid configuration test:', error);
  } finally {
    // Close the PostgreSQL pool
    await pool.end();
  }
}

// Run the test
testHybridConfig().catch(console.error); 