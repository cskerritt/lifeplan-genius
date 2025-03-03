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
  console.log('Application opened in browser. You should now see the application with the UI refresh fix applied.');
  console.log('The UI should now refresh immediately when items are deleted, without requiring a manual reload.');
} catch (error) {
  console.error('Error opening browser:', error);
  console.log('Please manually open http://localhost:8080 in your browser.');
}
