// Script to test the application's connection to the database
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Create a connection to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/supabase_local_db'
});

async function testAppConnection() {
  const client = await pool.connect();
  
  try {
    console.log('Testing application connection to the database...');
    console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/supabase_local_db'}`);
    
    // Check database version
    const versionResult = await client.query('SELECT version();');
    console.log(`Connected to PostgreSQL: ${versionResult.rows[0].version}`);
    
    // Check if the care_plan_entries table exists
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'care_plan_entries'
      );
    `);
    
    if (tableResult.rows[0].exists) {
      console.log('The care_plan_entries table exists.');
      
      // Check the column types
      const columnResult = await client.query(`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns
        WHERE table_name = 'care_plan_entries'
        AND column_name IN ('start_age', 'end_age', 'min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost');
      `);
      
      console.log('Column types:');
      columnResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
      });
      
      // Check if the trigger exists
      const triggerResult = await client.query(`
        SELECT 1 FROM pg_trigger WHERE tgname = 'handle_decimal_values_trigger';
      `);
      
      if (triggerResult.rowCount > 0) {
        console.log('The handle_decimal_values_trigger exists.');
      } else {
        console.log('The handle_decimal_values_trigger does not exist.');
      }
      
      // Test inserting a record with decimal values
      console.log('Testing insertion of a record with decimal values...');
      
      // First, get a valid plan_id
      const planResult = await client.query(`
        SELECT id FROM life_care_plans LIMIT 1;
      `);
      
      if (planResult.rowCount > 0) {
        const planId = planResult.rows[0].id;
        
        // Insert a test record
        const insertResult = await client.query(`
          INSERT INTO care_plan_entries (
            plan_id, category, item, frequency, 
            min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
            start_age, end_age, is_one_time
          ) VALUES (
            $1, 'Test App Category', 'Test App Item', 'Test Frequency',
            100.50, 200.75, 300.25, 1000.50, 30000.75,
            50.5, 80.3, false
          ) RETURNING id, start_age, end_age;
        `, [planId]);
        
        console.log('Test record inserted successfully:');
        console.log(`  ID: ${insertResult.rows[0].id}`);
        console.log(`  start_age: ${insertResult.rows[0].start_age}`);
        console.log(`  end_age: ${insertResult.rows[0].end_age}`);
        
        // Verify the inserted values
        const verifyResult = await client.query(`
          SELECT start_age, end_age, min_cost, avg_cost, max_cost, annual_cost, lifetime_cost
          FROM care_plan_entries
          WHERE id = $1;
        `, [insertResult.rows[0].id]);
        
        console.log('Verified inserted values:');
        Object.entries(verifyResult.rows[0]).forEach(([key, value]) => {
          console.log(`  ${key}: ${value} (type: ${typeof value})`);
        });
        
        // Clean up the test record
        await client.query(`
          DELETE FROM care_plan_entries 
          WHERE id = $1;
        `, [insertResult.rows[0].id]);
        
        console.log('Test record cleaned up.');
      } else {
        console.log('No life care plans found for testing.');
      }
    } else {
      console.log('The care_plan_entries table does not exist.');
    }
    
    console.log('Application connection test completed successfully!');
  } catch (error) {
    console.error('Error testing application connection:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testAppConnection().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 