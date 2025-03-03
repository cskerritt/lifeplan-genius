// Script to directly fix the database schema and test the fix
import pg from 'pg';
import dotenv from 'dotenv';
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

// Function to fix the database schema
async function fixDatabaseSchema() {
  console.log('Starting direct database fix...');
  
  try {
    // Connect to the database
    await pgClient.connect();
    console.log('Connected to PostgreSQL database');
    
    // Start a transaction
    await pgClient.query('BEGIN');
    
    // Check the current column types
    console.log('Checking current column types...');
    const result = await pgClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'care_plan_entries' 
      AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
    `);
    
    console.log('Current column types:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Apply the fix to ensure all columns are numeric
    console.log('\nApplying fix to ensure all columns are numeric...');
    
    // Execute the SQL to change column types
    await pgClient.query(`
      ALTER TABLE care_plan_entries
      ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
      ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
      ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
      ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
      ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;
    `);
    
    // Commit the transaction
    await pgClient.query('COMMIT');
    
    console.log('Database schema fix applied successfully!');
    
    // Verify the column types after the fix
    console.log('\nVerifying column types after the fix...');
    const verifyResult = await pgClient.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'care_plan_entries' 
      AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
    `);
    
    console.log('Column types after fix:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if all columns are numeric
    const allNumeric = verifyResult.rows.every(row => row.data_type === 'numeric');
    
    if (allNumeric) {
      console.log('\n✅ All cost columns are now numeric type!');
    } else {
      console.error('\n❌ Some cost columns are not numeric type!');
    }
    
    // Now test inserting a record with decimal values
    console.log('\nTesting insertion of a record with decimal values...');
    
    // Generate a unique test item name
    const testItemName = `Test Item ${new Date().toISOString()}`;
    
    // Insert a test record with decimal values
    const insertResult = await pgClient.query(`
      INSERT INTO care_plan_entries (
        plan_id, 
        category, 
        item, 
        frequency, 
        cpt_code, 
        cpt_description, 
        min_cost, 
        avg_cost, 
        max_cost, 
        annual_cost, 
        lifetime_cost, 
        start_age, 
        end_age, 
        is_one_time
      ) VALUES (
        '1575cabb-cee8-4051-b391-0c20af6444cd', 
        'test', 
        $1, 
        '4x per year', 
        '99214', 
        'Office Visit', 
        75.25, 
        80.50, 
        85.75, 
        322.00, 
        9338.00, 
        51, 
        80, 
        false
      ) RETURNING *;
    `, [testItemName]);
    
    console.log('Successfully inserted test record with decimal values!');
    console.log('Inserted record:', insertResult.rows[0]);
    
    // Verify the inserted record
    console.log('\nVerifying the inserted record...');
    const verifyInsertResult = await pgClient.query(`
      SELECT min_cost, avg_cost, max_cost, annual_cost, lifetime_cost
      FROM care_plan_entries
      WHERE item = $1
    `, [testItemName]);
    
    console.log('Verification of inserted data:');
    console.log(verifyInsertResult.rows[0]);
    
    console.log('\n✅ Database fix and test completed successfully!');
    
  } catch (error) {
    console.error('Error fixing database schema:', error);
    
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
fixDatabaseSchema();
