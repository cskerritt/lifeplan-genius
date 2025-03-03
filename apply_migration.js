// Script to apply migration to Supabase database
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ooewnlqozkypyceowuhy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZXdubHFvemt5cHljZW93dWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgwNjM3OSwiZXhwIjoyMDUyMzgyMzc5fQ.aHAyAGaKzs4RP6-hbbwKWsCqJ2xcwDOex1gnTFH_0fI';

// SQL migration to apply
const sql = `
-- Add use_age_increments and age_increments columns to care_plan_entries table
ALTER TABLE care_plan_entries
ADD COLUMN IF NOT EXISTS use_age_increments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS age_increments TEXT;

-- Update the types.ts file to include the new columns
COMMENT ON TABLE care_plan_entries IS 'Table for storing care plan entries with age increment support';
COMMENT ON COLUMN care_plan_entries.use_age_increments IS 'Flag to indicate if this entry uses age increments';
COMMENT ON COLUMN care_plan_entries.age_increments IS 'JSON string containing age increment data';
`;

// Create a simple function to directly execute SQL
async function executeSql() {
  console.log('Starting migration process...');
  
  try {
    // Create Supabase client with service role key
    console.log('Creating Supabase client...');
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    console.log('Supabase client created');
    
    // First, check if we can connect to the database
    console.log('Testing connection by querying care_plan_entries table...');
    const { data: testData, error: testError } = await supabase
      .from('care_plan_entries')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Error connecting to database:', testError);
      return;
    }
    
    console.log('Successfully connected to database');
    console.log('Sample data:', testData);
    
    // Try to execute the SQL directly using the SQL API
    console.log('Attempting to execute SQL migration...');
    
    // Method 1: Try using the SQL API
    try {
      const { data, error } = await supabase.rpc('pgexec', { sql });
      
      if (error) {
        console.error('Error executing SQL via pgexec:', error);
      } else {
        console.log('Migration successful via pgexec!');
        return;
      }
    } catch (err) {
      console.error('Exception with pgexec method:', err);
    }
    
    // Method 2: Try using direct SQL execution
    try {
      console.log('Trying alternative method...');
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) {
        console.error('Error executing SQL via exec_sql:', error);
      } else {
        console.log('Migration successful via exec_sql!');
        return;
      }
    } catch (err) {
      console.error('Exception with exec_sql method:', err);
    }
    
    // Method 3: Try using the REST API
    try {
      console.log('Trying REST API method...');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: sql })
      });
      
      const result = await response.json();
      console.log('REST API response:', result);
      
      if (response.ok) {
        console.log('Migration successful via REST API!');
      } else {
        console.error('Error with REST API method:', result);
      }
    } catch (err) {
      console.error('Exception with REST API method:', err);
    }
    
    console.log('\nIf all methods failed, please run the following SQL in the Supabase dashboard SQL editor:');
    console.log(sql);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute the function
executeSql().catch(err => {
  console.error('Fatal error:', err);
});
