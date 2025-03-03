#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { exec } from 'child_process';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to open a URL in the default browser
function openBrowser(url) {
  let command;
  
  switch (process.platform) {
    case 'darwin': // macOS
      command = `open "${url}"`;
      break;
    case 'win32': // Windows
      command = `start "${url}"`;
      break;
    default: // Linux and others
      command = `xdg-open "${url}"`;
      break;
  }
  
  console.log(`Opening browser at: ${url}`);
  
  return new Promise((resolve, reject) => {
    exec(command, (error) => {
      if (error) {
        console.error('Error opening browser:', error);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  try {
    console.log('Opening application with calculation visualizer...');
    
    // Open the application in the browser
    await openBrowser('http://localhost:8080');
    
    console.log('\nApplication opened in browser!');
    console.log('\nTo use the new calculation visualization features:');
    console.log('1. Click on "Calculation Details" for any item');
    console.log('2. Switch to the "Interactive View" tab');
    console.log('3. Explore the live calculation visualization');
    console.log('\nNote: Make sure the application is running with:');
    console.log('./restart_app_with_calculation_visualizer.mjs');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
