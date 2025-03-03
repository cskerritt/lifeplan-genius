#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Opening the application in the browser...');

// Determine the command to open a URL based on the platform
const openCommand = process.platform === 'win32' ? 'start' :
                   process.platform === 'darwin' ? 'open' : 'xdg-open';

// Execute the command to open the browser
try {
  const command = `${openCommand} http://localhost:8080`;
  console.log(`Executing: ${command}`);
  execSync(command);
  console.log('Application opened in browser.');
  console.log('The application should now have:');
  console.log('1. Correct cost calculations for CPT code "99214"');
  console.log('2. Immediate UI refresh when items are deleted');
} catch (error) {
  console.error('Error opening browser:', error);
  console.log('Please manually open http://localhost:8080 in your browser.');
}
