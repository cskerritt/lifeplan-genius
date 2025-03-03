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
    console.log('Restarting application with calculation visualizer...');
    
    // Kill any running instances of the app
    try {
      await runCommand('pkill', ['-f', 'node.*vite']);
      console.log('Killed existing application instances');
    } catch (error) {
      console.log('No existing application instances to kill');
    }
    
    // Start the application with both frontend and API server
    console.log('Starting application with API server...');
    await runCommand('npm', ['run', 'dev:all']);
    
    console.log('\nApplication started with calculation visualizer!');
    console.log('\nNew features:');
    console.log('1. Interactive calculation visualization');
    console.log('2. Live step-by-step calculation display');
    console.log('3. Adjustable calculation parameters');
    console.log('4. Visual representation of calculation steps');
    console.log('\nTo use the new features:');
    console.log('1. Click on "Calculation Details" for any item');
    console.log('2. Switch to the "Interactive View" tab');
    console.log('3. Explore the live calculation visualization');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
