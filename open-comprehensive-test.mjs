#!/usr/bin/env node

/**
 * Opens the comprehensive cost calculation test in the default browser
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the HTML file
const htmlFilePath = path.join(__dirname, 'test-comprehensive-combinations.html');

// Check if the file exists
if (!fs.existsSync(htmlFilePath)) {
  console.error(`Error: File not found: ${htmlFilePath}`);
  process.exit(1);
}

// Convert the file path to a URL
const fileUrl = `file://${htmlFilePath}`;

// Determine the platform-specific command to open the browser
let command;
switch (process.platform) {
  case 'darwin': // macOS
    command = `open "${fileUrl}"`;
    break;
  case 'win32': // Windows
    command = `start "" "${fileUrl}"`;
    break;
  default: // Linux and others
    command = `xdg-open "${fileUrl}"`;
    break;
}

console.log('Opening comprehensive cost calculation test in browser...');

// Execute the command
exec(command, (error) => {
  if (error) {
    console.error(`Error opening browser: ${error.message}`);
    process.exit(1);
  }
  console.log('Test opened successfully!');
});
