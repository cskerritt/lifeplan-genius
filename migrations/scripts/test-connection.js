/**
 * Test script to verify database connection
 * 
 * This script tests the connection to the database using both
 * the Supabase client and direct PostgreSQL connection.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  createSupabaseClient,
  createPgClient
} from './db-client.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const testPg = args.includes('--pg');
const testSupabase = args.includes('--supabase') || !testPg;

// Function to test Supabase connection
async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const supabase = createSupabaseClient();
    
    // Test the connection by querying the care_plan_entries table
    console.log('Querying care_plan_entries table...');
    const { data, error } = await supabase
      .from('care_plan_entries')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log(`Found ${data.length} entries in care_plan_entries table.`);
    
    return true;
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
    return false;
  }
}

// Function to test PostgreSQL connection
async function testPgConnection() {
  console.log('Testing direct PostgreSQL connection...');
  
  const pgClient = createPgClient();
  
  try {
    // Connect to the database
    await pgClient.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    // Test the connection by querying the care_plan_entries table
    console.log('Querying care_plan_entries table...');
    const result = await pgClient.query('SELECT COUNT(*) FROM care_plan_entries');
    
    console.log(`Found ${result.rows[0].count} entries in care_plan_entries table.`);
    
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    return false;
  } finally {
    // Close the client
    await pgClient.end();
  }
}

// Main function
async function main() {
  console.log('Starting connection tests...');
  
  let supabaseSuccess = false;
  let pgSuccess = false;
  
  // Test Supabase connection if requested
  if (testSupabase) {
    supabaseSuccess = await testSupabaseConnection();
  }
  
  // Test PostgreSQL connection if requested
  if (testPg) {
    pgSuccess = await testPgConnection();
  }
  
  // Print summary
  console.log('\nConnection test summary:');
  
  if (testSupabase) {
    console.log(`- Supabase connection: ${supabaseSuccess ? '✅ Successful' : '❌ Failed'}`);
  }
  
  if (testPg) {
    console.log(`- PostgreSQL connection: ${pgSuccess ? '✅ Successful' : '❌ Failed'}`);
  }
  
  // Exit with appropriate code
  if ((testSupabase && !supabaseSuccess) || (testPg && !pgSuccess)) {
    console.error('\nSome connection tests failed. Please check your credentials and try again.');
    process.exit(1);
  }
  
  console.log('\nAll connection tests passed! Your database connections are working correctly.');
}

// Execute the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
