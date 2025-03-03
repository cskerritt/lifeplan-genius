// Script to fix decimal columns in the care_plan_entries table
import pg from 'pg';
const { Pool } = pg;

// Create a connection pool to the local PostgreSQL database
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/supabase_local_db',
  ssl: false
});

// Main function to fix the decimal columns
async function fixDecimalColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting to fix decimal columns in care_plan_entries table...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Get the current column types
    const columnQuery = `
      SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'care_plan_entries'
      AND column_name IN ('annual_cost', 'lifetime_cost', 'min_cost', 'max_cost', 'avg_cost', 
                          'mfr_adjusted', 'pfr_adjusted', 'min_frequency', 'max_frequency', 
                          'min_duration', 'max_duration')
      ORDER BY column_name;
    `;
    
    const columnResult = await client.query(columnQuery);
    console.log('\n📊 Current column types:');
    columnResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.numeric_precision ? `(${row.numeric_precision},${row.numeric_scale})` : ''}`);
    });
    
    // Alter columns to ensure they are all numeric(15,2)
    console.log('\n🔄 Altering columns to ensure they support decimal values...');
    
    const columnsToFix = [
      'annual_cost', 'lifetime_cost', 'min_cost', 'max_cost', 'avg_cost',
      'mfr_adjusted', 'pfr_adjusted', 'min_frequency', 'max_frequency',
      'min_duration', 'max_duration'
    ];
    
    for (const column of columnsToFix) {
      try {
        await client.query(`
          ALTER TABLE care_plan_entries 
          ALTER COLUMN ${column} TYPE numeric(15,2) USING ${column}::numeric(15,2);
        `);
        console.log(`✅ Successfully altered column: ${column}`);
      } catch (error) {
        console.error(`❌ Error altering column ${column}: ${error.message}`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Verify the changes
    const verifyResult = await client.query(columnQuery);
    console.log('\n📊 Updated column types:');
    verifyResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.numeric_precision ? `(${row.numeric_precision},${row.numeric_scale})` : ''}`);
    });
    
    console.log('\n🎉 Column fixes completed!');
    console.log('\nNext steps:');
    console.log('1. Restart your application');
    console.log('2. Try inserting data again');
    console.log('3. If you still encounter issues, check your application code for any type conversions');
    
  } catch (error) {
    // Rollback the transaction if there's an error
    await client.query('ROLLBACK');
    console.error('❌ Error fixing decimal columns:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the function
fixDecimalColumns(); 