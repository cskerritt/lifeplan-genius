// Script to apply only the second migration (update cost columns to numeric)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Error: The following required environment variables are missing:');
  missingEnvVars.forEach(varName => console.error(`- ${varName}`));
  console.error('\nPlease create or update your .env file with these variables.');
  process.exit(1);
}

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Path to the second migration file
const migrationFilePath = path.join(__dirname, 'migrations', 'sql', '20250227173300_update_cost_columns_to_numeric.sql');

// Function to apply the migration
async function applyMigration() {
  console.log('Applying migration to update cost columns to numeric...');
  
  try {
    // Read the migration file
    const sql = fs.readFileSync(migrationFilePath, 'utf8');
    console.log('Migration SQL:');
    console.log(sql);
    
    // Try to apply the migration using RPC function
    console.log('\nApplying migration using Supabase RPC function...');
    try {
      const { data, error } = await supabase.rpc('apply_migration', { sql });
      
      if (error) {
        console.error('Error applying migration using RPC:', error);
        throw error;
      }
      
      console.log('Migration applied successfully using RPC!');
      return;
    } catch (rpcError) {
      console.error('RPC function not available or failed:', rpcError);
      console.log('Trying alternative approach...');
    }
    
    // If RPC fails, try direct SQL execution
    console.log('\nApplying migration using direct SQL execution...');
    
    // Modify the SQL to use USING clause for type conversion
    const modifiedSql = sql.replace(
      /ALTER COLUMN (\w+) TYPE NUMERIC/g, 
      'ALTER COLUMN $1 TYPE NUMERIC USING $1::numeric'
    );
    
    console.log('Modified SQL:');
    console.log(modifiedSql);
    
    const { error } = await supabase.from('_migration_execution').insert({
      sql: modifiedSql,
      executed_at: new Date().toISOString()
    });
    
    if (error) {
      console.error('Error applying migration using direct SQL:', error);
      
      // If direct execution fails, provide manual instructions
      console.log('\nPlease run the following SQL commands directly in the Supabase dashboard:');
      console.log('\n' + modifiedSql);
      
      process.exit(1);
    }
    
    console.log('Migration applied successfully using direct SQL!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Execute the function
applyMigration();
