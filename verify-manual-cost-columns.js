// Verify that the manual cost columns have been added to the database
const { Pool } = require('pg');
require('dotenv').config();

async function verifyColumns() {
  // Get database connection string from environment variable
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/supabase_local_db';
  
  console.log('Connecting to database with connection string:', connectionString.replace(/:[^:]*@/, ':****@'));
  
  // Create a new PostgreSQL connection pool
  const pool = new Pool({
    connectionString,
  });
  
  try {
    // Test the connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', testResult.rows[0]);
    
    // Verify the columns were added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'care_plan_entries' 
      AND column_name IN ('is_manual_cost', 'notes', 'rationale');
    `);
    
    console.log('Verification result:');
    console.table(verifyResult.rows);
    
    if (verifyResult.rows.length === 3) {
      console.log('All columns were added successfully!');
    } else {
      console.warn(`Some columns may not have been added correctly. Found ${verifyResult.rows.length} of 3 expected columns.`);
    }
    
  } catch (error) {
    console.error('Error verifying columns:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

verifyColumns();
