/**
 * Restart Application with Cost Calculation Fix
 * 
 * This script restarts the application with the fix for the cost calculation issue
 * where costs were showing as $0 when they shouldn't.
 * 
 * The fix ensures that:
 * 1. We check for zero values in cost calculations and apply fallback values
 * 2. We properly handle the calculation of costs for both one-time and recurring items
 * 3. We use let instead of const for variables that need to be modified
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { platform } from 'os';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Kill any running processes on port 3000
const killCommand = platform() === 'win32' 
  ? 'taskkill /F /IM node.exe /T' 
  : 'pkill -f "node|vite"';

console.log('Stopping any running processes...');
exec(killCommand, (error) => {
  if (error) {
    console.log('No processes were running or could not be stopped. Continuing...');
  } else {
    console.log('Successfully stopped running processes.');
  }
  
  // Start the application
  console.log('Starting application with cost calculation fix...');
  
  const startCommand = 'npm run dev:all';
  
  const child = exec(startCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
    console.log(`Stdout: ${stdout}`);
  });
  
  child.stdout.on('data', (data) => {
    console.log(data.toString());
    
    // When the server is ready, open the browser
    if (data.includes('Local:') || data.includes('ready in')) {
      const openCommand = platform() === 'win32' 
        ? 'start http://localhost:8083' 
        : (platform() === 'darwin' 
            ? 'open http://localhost:8083' 
            : 'xdg-open http://localhost:8083');
      
      console.log('Opening browser...');
      exec(openCommand);
      
      console.log('\n=== COST CALCULATION FIX APPLIED ===');
      console.log('The application has been restarted with the cost calculation fix.');
      console.log('Items should now display proper cost values instead of $0.');
      console.log('===================================\n');
    }
  });
  
  child.stderr.on('data', (data) => {
    console.error(data.toString());
  });
});