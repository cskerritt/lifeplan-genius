/**
 * Check Migration History
 * 
 * This script checks the migration history in the applied_migrations table.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  createSupabaseClient,
  createPgClient,
  executeSupabaseSql,
  executePgSql
} from './db-client.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const useDirectPg = args.includes('--pg');

// Function to check migration history using Supabase client
async function checkMigrationHistoryWithSupabase() {
  console.log('Checking migration history using Supabase client...');
  
  const supabase = createSupabaseClient();
  
  // Check if the applied_migrations table exists
  const { data: tableExists, error: tableError } = await executeSupabaseSql(
    supabase,
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'applied_migrations'
    ) as exists;`
  );
  
  if (tableError) {
    console.error('Error checking if applied_migrations table exists:', tableError);
    return false;
  }
  
  if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
    console.log('The applied_migrations table does not exist yet.');
    console.log('Run migrations to create it.');
    return true;
  }
  
  // Get the migration history
  const { data: migrations, error: migrationsError } = await executeSupabaseSql(
    supabase,
    `SELECT 
      migration_name, 
      applied_at, 
      applied_by, 
      success 
    FROM 
      applied_migrations 
    ORDER BY 
      applied_at DESC;`
  );
  
  if (migrationsError) {
    console.error('Error getting migration history:', migrationsError);
    return false;
  }
  
  // Display the migration history
  console.log('\nMigration History:');
  console.log('=================');
  
  if (migrations.length === 0) {
    console.log('No migrations have been recorded yet.');
  } else {
    console.log('| Migration Name | Applied At | Applied By | Success |');
    console.log('|----------------|------------|------------|---------|');
    
    migrations.forEach(migration => {
      const appliedAt = new Date(migration.applied_at).toLocaleString();
      const success = migration.success ? 'Yes' : 'No';
      
      console.log(`| ${migration.migration_name} | ${appliedAt} | ${migration.applied_by} | ${success} |`);
    });
  }
  
  return true;
}

// Function to check migration history using PostgreSQL client
async function checkMigrationHistoryWithPg() {
  console.log('Checking migration history using direct PostgreSQL connection...');
  
  const pgClient = createPgClient();
  
  try {
    // Connect to the database
    await pgClient.connect();
    
    // Check if the applied_migrations table exists
    const { data: tableExists, error: tableError } = await executePgSql(
      pgClient,
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'applied_migrations'
      ) as exists;`
    );
    
    if (tableError) {
      console.error('Error checking if applied_migrations table exists:', tableError);
      return false;
    }
    
    if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
      console.log('The applied_migrations table does not exist yet.');
      console.log('Run migrations to create it.');
      return true;
    }
    
    // Get the migration history
    const { data: migrations, error: migrationsError } = await executePgSql(
      pgClient,
      `SELECT 
        migration_name, 
        applied_at, 
        applied_by, 
        success 
      FROM 
        applied_migrations 
      ORDER BY 
        applied_at DESC;`
    );
    
    if (migrationsError) {
      console.error('Error getting migration history:', migrationsError);
      return false;
    }
    
    // Display the migration history
    console.log('\nMigration History:');
    console.log('=================');
    
    if (migrations.length === 0) {
      console.log('No migrations have been recorded yet.');
    } else {
      console.log('| Migration Name | Applied At | Applied By | Success |');
      console.log('|----------------|------------|------------|---------|');
      
      migrations.forEach(migration => {
        const appliedAt = new Date(migration.applied_at).toLocaleString();
        const success = migration.success ? 'Yes' : 'No';
        
        console.log(`| ${migration.migration_name} | ${appliedAt} | ${migration.applied_by} | ${success} |`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error checking migration history:', error);
    return false;
  } finally {
    // Close the client
    await pgClient.end();
  }
}

// Main function
async function main() {
  console.log('Starting migration history check...');
  
  // Check migration history using the selected method
  let success;
  
  if (useDirectPg) {
    success = await checkMigrationHistoryWithPg();
  } else {
    success = await checkMigrationHistoryWithSupabase();
  }
  
  if (success) {
    console.log('\nMigration history check completed successfully!');
  } else {
    console.error('\nFailed to check migration history.');
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 