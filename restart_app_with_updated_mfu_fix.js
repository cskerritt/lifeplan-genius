// This script restarts the application with the updated MFU/MFR field name fix
// The fix ensures consistent use of mfu_* fields for Medicare fee values

import { exec } from 'child_process';

console.log('Restarting application with updated MFU/MFR field name fix...');

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
