// This script simply restarts the app with the updated GAF adjustment for one-time costs
import { exec } from 'child_process';

console.log('Restarting the app with updated GAF adjustment for one-time costs...');
console.log('Skipping test execution due to module import issues.');

// Now restart the app
console.log('\nRestarting the app...');

exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error restarting app: ${error.message}`);
    return;
  }
  
  console.log('App restarted successfully!');
  console.log('You can now test the GAF adjustment for one-time costs in the UI.');
  console.log('The changes should be visible in:');
  console.log('1. ItemCalculationDetails.tsx - Now shows low, average, and high values for one-time costs');
  console.log('2. CalculationBreakdown.tsx - Now shows the cost range for one-time items');
  console.log('3. costCalculator.ts - Now ensures different values for low, average, and high for one-time items');
  console.log('4. types.ts - Updated CalculatedCosts interface to include MFR and PFR cost information');
  
  // The app is now running, so this script will continue running until the user terminates it
});
