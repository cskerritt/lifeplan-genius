// Script to demonstrate direct PostgreSQL connection to Supabase
const { Pool } = require('pg');

// Replace [YOUR-PASSWORD] with your actual database password
const connectionString = 'postgresql://postgres:[YOUR-PASSWORD]@db.ooewnlqozkypyceowuhy.supabase.co:5432/postgres';

// Create a new pool using the connection string
const pool = new Pool({
  connectionString,
});

async function testConnection() {
  console.log('Testing direct PostgreSQL connection to Supabase...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Execute a simple query to test the connection
    console.log('Executing test query...');
    const result = await client.query('SELECT current_timestamp as current_time');
    console.log('Query result:', result.rows[0]);
    
    // Release the client back to the pool
    client.release();
    
    // Example: Query the care_plan_entries table
    console.log('\nQuerying care_plan_entries table...');
    const entriesResult = await pool.query('SELECT COUNT(*) FROM care_plan_entries');
    console.log(`Total entries: ${entriesResult.rows[0].count}`);
    
    // Example: Check column types
    console.log('\nChecking column types for care_plan_entries table...');
    const columnTypesResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'care_plan_entries' 
      AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
    `);
    
    console.log('Column types:');
    columnTypesResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
    
    // Close the pool
    await pool.end();
    console.log('\nConnection pool closed');
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

// Execute the function
testConnection();
