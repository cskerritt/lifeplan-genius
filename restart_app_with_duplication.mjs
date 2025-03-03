// This script restarts the app with the new item duplication functionality
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting development server with item duplication functionality...');

// Start the development server
const devProcess = exec('npm run dev', { cwd: __dirname });

devProcess.stdout.on('data', (data) => {
  console.log(data);
  
  // When the server is ready, open the browser
  if (data.includes('Local:') || data.includes('ready in')) {
    console.log('Development server is running. Opening browser...');
    exec('open http://localhost:5173');
  }
});

devProcess.stderr.on('data', (data) => {
  console.error(data);
});

devProcess.on('close', (code) => {
  console.log(`Development server process exited with code ${code}`);
});

console.log('Item duplication feature has been implemented!');
console.log('See ITEM_DUPLICATION_FEATURE.md for documentation on how to use this feature.');
