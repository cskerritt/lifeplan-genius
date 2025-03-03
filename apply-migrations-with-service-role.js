// Script to apply migrations using Supabase client with service role key
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  console.error('Please check your .env file and ensure both variables are set correctly.');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to read a migration file
function readMigrationFile(filename) {
  const filePath = path.join('supabase', 'migrations', filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading migration file ${filename}:`, error);
    process.exit(1);
  }
}

// Function to execute a SQL query using the Supabase client
async function executeSql(sql, description) {
  console.log(`Executing ${description}...`);
  
  try {
    // Use the rpc function to execute SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error executing ${description}:`, error);
      return false;
    }
    
    console.log(`Successfully executed ${description}`);
    return true;
  } catch (error) {
    console.error(`Error executing ${description}:`, error);
    return false;
  }
}

// Function to verify column types after migration
async function verifyColumnTypes() {
  console.log('\nVerifying column types...');
  
  const sql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'care_plan_entries' 
    AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost', 'use_age_increments', 'age_increments')
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error verifying column types:', error);
      return;
    }
    
    console.log('Column types after migration:');
    data.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
      
      // Check if the cost columns are numeric
      if (['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'].includes(row.column_name)) {
        if (row.data_type.toLowerCase() !== 'numeric') {
          console.warn(`Warning: ${row.column_name} is ${row.data_type}, not NUMERIC`);
        }
      }
      
      // Check if use_age_increments is boolean
      if (row.column_name === 'use_age_increments' && row.data_type.toLowerCase() !== 'boolean') {
        console.warn(`Warning: ${row.column_name} is ${row.data_type}, not BOOLEAN`);
      }
      
      // Check if age_increments is text
      if (row.column_name === 'age_increments' && row.data_type.toLowerCase() !== 'text') {
        console.warn(`Warning: ${row.column_name} is ${row.data_type}, not TEXT`);
      }
    });
  } catch (error) {
    console.error('Error verifying column types:', error);
  }
}

// Main function to apply migrations
async function applyMigrations() {
  console.log('Applying migrations using Supabase service role key...');
  
  try {
    // Read migration files
    const ageIncrementsSQL = readMigrationFile('20250227152832_add_age_increments_columns.sql');
    const costColumnsSQL = readMigrationFile('20250227173300_update_cost_columns_to_numeric.sql');
    
    // Execute age increments migration
    const ageIncrementsSuccess = await executeSql(
      ageIncrementsSQL,
      'age increments migration'
    );
    
    if (!ageIncrementsSuccess) {
      console.error('Failed to apply age increments migration. Aborting.');
      return;
    }
    
    // Execute cost columns migration
    const costColumnsSuccess = await executeSql(
      costColumnsSQL,
      'cost columns migration'
    );
    
    if (!costColumnsSuccess) {
      console.error('Failed to apply cost columns migration.');
      return;
    }
    
    // Verify column types after migrations
    await verifyColumnTypes();
    
    console.log('\nAll migrations successfully applied!');
  } catch (error) {
    console.error('Error applying migrations:', error);
  }
}

// Execute the main function
applyMigrations();
