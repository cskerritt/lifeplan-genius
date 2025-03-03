/**
 * Test Local Database Connection
 * 
 * This script tests the connection to the local PostgreSQL database.
 */

// Import the database connection module
const { Pool } = require('pg');

// Read the .env file to get the database connection string
require('dotenv').config();

// Log the database URL (with password masked)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL:', dbUrl.replace(/:([^:@]+)@/, ':****@'));

// Create a new database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log when the pool connects
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Log any pool errors
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

/**
 * Test the database connection
 */
async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Run a simple query
    const result = await client.query('SELECT NOW()');
    console.log('Current database time:', result.rows[0].now);
    
    // Release the client back to the pool
    client.release();
    
    // List all tables in the database
    console.log('\nListing all tables in the database...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database');
    } else {
      console.log('Tables in the database:');
      tablesResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    }
    
    // Check if gaf_lookup table exists
    console.log('\nChecking if gaf_lookup table exists...');
    const gafLookupResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gaf_lookup'
      );
    `);
    
    const gafLookupExists = gafLookupResult.rows[0].exists;
    
    if (gafLookupExists) {
      console.log('gaf_lookup table exists in the database');
      
      // Count rows in gaf_lookup table
      const countResult = await pool.query('SELECT COUNT(*) FROM gaf_lookup');
      console.log(`gaf_lookup table has ${countResult.rows[0].count} rows`);
      
      // Show sample data from gaf_lookup table
      console.log('\nSample data from gaf_lookup table:');
      const sampleResult = await pool.query('SELECT * FROM gaf_lookup LIMIT 5');
      
      if (sampleResult.rows.length === 0) {
        console.log('No data found in gaf_lookup table');
      } else {
        console.log('Columns:', Object.keys(sampleResult.rows[0]).join(', '));
        sampleResult.rows.forEach((row, index) => {
          console.log(`\nRow ${index + 1}:`);
          for (const [key, value] of Object.entries(row)) {
            console.log(`  ${key}: ${value}`);
          }
        });
      }
    } else {
      console.log('gaf_lookup table does not exist in the database');
    }
    
    return true;
  } catch (error) {
    console.error('Error testing database connection:', error);
    return false;
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection pool closed');
  }
}

// Run the test
testConnection()
  .then(success => {
    console.log('\nTest completed:', success ? 'SUCCESS' : 'FAILED');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
