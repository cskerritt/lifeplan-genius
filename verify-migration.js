// Script to verify the database migration by checking tables and data
const { Pool } = require('pg');

// Create a connection pool to the local PostgreSQL database
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/supabase_local_db',
  ssl: false
});

// Function to execute a query and return the results
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Main function to verify the migration
async function verifyMigration() {
  try {
    console.log('Verifying database migration...');
    
    // Check if we can connect to the database
    console.log('\nChecking database connection...');
    await executeQuery('SELECT 1');
    console.log('✅ Successfully connected to the local PostgreSQL database');
    
    // Get a list of all tables
    console.log('\nRetrieving list of tables...');
    const tables = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database. Migration may have failed.');
      return;
    }
    
    console.log(`✅ Found ${tables.length} tables in the database:`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    // For each table, get the row count
    console.log('\nChecking row counts for each table...');
    for (const table of tables) {
      const tableName = table.table_name;
      const countResult = await executeQuery(`SELECT COUNT(*) FROM "${tableName}"`);
      const count = parseInt(countResult[0].count);
      console.log(`   ${tableName}: ${count} rows`);
    }
    
    console.log('\n✅ Migration verification complete!');
    console.log('If you see your tables and data above, the migration was successful.');
    console.log('\nNext steps:');
    console.log('1. Run the update-db-connection.js script to update your application to use the local database');
    console.log('2. Update your application code to use the local database connection');
    console.log('3. Test your application to ensure it works with the local database');
    
  } catch (error) {
    console.error('Error verifying migration:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the verification
verifyMigration(); 