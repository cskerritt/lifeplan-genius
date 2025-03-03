// Script to test inserting decimal values into the care_plan_entries table using pg client
const { Pool } = require('pg');
require('dotenv').config();

// Get the database connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please check your .env file and ensure it is set correctly.');
  process.exit(1);
}

// Create a new pool using the connection string
const pool = new Pool({
  connectionString: databaseUrl,
});

// Test data with decimal values
const testData = {
  plan_id: 'test-plan-id',
  category: 'test-category',
  item: 'Test Item with Decimal Costs',
  frequency: '4-4x per year 29 years',
  cpt_code: '99214',
  cpt_description: 'Office or other outpatient visit',
  min_cost: 80.3,
  avg_cost: 100.5,
  max_cost: 120.7,
  annual_cost: 402.0,
  lifetime_cost: 11658.0,
  start_age: 51,
  end_age: 80,
  is_one_time: false
};

// Function to test inserting decimal values
async function testDecimalInsert() {
  console.log('Testing insertion of decimal values into care_plan_entries table using pg client...');
  console.log('Test data:', testData);
  
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // First, check the column types
    console.log('\nChecking column types...');
    const columnTypesResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'care_plan_entries' 
      AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
    `);
    
    console.log('Column types:');
    columnTypesResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
      
      // Check if the cost columns are numeric
      if (['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'].includes(row.column_name)) {
        if (row.data_type.toLowerCase() !== 'numeric') {
          console.warn(`Warning: ${row.column_name} is ${row.data_type}, not NUMERIC`);
        }
      }
    });
    
    // If any column is not numeric, apply the migration
    const nonNumericColumns = columnTypesResult.rows.filter(row => 
      ['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'].includes(row.column_name) && 
      row.data_type.toLowerCase() !== 'numeric'
    );
    
    if (nonNumericColumns.length > 0) {
      console.log('\nSome columns are not numeric. Applying migration...');
      
      // SQL command to update the column types
      const sql = `
        -- Update cost columns from integer to numeric to support decimal values
        ALTER TABLE care_plan_entries
        ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
        ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
        ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
        ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
        ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;
      `;
      
      try {
        // Execute the SQL command
        await client.query(sql);
        console.log('Migration applied successfully!');
        
        // Check the column types again
        console.log('\nVerifying column types after migration...');
        const verifyResult = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'care_plan_entries' 
          AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')
        `);
        
        console.log('Column types after migration:');
        verifyResult.rows.forEach(row => {
          console.log(`${row.column_name}: ${row.data_type}`);
        });
      } catch (sqlError) {
        console.error('Error applying migration:', sqlError);
        await client.query('ROLLBACK');
        return;
      }
    }
    
    // Insert the test data
    console.log('\nInserting test data with decimal values...');
    const insertQuery = `
      INSERT INTO care_plan_entries (
        plan_id, category, item, frequency, cpt_code, cpt_description,
        min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
        start_age, end_age, is_one_time
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *
    `;
    
    const insertValues = [
      testData.plan_id,
      testData.category,
      testData.item,
      testData.frequency,
      testData.cpt_code,
      testData.cpt_description,
      testData.min_cost,
      testData.avg_cost,
      testData.max_cost,
      testData.annual_cost,
      testData.lifetime_cost,
      testData.start_age,
      testData.end_age,
      testData.is_one_time
    ];
    
    const insertResult = await client.query(insertQuery, insertValues);
    
    console.log('Test data inserted successfully!');
    console.log('Inserted data:', insertResult.rows[0]);
    
    // Commit the transaction
    await client.query('COMMIT');
    
  } catch (error) {
    // Rollback the transaction if there's an error
    await client.query('ROLLBACK');
    console.error('Error:', error);
    
    // If the error is related to column types, it means the migration didn't work
    if (error.code === '22P02' && error.message.includes('invalid input syntax for type integer')) {
      console.error('\nError indicates column type mismatch. The migration did not work.');
      console.error('Please run the migration manually using the Supabase dashboard.');
      console.error('SQL command:');
      console.error(`
        -- Update cost columns from integer to numeric to support decimal values
        ALTER TABLE care_plan_entries
        ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
        ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
        ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
        ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
        ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;
      `);
    }
  } finally {
    // Release the client back to the pool
    client.release();
  }
  
  // Close the pool
  await pool.end();
}

// Execute the test
testDecimalInsert();
