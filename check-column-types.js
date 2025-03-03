// Script to check the column types of the care_plan_entries table
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
});

// Function to check column types
async function checkColumnTypes() {
  console.log('Checking column types of the care_plan_entries table...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    try {
      // Check the column types
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
      } else {
        console.log('\nAll cost columns are numeric. Migration has been applied successfully!');
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
checkColumnTypes();
