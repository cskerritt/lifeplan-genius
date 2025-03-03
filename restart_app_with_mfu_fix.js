// This script restarts the application with the MFU/MFR field name fix
// The fix changes references from mfr_50th, mfr_75th, mfr_90th to mfu_50th, mfu_75th, mfu_90th
// to ensure consistency with the database schema

import { exec } from 'child_process';

console.log('Restarting application with MFU/MFR field name fix...');

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
