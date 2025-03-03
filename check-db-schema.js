// Script to check the database schema using the pg client
const { Pool } = require('pg');
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

// Function to check the database schema
async function checkDatabaseSchema() {
  console.log('Checking database schema...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    try {
      // Check if the care_plan_entries table exists
      console.log('\nChecking if the care_plan_entries table exists...');
      const tableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'care_plan_entries'
        )
      `);
      
      const tableExists = tableResult.rows[0].exists;
      console.log(`care_plan_entries table exists: ${tableExists}`);
      
      if (tableExists) {
        // Check the column types
        console.log('\nChecking column types...');
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
          console.warn('\nWarning: Some columns are not numeric. Migration needs to be applied.');
          console.log('SQL command to apply migration:');
          console.log(`
            -- Update cost columns from integer to numeric to support decimal values
            ALTER TABLE care_plan_entries
            ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
            ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
            ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
            ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
            ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;
          `);
          
          // Ask if the user wants to apply the migration
          console.log('\nDo you want to apply the migration now? (y/n)');
          console.log('To apply the migration, run the following command:');
          console.log('node execute-sql-file.js');
        } else {
          console.log('\nAll cost columns are numeric. Migration has been applied successfully!');
        }
      }
      
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Execute the function
checkDatabaseSchema();
