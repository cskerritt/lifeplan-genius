/**
 * Migration verification script
 * 
 * This script verifies that migrations were applied successfully by checking
 * the schema of the care_plan_entries table.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  createSupabaseClient,
  createPgClient,
  getColumnTypes,
  getPgColumnTypes
} from './db-client.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const useDirectPg = args.includes('--pg');

// Function to verify migrations using Supabase client
async function verifyWithSupabase() {
  console.log('Verifying migrations using Supabase client...');
  
  const supabase = createSupabaseClient();
  
  try {
    // First, check if we can connect to the database
    console.log('Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('care_plan_entries')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Error connecting to database:', testError);
      return false;
    }
    
    console.log('Successfully connected to database');
    
    // Check column types
    console.log('\nChecking column types...');
    const columnNames = [
      'min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost',
      'use_age_increments', 'age_increments'
    ];
    
    const { data: columnData, error: columnError } = await getColumnTypes(
      supabase,
      'care_plan_entries',
      columnNames
    );
    
    if (columnError) {
      console.error('Error getting column types:', columnError);
      return false;
    }
    
    if (!columnData || columnData.length === 0) {
      console.error('No column data returned');
      return false;
    }
    
    // Verify column types
    return verifyColumnTypes(columnData);
  } catch (error) {
    console.error('Error verifying migrations:', error);
    return false;
  }
}

// Function to verify migrations using PostgreSQL client
async function verifyWithPg() {
  console.log('Verifying migrations using direct PostgreSQL connection...');
  
  const pgClient = createPgClient();
  
  try {
    // Connect to the database
    await pgClient.connect();
    console.log('Successfully connected to database');
    
    // Check column types
    console.log('\nChecking column types...');
    const columnNames = [
      'min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost',
      'use_age_increments', 'age_increments'
    ];
    
    const { data: columnData, error: columnError } = await getPgColumnTypes(
      pgClient,
      'care_plan_entries',
      columnNames
    );
    
    if (columnError) {
      console.error('Error getting column types:', columnError);
      return false;
    }
    
    if (!columnData || columnData.length === 0) {
      console.error('No column data returned');
      return false;
    }
    
    // Verify column types
    return verifyColumnTypes(columnData);
  } catch (error) {
    console.error('Error verifying migrations:', error);
    return false;
  } finally {
    // Close the client
    await pgClient.end();
  }
}

// Function to verify column types
function verifyColumnTypes(columnData) {
  const costColumns = ['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'];
  const columnMap = {};
  
  // Create a map of column names to data types
  columnData.forEach(column => {
    columnMap[column.column_name] = column.data_type.toLowerCase();
  });
  
  // Check if all required columns exist
  const missingColumns = [];
  const requiredColumns = [...costColumns, 'use_age_increments', 'age_increments'];
  
  requiredColumns.forEach(column => {
    if (!columnMap[column]) {
      missingColumns.push(column);
    }
  });
  
  if (missingColumns.length > 0) {
    console.error('Missing columns:', missingColumns.join(', '));
    return false;
  }
  
  // Check if cost columns are numeric
  console.log('\nVerifying cost columns:');
  let allCostColumnsNumeric = true;
  
  costColumns.forEach(column => {
    const isNumeric = columnMap[column] === 'numeric';
    console.log(`- ${column}: ${columnMap[column]} (${isNumeric ? '✅' : '❌'})`);
    
    if (!isNumeric) {
      allCostColumnsNumeric = false;
    }
  });
  
  // Check if use_age_increments is boolean
  const isUseAgeIncrementsBoolean = columnMap['use_age_increments'] === 'boolean';
  console.log(`- use_age_increments: ${columnMap['use_age_increments']} (${isUseAgeIncrementsBoolean ? '✅' : '❌'})`);
  
  // Check if age_increments is text
  const isAgeIncrementsText = columnMap['age_increments'] === 'text';
  console.log(`- age_increments: ${columnMap['age_increments']} (${isAgeIncrementsText ? '✅' : '❌'})`);
  
  // Print summary
  console.log('\nMigration verification summary:');
  console.log(`- Cost columns migration: ${allCostColumnsNumeric ? '✅ Successful' : '❌ Failed'}`);
  console.log(`- Age increments migration: ${isUseAgeIncrementsBoolean && isAgeIncrementsText ? '✅ Successful' : '❌ Failed'}`);
  
  // Return overall status
  return allCostColumnsNumeric && isUseAgeIncrementsBoolean && isAgeIncrementsText;
}

// Main function
async function main() {
  console.log('Starting migration verification...');
  
  // Verify migrations using the selected method
  let success;
  
  if (useDirectPg) {
    success = await verifyWithPg();
  } else {
    success = await verifyWithSupabase();
  }
  
  if (success) {
    console.log('\n✅ All migrations were successfully applied!');
  } else {
    console.error('\n❌ Some migrations were not successfully applied.');
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
