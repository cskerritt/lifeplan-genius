// Script to create an RPC function in the database to handle decimal values
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';

// Load environment variables from .env and .env.local files
dotenv.config({ path: '.env' });
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

// Get the database connection string from environment variables
// Default to a local connection if not provided
const connectionString = process.env.VITE_DATABASE_URL || 
                         process.env.DATABASE_URL || 
                         'postgresql://postgres:postgres@localhost:5432/supabase_local_db';

console.log(`Using database connection: ${connectionString}`);

// Create a connection pool to the database
const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createRpcFunction() {
  const client = await pool.connect();
  
  try {
    console.log('Creating RPC function to handle decimal values...');
    
    // Create or replace the function to handle decimal values
    await client.query(`
      CREATE OR REPLACE FUNCTION handle_decimal_values(
        p_plan_id UUID,
        p_category TEXT,
        p_item TEXT,
        p_frequency TEXT,
        p_cpt_code TEXT,
        p_cpt_description TEXT,
        p_min_cost NUMERIC,
        p_avg_cost NUMERIC,
        p_max_cost NUMERIC,
        p_annual_cost NUMERIC,
        p_lifetime_cost NUMERIC,
        p_start_age NUMERIC,
        p_end_age NUMERIC,
        p_is_one_time BOOLEAN,
        p_age_increments TEXT DEFAULT NULL
      ) RETURNS JSONB AS $$
      DECLARE
        v_id UUID;
      BEGIN
        -- Insert the record with explicit CAST to ensure numeric types
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
          is_one_time,
          age_increments
        ) VALUES (
          p_plan_id,
          p_category,
          p_item,
          p_frequency,
          p_cpt_code,
          p_cpt_description,
          CAST(p_min_cost AS NUMERIC(15,2)),
          CAST(p_avg_cost AS NUMERIC(15,2)),
          CAST(p_max_cost AS NUMERIC(15,2)),
          CAST(p_annual_cost AS NUMERIC(15,2)),
          CAST(p_lifetime_cost AS NUMERIC(15,2)),
          CAST(p_start_age AS NUMERIC(15,2)),
          CAST(p_end_age AS NUMERIC(15,2)),
          p_is_one_time,
          p_age_increments
        )
        RETURNING id INTO v_id;
        
        -- Return the inserted record as JSONB
        RETURN (SELECT row_to_json(r)::JSONB FROM (
          SELECT * FROM care_plan_entries WHERE id = v_id
        ) r);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('RPC function created successfully');
    
    // Check if the trigger already exists
    const triggerCheckResult = await client.query(`
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'handle_decimal_values_trigger'
    `);
    
    if (triggerCheckResult.rowCount === 0) {
      // Create a trigger to automatically handle decimal values on insert or update
      await client.query(`
        CREATE TRIGGER handle_decimal_values_trigger
        BEFORE INSERT OR UPDATE ON care_plan_entries
        FOR EACH ROW
        EXECUTE FUNCTION handle_decimal_values_trigger_function();
      `);
      console.log('Trigger created successfully');
    } else {
      console.log('Trigger already exists');
    }
    
    // Test the function with a sample insert
    console.log('Testing RPC function with a sample insert...');
    
    // Get a valid plan_id from the life_care_plans table
    const planResult = await client.query(`
      SELECT id FROM life_care_plans LIMIT 1
    `);
    
    if (planResult.rowCount > 0) {
      const planId = planResult.rows[0].id;
      
      // Call the RPC function
      const testResult = await client.query(`
        SELECT handle_decimal_values(
          $1::UUID, 'Test Category', 'Test Item', 'Annual', NULL, NULL,
          100.50, 150.75, 200.25, 1000.50, 10000.75,
          50.5, 80.3, false, NULL
        ) as result
      `, [planId]);
      
      console.log('Test result:', testResult.rows[0].result);
      
      // Clean up the test record
      await client.query(`
        DELETE FROM care_plan_entries 
        WHERE item = 'Test Item' AND category = 'Test Category'
      `);
      
      console.log('Test record cleaned up');
    } else {
      console.log('No plan found for testing');
    }
    
    console.log('RPC function and trigger setup completed successfully');
  } catch (error) {
    console.error('Error creating RPC function:', error);
  } finally {
    client.release();
  }
}

// Create the trigger function if it doesn't exist
async function createTriggerFunction() {
  const client = await pool.connect();
  
  try {
    console.log('Creating trigger function...');
    
    // Create or replace the trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION handle_decimal_values_trigger_function()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Ensure numeric values are properly cast
        NEW.min_cost = CAST(NEW.min_cost AS NUMERIC(15,2));
        NEW.avg_cost = CAST(NEW.avg_cost AS NUMERIC(15,2));
        NEW.max_cost = CAST(NEW.max_cost AS NUMERIC(15,2));
        NEW.annual_cost = CAST(NEW.annual_cost AS NUMERIC(15,2));
        NEW.lifetime_cost = CAST(NEW.lifetime_cost AS NUMERIC(15,2));
        NEW.start_age = CAST(NEW.start_age AS NUMERIC(15,2));
        NEW.end_age = CAST(NEW.end_age AS NUMERIC(15,2));
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('Trigger function created successfully');
  } catch (error) {
    console.error('Error creating trigger function:', error);
  } finally {
    client.release();
  }
}

// Run the functions
async function run() {
  try {
    await createTriggerFunction();
    await createRpcFunction();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

run(); 