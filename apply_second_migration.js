/**
 * Script to apply only the second migration (update cost columns to numeric)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createPgClient, executePgSql } from './migrations/scripts/db-client.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the second migration file
const migrationFilePath = path.join(__dirname, 'migrations', 'sql', '20250227173300_update_cost_columns_to_numeric.sql');

async function applySecondMigration() {
  console.log('Starting to apply the second migration (update cost columns to numeric)...');
  
  // Read the migration file
  try {
    if (!fs.existsSync(migrationFilePath)) {
      console.error(`Error: Migration file not found: ${migrationFilePath}`);
      process.exit(1);
    }
    
    const migrationContent = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Create PostgreSQL client
    const pgClient = createPgClient();
    
    try {
      // Connect to the database
      await pgClient.connect();
      
      // Start a transaction
      await pgClient.query('BEGIN');
      
      console.log('Applying migration: 20250227173300_update_cost_columns_to_numeric.sql');
      
      const { error } = await executePgSql(pgClient, migrationContent);
      
      if (error) {
        console.error('Error applying migration:', error);
        await pgClient.query('ROLLBACK');
        process.exit(1);
      }
      
      // Commit the transaction
      await pgClient.query('COMMIT');
      
      console.log('Successfully applied the migration!');
      
    } catch (error) {
      console.error('Error applying migration:', error);
      
      // Rollback the transaction if there's an error
      try {
        await pgClient.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      
      process.exit(1);
    } finally {
      // Close the client
      await pgClient.end();
    }
    
  } catch (error) {
    console.error('Error reading migration file:', error);
    process.exit(1);
  }
}

// Execute the function
applySecondMigration().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
