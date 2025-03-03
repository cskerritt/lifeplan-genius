// Script to test inserting decimal values into the care_plan_entries table
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

async function testDecimalInsert() {
  const client = await pool.connect();
  
  try {
    console.log('Testing decimal value insertion...');
    
    // Get a valid plan_id from the life_care_plans table
    const planResult = await client.query(`
      SELECT id FROM life_care_plans LIMIT 1
    `);
    
    if (planResult.rowCount === 0) {
      console.log('No plan found for testing');
      return;
    }
    
    const planId = planResult.rows[0].id;
    console.log(`Using plan ID: ${planId}`);
    
    // Test 1: Direct SQL insert with decimal values
    console.log('\nTest 1: Direct SQL insert with decimal values');
    const test1Result = await client.query(`
      INSERT INTO care_plan_entries (
        plan_id, category, item, frequency, 
        min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
        start_age, end_age, is_one_time
      ) VALUES (
        $1, 'Test Direct SQL', 'Test Item 1', 'Annual',
        100.50, 150.75, 200.25, 1000.50, 10000.75,
        50.5, 80.3, false
      ) RETURNING id, start_age, end_age
    `, [planId]);
    
    console.log('Test 1 result:', test1Result.rows[0]);
    
    // Test 2: Insert using the RPC function
    console.log('\nTest 2: Insert using the RPC function');
    const test2Result = await client.query(`
      SELECT handle_decimal_values(
        $1::UUID, 'Test RPC', 'Test Item 2', 'Annual', NULL, NULL,
        100.50, 150.75, 200.25, 1000.50, 10000.75,
        55.5, 85.3, false, NULL
      ) as result
    `, [planId]);
    
    console.log('Test 2 result:', test2Result.rows[0].result);
    
    // Test 3: Insert with parameterized query
    console.log('\nTest 3: Insert with parameterized query');
    const test3Result = await client.query({
      text: `
        INSERT INTO care_plan_entries (
          plan_id, category, item, frequency, 
          min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
          start_age, end_age, is_one_time
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12
        ) RETURNING id, start_age, end_age
      `,
      values: [
        planId, 
        'Test Parameterized', 
        'Test Item 3', 
        'Annual',
        100.50, 
        150.75, 
        200.25, 
        1000.50, 
        10000.75,
        60.5, 
        90.3, 
        false
      ]
    });
    
    console.log('Test 3 result:', test3Result.rows[0]);
    
    // Verify the inserted records
    console.log('\nVerifying inserted records...');
    const verifyResult = await client.query(`
      SELECT id, category, item, start_age, end_age
      FROM care_plan_entries
      WHERE category IN ('Test Direct SQL', 'Test RPC', 'Test Parameterized')
      ORDER BY category
    `);
    
    console.log('Verification results:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.category}: start_age=${row.start_age} (${typeof row.start_age}), end_age=${row.end_age} (${typeof row.end_age})`);
    });
    
    // Clean up the test records
    console.log('\nCleaning up test records...');
    await client.query(`
      DELETE FROM care_plan_entries 
      WHERE category IN ('Test Direct SQL', 'Test RPC', 'Test Parameterized')
    `);
    
    console.log('Test records cleaned up');
    console.log('\nDecimal value insertion test completed successfully');
  } catch (error) {
    console.error('Error testing decimal insert:', error);
  } finally {
    client.release();
  }
}

// Run the test
testDecimalInsert().finally(() => pool.end()); 