// Script to verify that the application can connect to the local database
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get the DATABASE_URL from the environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log(`🔍 Using DATABASE_URL: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`);

// Create a connection pool to the database
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false
});

// Main function to verify the connection
async function verifyConnection() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Connecting to database...');
    
    // Check if we can connect to the database
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ Successfully connected to the database: ${versionResult.rows[0].version}`);
    
    // Check if the care_plan_entries table exists
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'care_plan_entries'
      );
    `);
    
    if (tableResult.rows[0].exists) {
      console.log('✅ care_plan_entries table exists');
      
      // Check the structure of the care_plan_entries table
      const columnResult = await client.query(`
        SELECT column_name, data_type, numeric_precision, numeric_scale
        FROM information_schema.columns
        WHERE table_name = 'care_plan_entries'
        AND column_name IN ('start_age', 'end_age')
        ORDER BY column_name;
      `);
      
      console.log('\n📊 Age columns data types:');
      columnResult.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}${row.numeric_precision ? `(${row.numeric_precision},${row.numeric_scale})` : ''}`);
      });
      
      // Try to insert a test record
      console.log('\n🧪 Attempting to insert a test record with decimal values...');
      try {
        const insertResult = await client.query(`
          INSERT INTO care_plan_entries (
            plan_id, category, item, frequency, 
            annual_cost, lifetime_cost, start_age, end_age
          ) 
          VALUES (
            (SELECT id FROM life_care_plans LIMIT 1),
            'Test Category',
            'Test Item',
            'Test Frequency',
            100.50,
            2900.75,
            51.5,
            80.3
          )
          RETURNING id;
        `);
        
        console.log(`✅ Successfully inserted test record with ID: ${insertResult.rows[0].id}`);
        
        // Clean up the test record
        await client.query(`DELETE FROM care_plan_entries WHERE id = $1`, [insertResult.rows[0].id]);
        console.log('✅ Successfully cleaned up test record');
      } catch (error) {
        console.error('❌ Error inserting test record:', error.message);
      }
    } else {
      console.error('❌ care_plan_entries table does not exist');
    }
    
    console.log('\n🎉 Connection verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying connection:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the function
verifyConnection(); 