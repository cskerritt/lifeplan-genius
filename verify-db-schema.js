// Import the Supabase client directly from the application
import { supabase } from './src/integrations/supabase/client.js';

async function verifyColumnTypes() {
  console.log('Verifying database column types...');
  
  try {
    // Try an alternative approach with a test insert
    console.log('Testing with a sample insert...');
    
    // Insert a test record with decimal values
    const testId = 'test-' + Date.now();
    const { error: insertError } = await supabase
      .from('care_plan_entries')
      .insert({
        plan_id: '11111111-1111-1111-1111-111111111111', // Use a non-existent ID to cause FK error
        category: 'test',
        item: 'Test Item',
        annual_cost: 123.45,
        lifetime_cost: 678.90,
        start_age: 1,
        end_age: 2
      });
    
    if (insertError) {
      console.log('Insert test result:', insertError);
      
      // Check if the error is due to foreign key constraint (expected)
      // rather than data type mismatch (which would indicate the migration failed)
      if (insertError.message && insertError.message.includes('foreign key constraint')) {
        console.log('✅ Column types appear to be correct (numeric/decimal)');
        console.log('The error is due to foreign key constraint, not data type mismatch');
      } else if (insertError.message && (
                insertError.message.includes('invalid input syntax') || 
                insertError.message.includes('type integer'))) {
        console.log('❌ Column types are still INTEGER, not NUMERIC');
        console.log('Migration may have failed or not been applied');
      } else {
        console.log('⚠️ Unexpected error, unable to determine column types');
        console.log('Full error:', insertError);
      }
    } else {
      console.log('✅ Test insert succeeded with decimal values');
      
      // Clean up test record
      await supabase
        .from('care_plan_entries')
        .delete()
        .eq('id', testId);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Execute the verification
verifyColumnTypes(); 