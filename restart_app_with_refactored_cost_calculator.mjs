#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

async function main() {
  try {
    console.log('Restarting application with refactored cost calculator...');
    
    // Kill any running instances of the app
    try {
      await runCommand('pkill', ['-f', 'node.*vite']);
      console.log('Killed existing application instances');
    } catch (error) {
      console.log('No existing application instances to kill');
    }
    
    // Start the application
    console.log('Starting application...');
    await runCommand('npm', ['run', 'dev']);
    
    console.log('\nApplication started with refactored cost calculator!');
    console.log('\nThe refactored code includes:');
    console.log('1. Strategy pattern for different calculation types');
    console.log('2. Extracted common utilities to reduce duplication');
    console.log('3. Standardized error handling');
    console.log('4. Improved test coverage');
    console.log('5. Better separation of concerns');
    console.log('\nSee COST_CALCULATION_REFACTORING.md for more details.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
