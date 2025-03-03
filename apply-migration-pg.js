// Script to apply the migration directly using the pg client
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Get the database connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please check your .env file and ensure it is set correctly.');
  process.exit(1);
}

// Create a new pool using the connection string
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false } // Add this line to allow self-signed certificates
});

// SQL command to update the column types
const sql = `
-- Update cost columns from integer to numeric to support decimal values
ALTER TABLE care_plan_entries
ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;

-- Update the comments to reflect the new column types
COMMENT ON COLUMN care_plan_entries.min_cost IS 'Minimum cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.avg_cost IS 'Average cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.max_cost IS 'Maximum cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.annual_cost IS 'Annual cost (numeric to support decimal values)';
COMMENT ON COLUMN care_plan_entries.lifetime_cost IS 'Lifetime cost (numeric to support decimal values)';
`;

// Function to apply the migration
async function applyMigration() {
  console.log('Applying migration to update cost columns from integer to numeric...');
  console.log('SQL commands to execute:');
  console.log(sql);
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Execute the SQL commands
      console.log('Executing SQL commands...');
      await client.query(sql);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('SQL commands executed successfully!');
      
      // Check the column types to verify the migration
      console.log('\nVerifying column types after migration...');
      const columnTypesResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'care_plan_entries' 
        AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
      `);
      
      console.log('Column types:');
      columnTypesResult.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}`);
        
        // Check if the cost columns are numeric
        if (['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'].includes(row.column_name)) {
          if (row.data_type.toLowerCase() !== 'numeric') {
            console.warn(`Warning: ${row.column_name} is ${row.data_type}, not NUMERIC`);
          }
        }
      });
      
      // If any column is not numeric, print a warning
      const nonNumericColumns = columnTypesResult.rows.filter(row => 
        ['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'].includes(row.column_name) && 
        row.data_type.toLowerCase() !== 'numeric'
      );
      
      if (nonNumericColumns.length > 0) {
        console.warn('\nWarning: Some columns are still not numeric. Migration may have failed.');
      } else {
        console.log('\nAll cost columns are now numeric. Migration was successful!');
      }
      
    } catch (error) {
      // Rollback the transaction if there's an error
      await client.query('ROLLBACK');
      console.error('Error executing SQL commands:', error);
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Execute the function
applyMigration();
