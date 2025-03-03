/**
 * Main migration script
 * 
 * This script applies SQL migrations to the database using either
 * the Supabase client or direct PostgreSQL connection.
 */

import fs from 'fs';
import path from 'path';
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

// Function to read migration files from the migrations/sql directory
function readMigrationFiles() {
  const migrationsDir = path.join(__dirname, '..', 'sql');
  
  try {
    // Check if the directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Error: Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }
    
    // Get all SQL files in the directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations are applied in order
    
    if (files.length === 0) {
      console.error('No SQL migration files found in the migrations/sql directory.');
      console.error('Please add your migration files to this directory.');
      process.exit(1);
    }
    
    // Read the content of each file
    const migrations = files.map(file => {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      return { name: file, content };
    });
    
    return migrations;
  } catch (error) {
    console.error('Error reading migration files:', error);
    process.exit(1);
  }
}

// Function to apply migrations using Supabase client
async function applyMigrationsWithSupabase(migrations) {
  console.log('Applying migrations using Supabase client...');
  
  const supabase = createSupabaseClient();
  
  for (const migration of migrations) {
    console.log(`\nApplying migration: ${migration.name}`);
    
    const { error } = await executeSupabaseSql(supabase, migration.content);
    
    if (error) {
      console.error(`Error applying migration ${migration.name}:`, error);
      
      // Record failed migration if the tracking table exists
      try {
        await executeSupabaseSql(
          supabase, 
          `SELECT record_migration('${migration.name}', 'supabase_client', FALSE);`
        );
      } catch (recordError) {
        // Ignore errors if the record_migration function doesn't exist yet
      }
      
      return false;
    }
    
    console.log(`Successfully applied migration: ${migration.name}`);
    
    // Record successful migration if the tracking table exists
    try {
      await executeSupabaseSql(
        supabase, 
        `SELECT record_migration('${migration.name}', 'supabase_client', TRUE);`
      );
    } catch (recordError) {
      // Ignore errors if the record_migration function doesn't exist yet
    }
  }
  
  return true;
}

// Function to apply migrations using PostgreSQL client
async function applyMigrationsWithPg(migrations) {
  console.log('Applying migrations using direct PostgreSQL connection...');
  
  const pgClient = createPgClient();
  
  try {
    // Connect to the database
    await pgClient.connect();
    
    // Start a transaction
    await pgClient.query('BEGIN');
    
    for (const migration of migrations) {
      console.log(`\nApplying migration: ${migration.name}`);
      
      const { error } = await executePgSql(pgClient, migration.content);
      
      if (error) {
        console.error(`Error applying migration ${migration.name}:`, error);
        await pgClient.query('ROLLBACK');
        
        // Record failed migration if the tracking table exists
        try {
          await executePgSql(
            pgClient, 
            `SELECT record_migration('${migration.name}', 'pg_client', FALSE);`
          );
        } catch (recordError) {
          // Ignore errors if the record_migration function doesn't exist yet
        }
        
        return false;
      }
      
      console.log(`Successfully applied migration: ${migration.name}`);
      
      // Record successful migration if the tracking table exists
      try {
        await executePgSql(
          pgClient, 
          `SELECT record_migration('${migration.name}', 'pg_client', TRUE);`
        );
      } catch (recordError) {
        // Ignore errors if the record_migration function doesn't exist yet
      }
    }
    
    // Commit the transaction
    await pgClient.query('COMMIT');
    
    return true;
  } catch (error) {
    console.error('Error applying migrations:', error);
    
    // Rollback the transaction if there's an error
    try {
      await pgClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    
    return false;
  } finally {
    // Close the client
    await pgClient.end();
  }
}

// Main function
async function main() {
  console.log('Starting migration process...');
  
  // Read migration files
  const migrations = readMigrationFiles();
  console.log(`Found ${migrations.length} migration files.`);
  
  // Apply migrations using the selected method
  let success;
  
  if (useDirectPg) {
    success = await applyMigrationsWithPg(migrations);
  } else {
    success = await applyMigrationsWithSupabase(migrations);
  }
  
  if (success) {
    console.log('\nAll migrations applied successfully!');
    console.log('Run "npm run migrate:verify" to verify the migrations.');
  } else {
    console.error('\nFailed to apply all migrations.');
    process.exit(1);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
