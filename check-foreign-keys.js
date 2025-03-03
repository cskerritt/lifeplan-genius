/**
 * Check Foreign Key Relationships
 * 
 * This script checks the foreign key relationships in the database
 * to understand the constraints on the care_plan_entries table.
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get connection string from environment variables
const connectionString = process.env.VITE_DATABASE_URL || 
  process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/supabase_local_db';

// Create a new client for testing
const client = new pg.Client({ connectionString });

async function checkForeignKeys() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');
    
    // Query to get foreign key relationships for care_plan_entries table
    const query = `
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='care_plan_entries';
    `;
    
    console.log('Checking foreign key relationships for care_plan_entries table...');
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('No foreign key relationships found for care_plan_entries table');
    } else {
      console.log('Foreign key relationships:');
      result.rows.forEach(row => {
        console.log(`- Column: ${row.column_name}`);
        console.log(`  References: ${row.foreign_table_name}.${row.foreign_column_name}`);
        console.log(`  Constraint name: ${row.constraint_name}`);
      });
    }
    
    // Check the referenced table (assuming it's care_plans)
    console.log('\nChecking referenced table structure...');
    const referencedTable = result.rows.length > 0 ? result.rows[0].foreign_table_name : 'care_plans';
    
    // Check if the referenced table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as table_exists
    `;
    
    const tableExistsResult = await client.query(tableExistsQuery, [referencedTable]);
    
    if (tableExistsResult.rows[0].table_exists) {
      console.log(`Table ${referencedTable} exists`);
      
      // Get the structure of the referenced table
      const tableStructureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `;
      
      const tableStructureResult = await client.query(tableStructureQuery, [referencedTable]);
      
      console.log(`\nStructure of ${referencedTable} table:`);
      tableStructureResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
      
      // Check if there are any records in the referenced table
      const countQuery = `SELECT COUNT(*) FROM ${referencedTable}`;
      const countResult = await client.query(countQuery);
      
      console.log(`\nNumber of records in ${referencedTable}: ${countResult.rows[0].count}`);
      
      if (parseInt(countResult.rows[0].count) > 0) {
        // Get a sample record from the referenced table
        const sampleQuery = `SELECT * FROM ${referencedTable} LIMIT 1`;
        const sampleResult = await client.query(sampleQuery);
        
        console.log('\nSample record:');
        console.log(sampleResult.rows[0]);
      }
    } else {
      console.log(`Table ${referencedTable} does not exist`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

// Run the function
checkForeignKeys();
