/**
 * Restart Application with UUID Fix
 * 
 * This script restarts the application after implementing the UUID fix
 * for the mock authentication service. It uses ES module syntax.
 */

import { spawn } from 'child_process';

console.log('Restarting application with UUID fix...');

// Kill any running instances of the development server
const killProcess = spawn('pkill', ['-f', 'vite']);

killProcess.on('close', () => {
  console.log('Starting development server...');
  
  // Set environment variables to ensure development mode
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_APP_ENV: 'development'
  };
  
  // Start the development server
  const server = spawn('npm', ['run', 'dev'], {
    env,
    stdio: 'inherit'
  });
  
  console.log('Development server started. The UUID fix has been applied.');
  console.log('You can now create a new care plan with proper UUID formatting.');
});
