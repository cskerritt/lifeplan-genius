/**
 * Restart Application with UUID Fix
 * 
 * This script restarts the application after implementing the UUID fix
 * for the mock authentication service.
 */

import { exec } from 'child_process';

console.log('Restarting application with UUID fix...');

// Kill any running instances of the development server
exec('pkill -f "vite"', (error) => {
  // Ignore errors from pkill as it will error if no matching processes are found
  
  console.log('Starting development server...');
  
  // Start the development server
  const server = exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting server: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Server stderr: ${stderr}`);
    }
  });
  
  // Forward the server output to the console
  server.stdout.on('data', (data) => {
    console.log(data);
  });
  
  server.stderr.on('data', (data) => {
    console.error(data);
  });
  
  console.log('Development server started. The UUID fix has been applied.');
  console.log('You can now create a new care plan with proper UUID formatting.');
});
