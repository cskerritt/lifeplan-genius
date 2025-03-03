// Script to apply migration using direct PostgreSQL connection with environment variables
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// Get the database connection string from environment variables
// You can set this by creating a .env file with:
// DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ooewnlqozkypyceowuhy.supabase.co:5432/postgres
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please create a .env file with your database connection string:');
  console.error('DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ooewnlqozkypyceowuhy.supabase.co:5432/postgres');
  process.exit(1);
}

// Create a new pool using the connection string
const pool = new Pool({
  connectionString,
});

async function applyMigration() {
  console.log('Applying migration to update cost columns from INTEGER to NUMERIC...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Start a transaction
    await client.query('BEGIN');
    
    try {
      // Execute the migration SQL
      console.log('Executing migration SQL...');
      await client.query(`
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
      `);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Migration successfully applied!');
      
      // Verify the column types
      console.log('\nVerifying column types...');
      const columnTypesResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'care_plan_entries' 
        AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
      `);
      
      console.log('Column types after migration:');
      columnTypesResult.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}`);
        
        // Check if the column type is numeric
        if (row.data_type.toLowerCase() !== 'numeric') {
          console.warn(`Warning: ${row.column_name} is still ${row.data_type}, not NUMERIC`);
        }
      });
      
    } catch (error) {
      // Rollback the transaction if there's an error
      await client.query('ROLLBACK');
      console.error('Error applying migration:', error);
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

// Execute the function
applyMigration();
