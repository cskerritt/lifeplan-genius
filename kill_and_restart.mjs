#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Killing any existing processes...');

// Kill any processes using port 3002 (API server)
try {
  console.log('Killing any processes using port 3002...');
  const result = execSync('lsof -ti:3002 | xargs kill -9 || true');
  console.log('Successfully killed processes on port 3002');
} catch (error) {
  console.log('No processes found on port 3002 or error killing processes');
}

// Kill any processes using ports 3003-3010 (potential alternative API server ports)
try {
  console.log('Killing any processes using ports 3003-3010...');
  const result = execSync('lsof -ti:3003,3004,3005,3006,3007,3008,3009,3010 | xargs kill -9 || true');
  console.log('Successfully killed processes on alternative API ports');
} catch (error) {
  console.log('No processes found on alternative API ports or error killing processes');
}

// Kill any processes using port 8080 or 8081 (Vite dev server)
try {
  console.log('Killing any processes using port 8080 or 8081...');
  const result = execSync('lsof -ti:8080,8081 | xargs kill -9 || true');
  console.log('Successfully killed processes on ports 8080 and 8081');
} catch (error) {
  console.log('No processes found on ports 8080/8081 or error killing processes');
}

// Wait a moment for processes to terminate
console.log('Waiting for processes to terminate...');
await new Promise(resolve => setTimeout(resolve, 3000));

// Start the development server
try {
  console.log('Starting the application...');
  
  // Use spawn to start the server in the background
  const { spawn } = await import('child_process');
  
  // Start the development server with both frontend and API
  const server = spawn('npm', ['run', 'dev:all'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle server exit
  server.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Error executing command: npm run dev:all`);
      console.error(`Command failed: npm run dev:all`);
      process.exit(code);
    }
  });
  
  // Keep the script running until the server is terminated
  process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit(0);
  });
  
} catch (error) {
  console.error('Error starting development server:', error);
  process.exit(1);
}
