// This script restarts the app with the updated one-time GAF display fix
import { exec } from 'child_process';

console.log('Restarting the app with the updated one-time GAF display fix...');

// Run the app
exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error restarting app: ${error.message}`);
    return;
  }
  
  console.log('App restarted successfully!');
  console.log('You can now test the one-time GAF display fix in the UI.');
  console.log('The fix ensures that one-time items display different values for low, average, and high costs when GAF adjustments are applied.');
  console.log('\nChanges made:');
  console.log('1. Modified ItemCalculationDetails.tsx to recalculate cost range for one-time items based on MFR and PFR data with GAF adjustments');
  console.log('2. Added debugging information to help identify if GAF adjustments are being applied correctly');
  
  // The app is now running, so this script will continue running until the user terminates it
});
