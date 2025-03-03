// Script to fix trigger functions to handle age columns
import pg from 'pg';
const { Pool } = pg;

// Create a connection pool to the local PostgreSQL database
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/supabase_local_db',
  ssl: false
});

// Main function to fix the trigger functions
async function fixTriggerFunctions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting to fix trigger functions...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Update the convert_cost_to_numeric function
    console.log('\n🔄 Updating convert_cost_to_numeric function...');
    const updateConvertCostFunction = `
      CREATE OR REPLACE FUNCTION public.convert_cost_to_numeric()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        -- Convert cost values to numeric if they are not already
        NEW.min_cost := NEW.min_cost::numeric;
        NEW.avg_cost := NEW.avg_cost::numeric;
        NEW.max_cost := NEW.max_cost::numeric;
        NEW.annual_cost := NEW.annual_cost::numeric;
        NEW.lifetime_cost := NEW.lifetime_cost::numeric;
        -- Also convert age values to numeric
        NEW.start_age := NEW.start_age::numeric;
        NEW.end_age := NEW.end_age::numeric;
        RETURN NEW;
      END;
      $function$;
    `;
    
    await client.query(updateConvertCostFunction);
    console.log('✅ Successfully updated convert_cost_to_numeric function');
    
    // Update the handle_decimal_values function
    console.log('\n🔄 Updating handle_decimal_values function...');
    const updateHandleDecimalFunction = `
      CREATE OR REPLACE FUNCTION public.handle_decimal_values()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        -- Convert cost values to numeric if they are not already
        NEW.min_cost := NEW.min_cost::numeric;
        NEW.avg_cost := NEW.avg_cost::numeric;
        NEW.max_cost := NEW.max_cost::numeric;
        NEW.annual_cost := NEW.annual_cost::numeric;
        NEW.lifetime_cost := NEW.lifetime_cost::numeric;
        -- Also convert age values to numeric
        NEW.start_age := NEW.start_age::numeric;
        NEW.end_age := NEW.end_age::numeric;
        -- Also convert frequency and duration values
        NEW.min_frequency := NEW.min_frequency::numeric;
        NEW.max_frequency := NEW.max_frequency::numeric;
        NEW.min_duration := NEW.min_duration::numeric;
        NEW.max_duration := NEW.max_duration::numeric;
        NEW.mfr_adjusted := NEW.mfr_adjusted::numeric;
        NEW.pfr_adjusted := NEW.pfr_adjusted::numeric;
        RETURN NEW;
      END;
      $function$;
    `;
    
    await client.query(updateHandleDecimalFunction);
    console.log('✅ Successfully updated handle_decimal_values function');
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Trigger function fixes completed!');
    console.log('\nNext steps:');
    console.log('1. Restart your application');
    console.log('2. Try inserting data again');
    
  } catch (error) {
    // Rollback the transaction if there's an error
    await client.query('ROLLBACK');
    console.error('❌ Error fixing trigger functions:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

// Run the function
fixTriggerFunctions(); 