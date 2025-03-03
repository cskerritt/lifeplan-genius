// Script to check all columns in the care_plan_entries table
import pg from 'pg';
const { Pool } = pg;

// Create a connection pool to the local PostgreSQL database
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/supabase_local_db',
  ssl: false
});

// Main function to check all columns
async function checkAllColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking all columns in the care_plan_entries table...');
    
    // Get all columns and their data types
    const columnQuery = `
      SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'care_plan_entries'
      ORDER BY column_name;
    `;
    
    const columnResult = await client.query(columnQuery);
    console.log('\n📊 All columns and their data types:');
    columnResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.numeric_precision ? `(${row.numeric_precision},${row.numeric_scale})` : ''}`);
    });
    
    // Check for any integer columns that might need to be converted
    const integerColumns = columnResult.rows.filter(row => row.data_type === 'integer');
    
    if (integerColumns.length > 0) {
      console.log('\n⚠️ Found integer columns that might need to be converted:');
      integerColumns.forEach(col => {
        console.log(`   - ${col.column_name}`);
      });
      
      // Offer to convert these columns
      console.log('\n🔄 Converting integer columns to numeric(15,2)...');
      
      for (const col of integerColumns) {
        try {
          await client.query(`
            ALTER TABLE care_plan_entries 
            ALTER COLUMN ${col.column_name} TYPE numeric(15,2) USING ${col.column_name}::numeric(15,2);
          `);
          console.log(`✅ Successfully converted column: ${col.column_name}`);
        } catch (error) {
          console.error(`❌ Error converting column ${col.column_name}: ${error.message}`);
        }
      }
    } else {
      console.log('\n✅ No integer columns found that need conversion');
    }
    
    // Check for any triggers on the table
    const triggerQuery = `
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'care_plan_entries'
      ORDER BY trigger_name;
    `;
    
    const triggerResult = await client.query(triggerQuery);
    console.log('\n📋 Triggers on the care_plan_entries table:');
    if (triggerResult.rows.length === 0) {
      console.log('   No triggers found');
    } else {
      triggerResult.rows.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }
    
    // Check for any functions used by triggers
    const functionQuery = `
      SELECT p.proname AS function_name, pg_get_function_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.proname IN ('convert_cost_to_numeric', 'handle_decimal_values', 'update_life_care_plan_totals');
    `;
    
    const functionResult = await client.query(functionQuery);
    console.log('\n📋 Functions used by triggers:');
    if (functionResult.rows.length === 0) {
      console.log('   No relevant functions found');
    } else {
      functionResult.rows.forEach(func => {
        console.log(`   - ${func.function_name}(${func.args})`);
      });
    }
    
    // Try to insert a test record with decimal values
    console.log('\n🧪 Attempting to insert a test record with decimal values...');
    try {
      const testInsertQuery = `
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
      `;
      
      const insertResult = await client.query(testInsertQuery);
      console.log(`✅ Successfully inserted test record with ID: ${insertResult.rows[0].id}`);
      
      // Clean up the test record
      await client.query(`DELETE FROM care_plan_entries WHERE id = $1`, [insertResult.rows[0].id]);
      console.log('✅ Successfully cleaned up test record');
    } catch (error) {
      console.error('❌ Error inserting test record:', error.message);
    }
    
    console.log('\n🎉 Column check completed!');
    
  } catch (error) {
    console.error('❌ Error checking columns:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the function
checkAllColumns(); 