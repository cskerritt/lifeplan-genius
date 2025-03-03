// Script to add a database trigger to automatically convert integer values to numeric
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

// Function to add the database trigger
async function addDatabaseTrigger() {
  console.log('Starting to add database trigger...');
  
  try {
    // Connect to the database
    await pgClient.connect();
    console.log('Connected to PostgreSQL database');
    
    // Start a transaction
    await pgClient.query('BEGIN');
    
    // Create a function to handle the trigger
    console.log('Creating trigger function...');
    await pgClient.query(`
      CREATE OR REPLACE FUNCTION convert_cost_to_numeric()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Convert cost values to numeric if they are not already
        NEW.min_cost := NEW.min_cost::numeric;
        NEW.avg_cost := NEW.avg_cost::numeric;
        NEW.max_cost := NEW.max_cost::numeric;
        NEW.annual_cost := NEW.annual_cost::numeric;
        NEW.lifetime_cost := NEW.lifetime_cost::numeric;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Check if the trigger already exists
    console.log('Checking if trigger already exists...');
    const triggerResult = await pgClient.query(`
      SELECT 1 FROM pg_trigger WHERE tgname = 'convert_cost_to_numeric_trigger';
    `);
    
    // Drop the trigger if it already exists
    if (triggerResult.rowCount > 0) {
      console.log('Trigger already exists, dropping it...');
      await pgClient.query(`
        DROP TRIGGER IF EXISTS convert_cost_to_numeric_trigger ON care_plan_entries;
      `);
    }
    
    // Create the trigger
    console.log('Creating trigger...');
    await pgClient.query(`
      CREATE TRIGGER convert_cost_to_numeric_trigger
      BEFORE INSERT OR UPDATE ON care_plan_entries
      FOR EACH ROW
      EXECUTE FUNCTION convert_cost_to_numeric();
    `);
    
    // Commit the transaction
    await pgClient.query('COMMIT');
    
    console.log('Database trigger added successfully!');
    
    // Now test inserting a record with decimal values
    console.log('\nTesting insertion of a record with decimal values...');
    
    // Generate a unique test item name
    const testItemName = `Trigger Test Item ${new Date().toISOString()}`;
    
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
    
    console.log('\n✅ Database trigger added and tested successfully!');
    
  } catch (error) {
    console.error('Error adding database trigger:', error);
    
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
addDatabaseTrigger();
