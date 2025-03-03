/**
 * Open the application in a browser to verify the CPT code lookup fix
 * 
 * This script opens the application in a browser to verify that the
 * summary table now correctly displays cost values instead of $0.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Wait for the application to start
setTimeout(() => {
  // Open the application in the default browser
  console.log('Opening application in browser...');
  
  // Use the appropriate command based on the operating system
  const command = process.platform === 'win32' ? 'start' : 
                 process.platform === 'darwin' ? 'open' : 'xdg-open';
  
  const url = 'http://localhost:8081';
  
  const browser = spawn(command, [url], {
    stdio: 'inherit',
    shell: true
  });
  
  browser.on('close', (code) => {
    console.log(`Browser process exited with code ${code}`);
  });
}, 5000); // Wait 5 seconds for the application to start
