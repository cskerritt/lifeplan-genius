#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Restarting application with UI refresh fix...');

// Kill any existing processes on port 8080
try {
  console.log('Killing any processes on port 8080...');
  execSync('npx kill-port 8080');
  console.log('Successfully killed processes on port 8080');
} catch (error) {
  console.log('No processes found on port 8080 or error killing processes:', error.message);
}

// Start the development server
try {
  console.log('Starting development server...');
  
  // Use spawn to start the server in the background
  const { spawn } = await import('child_process');
  
  // Start the development server
  const server = spawn('npm', ['run', 'dev'], {
    detached: true,
    stdio: 'ignore',
    shell: true
  });
  
  // Unref the child process so it can run independently
  server.unref();
  
  console.log('Development server started in the background');
  console.log('The application should now have immediate UI refresh when items are deleted');
  
  // Wait a moment for the server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('You can now open the application in your browser at http://localhost:8080');
  
} catch (error) {
  console.error('Error starting development server:', error);
  process.exit(1);
}
