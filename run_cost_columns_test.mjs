// This script runs the cost columns test and displays the results
import { exec } from 'child_process';

console.log('Running cost columns test...');

// Execute the test script
exec('node test_cost_columns_fix.mjs', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running test: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  
  // Display the test output
  console.log(stdout);
  
  // Check if the test passed
  if (stdout.includes('TEST PASSED')) {
    console.log('\n✅ TEST PASSED: The cost columns now accept decimal values.');
    console.log('The migration has been successfully applied.');
  } else {
    console.log('\n❌ TEST FAILED: The cost columns may not be accepting decimal values.');
    console.log('Please check the migration status and try again.');
  }
});
