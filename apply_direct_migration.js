// Direct database migration script
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function applyMigration() {
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
    
    // Read the migration SQL file
    console.log('Reading migration SQL file...');
    const sql = fs.readFileSync('./migrations/add_manual_cost_and_notes_fields.sql', 'utf8');
    
    console.log('Applying migration...');
    console.log('SQL to execute:', sql);
    
    // Execute the SQL
    const result = await pool.query(sql);
    
    console.log('Migration applied successfully!');
    
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
      console.warn('Some columns may not have been added correctly.');
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

applyMigration();
