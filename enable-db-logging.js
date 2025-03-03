// Script to enable detailed logging in PostgreSQL
import pg from 'pg';
const { Pool } = pg;

// Create a connection pool to the local PostgreSQL database
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/supabase_local_db',
  ssl: false
});

// Main function to enable logging
async function enableLogging() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Enabling detailed SQL logging in PostgreSQL...');
    
    // Set log_statement to 'all' to log all SQL statements
    await client.query(`ALTER SYSTEM SET log_statement = 'all';`);
    
    // Set log_min_error_statement to 'error' to log all error statements
    await client.query(`ALTER SYSTEM SET log_min_error_statement = 'error';`);
    
    // Set log_min_duration_statement to 0 to log all statements with their duration
    await client.query(`ALTER SYSTEM SET log_min_duration_statement = 0;`);
    
    // Reload the configuration
    await client.query(`SELECT pg_reload_conf();`);
    
    console.log('✅ Successfully enabled detailed SQL logging');
    console.log('\nNext steps:');
    console.log('1. Check PostgreSQL log files for detailed SQL statements');
    console.log('2. The log file location depends on your PostgreSQL configuration');
    console.log('   - On macOS with Homebrew: /opt/homebrew/var/log/postgres.log');
    console.log('   - On Linux: /var/log/postgresql/postgresql-*.log');
    console.log('   - On Windows: PostgreSQL data directory/log');
    
  } catch (error) {
    console.error('❌ Error enabling logging:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the function
enableLogging(); 