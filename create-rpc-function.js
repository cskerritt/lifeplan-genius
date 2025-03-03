// Script to create an RPC function in the database to handle decimal values properly
require('dotenv').config();
const { Pool } = require('pg');

// Create a connection to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/supabase_local_db'
});

async function createRpcFunction() {
  const client = await pool.connect();
  
  try {
    console.log('Creating RPC function to handle decimal values...');
    
    // Create a function to handle decimal values
    await client.query(`
      CREATE OR REPLACE FUNCTION handle_decimal_values() 
      RETURNS TRIGGER AS $$
      BEGIN
        -- Convert cost values to numeric
        NEW.min_cost = NEW.min_cost::numeric(15,2);
        NEW.avg_cost = NEW.avg_cost::numeric(15,2);
        NEW.max_cost = NEW.max_cost::numeric(15,2);
        NEW.annual_cost = NEW.annual_cost::numeric(15,2);
        NEW.lifetime_cost = NEW.lifetime_cost::numeric(15,2);
        
        -- Convert age values to numeric
        NEW.start_age = NEW.start_age::numeric(15,2);
        NEW.end_age = NEW.end_age::numeric(15,2);
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('Function created successfully.');
    
    // Check if the trigger already exists
    const triggerResult = await client.query(`
      SELECT 1 FROM pg_trigger WHERE tgname = 'handle_decimal_values_trigger';
    `);
    
    // If the trigger doesn't exist, create it
    if (triggerResult.rowCount === 0) {
      console.log('Creating trigger...');
      
      await client.query(`
        CREATE TRIGGER handle_decimal_values_trigger
        BEFORE INSERT OR UPDATE ON care_plan_entries
        FOR EACH ROW
        EXECUTE FUNCTION handle_decimal_values();
      `);
      
      console.log('Trigger created successfully.');
    } else {
      console.log('Trigger already exists.');
    }
    
    // Test the function with a sample insert
    console.log('Testing the function with a sample insert...');
    
    // First, get a valid plan_id
    const planResult = await client.query(`
      SELECT id FROM life_care_plans LIMIT 1;
    `);
    
    if (planResult.rowCount > 0) {
      const planId = planResult.rows[0].id;
      
      // Insert a test record
      await client.query(`
        INSERT INTO care_plan_entries (
          plan_id, category, item, frequency, 
          min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
          start_age, end_age, is_one_time
        ) VALUES (
          $1, 'Test Category', 'Test Item', 'Test Frequency',
          100.50, 200.75, 300.25, 1000.50, 30000.75,
          50.5, 80.3, false
        ) RETURNING id;
      `, [planId]);
      
      console.log('Test record inserted successfully.');
      
      // Clean up the test record
      await client.query(`
        DELETE FROM care_plan_entries 
        WHERE category = 'Test Category' AND item = 'Test Item';
      `);
      
      console.log('Test record cleaned up.');
    } else {
      console.log('No life care plans found for testing.');
    }
    
    console.log('RPC function and trigger setup completed successfully!');
  } catch (error) {
    console.error('Error creating RPC function:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createRpcFunction().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 