// Script to test connection to Supabase using service role key
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get the Supabase URL and service role key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  console.error('Please check your .env file and ensure both variables are set correctly.');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to test connection to Supabase
async function testConnection() {
  console.log('Testing connection to Supabase...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('Service Role Key: [REDACTED]');
  
  try {
    // Try to get the server timestamp
    const { data, error } = await supabase.rpc('get_server_timestamp');
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      
      // Try a different approach if the RPC function doesn't exist
      console.log('\nTrying alternative approach...');
      const { data: tableData, error: tableError } = await supabase
        .from('care_plan_entries')
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.error('Error connecting to Supabase:', tableError);
        console.log('\n❌ Connection test failed');
        console.log('\nPossible issues:');
        console.log('1. The service role key is incorrect');
        console.log('2. The Supabase URL is incorrect');
        console.log('3. The Supabase project is not accessible');
        return;
      }
      
      console.log('Successfully connected to Supabase!');
      console.log('\n✅ Connection test passed');
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log(`Server timestamp: ${data}`);
    console.log('\n✅ Connection test passed');
  } catch (error) {
    console.error('Error testing connection:', error);
    console.log('\n❌ Connection test failed');
  }
}

// Execute the function
testConnection();
