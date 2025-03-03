// Script to apply migrations using direct PostgreSQL connection with service role
const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Get the Supabase URL from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  console.error('Please check your .env file and ensure both variables are set correctly.');
  process.exit(1);
}

// Extract the host from the Supabase URL
// Example: https://ooewnlqozkypyceowuhy.supabase.co -> db.ooewnlqozkypyceowuhy.supabase.co
const supabaseHost = supabaseUrl.replace('https://', '').replace('.co', '');
const dbHost = `db.${supabaseHost}.co`;

// We need to ask the user for the database password
console.log('To connect to the PostgreSQL database, we need the database password.');
console.log('Please provide the password when prompted.');

// For now, we'll use a placeholder password and ask the user to update it
const connectionString = `postgresql://postgres:YOUR_PASSWORD_HERE@${dbHost}:5432/postgres`;

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

// Main function to apply migrations
async function applyMigrations(password) {
  console.log('Applying migrations using direct PostgreSQL connection...');
  
  // Create a connection string with the provided password
  const connectionString = `postgresql://postgres:${password}@${dbHost}:5432/postgres`;
  
  // Create a new pool using the connection string
  const pool = new Pool({
    connectionString,
  });
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Read migration files
    const ageIncrementsSQL = readMigrationFile('20250227152832_add_age_increments_columns.sql');
    const costColumnsSQL = readMigrationFile('20250227173300_update_cost_columns_to_numeric.sql');
    
    // Start a transaction
    await client.query('BEGIN');
    
    try {
      // Execute age increments migration
      console.log('Executing age increments migration...');
      await client.query(ageIncrementsSQL);
      console.log('Successfully executed age increments migration');
      
      // Execute cost columns migration
      console.log('Executing cost columns migration...');
      await client.query(costColumnsSQL);
      console.log('Successfully executed cost columns migration');
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('All migrations successfully applied!');
      
      // Verify the column types
      console.log('\nVerifying column types...');
      const columnTypesResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'care_plan_entries' 
        AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost', 'use_age_increments', 'age_increments')
      `);
      
      console.log('Column types after migration:');
      columnTypesResult.rows.forEach(row => {
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
      // Rollback the transaction if there's an error
      await client.query('ROLLBACK');
      console.error('Error applying migrations:', error);
      console.log('Transaction rolled back');
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
    // Close the pool
    await pool.end();
    console.log('\nConnection pool closed');
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

// Export the function for use in other scripts
module.exports = { applyMigrations };

// If this script is run directly, prompt for the password
if (require.main === module) {
  console.log('This script requires a database password to connect to Supabase PostgreSQL.');
  console.log('You can run this script with:');
  console.log('node apply-migrations-with-pg.js');
  console.log('Then enter your database password when prompted.');
  console.log('\nAlternatively, you can create a script that imports this module:');
  console.log('const { applyMigrations } = require(\'./apply-migrations-with-pg.js\');');
  console.log('applyMigrations(\'your-password-here\');');
}
