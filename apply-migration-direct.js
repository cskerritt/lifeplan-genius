// Script to apply the second migration directly using PostgreSQL
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please add it to your .env file.');
  process.exit(1);
}

// Create PostgreSQL client
const pgClient = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Path to the second migration file
const migrationFilePath = path.join(__dirname, 'migrations', 'sql', '20250227173300_update_cost_columns_to_numeric.sql');

// Function to apply the migration
async function applyMigration() {
  console.log('Applying migration to update cost columns to numeric...');
  
  try {
    // Read the migration file
    const sql = fs.readFileSync(migrationFilePath, 'utf8');
    console.log('Migration SQL:');
    console.log(sql);
    
    // Modify the SQL to use USING clause for type conversion
    const modifiedSql = sql.replace(
      /ALTER COLUMN (\w+) TYPE NUMERIC/g, 
      'ALTER COLUMN $1 TYPE NUMERIC USING $1::numeric'
    );
    
    console.log('\nModified SQL:');
    console.log(modifiedSql);
    
    // Connect to the database
    await pgClient.connect();
    console.log('Connected to PostgreSQL database');
    
    // Start a transaction
    await pgClient.query('BEGIN');
    
    // Execute the migration
    console.log('Executing migration...');
    await pgClient.query(modifiedSql);
    
    // Commit the transaction
    await pgClient.query('COMMIT');
    
    console.log('Migration applied successfully!');
    
    // Verify the column types
    console.log('\nVerifying column types...');
    const result = await pgClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'care_plan_entries' 
      AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
    `);
    
    console.log('Column types:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if all columns are numeric
    const allNumeric = result.rows.every(row => row.data_type === 'numeric');
    
    if (allNumeric) {
      console.log('\n✅ All cost columns are now numeric type!');
    } else {
      console.error('\n❌ Some cost columns are not numeric type!');
    }
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
}

// Execute the function
applyMigration();
