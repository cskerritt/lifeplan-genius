/**
 * Setup Migration Functions
 * 
 * This script applies the SQL migration that creates the necessary RPC functions
 * for the migration system to work with the Supabase client.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please add it to your .env file.');
  process.exit(1);
}

// Create PostgreSQL client
function createPgClient() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

// Execute SQL
async function executeSql(pgClient, sql) {
  try {
    const result = await pgClient.query(sql);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Main function
async function main() {
  console.log('Setting up migration functions in Supabase...');
  
  // Path to the migration file
  const migrationFilePath = path.join(__dirname, 'migrations', 'sql', '20250228000000_create_migration_functions.sql');
  
  // Check if the file exists
  if (!fs.existsSync(migrationFilePath)) {
    console.error(`Error: Migration file not found: ${migrationFilePath}`);
    process.exit(1);
  }
  
  // Read the migration file
  const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
  
  // Create PostgreSQL client
  const pgClient = createPgClient();
  
  try {
    // Connect to the database
    await pgClient.connect();
    
    console.log('Connected to the database.');
    console.log('Applying migration functions...');
    
    // Execute the SQL
    const { error } = await executeSql(pgClient, migrationSql);
    
    if (error) {
      console.error('Error applying migration functions:', error);
      process.exit(1);
    }
    
    console.log('Migration functions successfully applied!');
    console.log('You can now use the Supabase client method for migrations.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  } finally {
    // Close the client
    await pgClient.end();
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 