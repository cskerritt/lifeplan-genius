// This script restarts the application with the updated cost range calculation
// The fix ensures that:
// 1. Both MFU and PFR values are used in the cost range display
// 2. The order is low, high, then average (with average calculated from low and high)
// 3. Only 50th and 75th percentiles are used (not 90th)

import { exec } from 'child_process';

console.log('Restarting application with updated cost range calculation...');

// Run the application
exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});
