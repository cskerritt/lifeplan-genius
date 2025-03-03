// This script restarts the application after applying the cost columns migration
import { exec } from 'child_process';

console.log('Restarting the application after cost columns migration...');

// Kill any running instances of the app
exec('pkill -f "node.*vite"', (error) => {
  // Ignore errors from pkill as it might not find any processes to kill
  
  // Start the app
  const child = exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error restarting app: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });

  // Forward the output to the console
  child.stdout.on('data', (data) => {
    console.log(data);
  });

  child.stderr.on('data', (data) => {
    console.error(data);
  });

  console.log('Application restart initiated. The app should be available in a few moments.');
  console.log('');
  console.log('VERIFICATION STEPS:');
  console.log('1. Navigate to the application in your browser');
  console.log('2. Create a new care plan entry with decimal cost values');
  console.log('3. Verify that the entry is saved successfully without errors');
  console.log('4. Check the console logs to confirm no "invalid input syntax for type integer" errors');
});
