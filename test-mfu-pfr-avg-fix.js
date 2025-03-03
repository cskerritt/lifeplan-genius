#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Function to run automated tests
async function runTests() {
  try {
    console.log('Running automated tests for MFU/PFR average factor fix...');
    
    // Check if Jest is installed
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasJest = packageJson.devDependencies && packageJson.devDependencies.jest;
    
    if (hasJest) {
      // Run Jest tests for the itemCostService
      await runCommand('npx', ['jest', '--testPathPattern=itemCostService']);
      console.log('Automated tests completed successfully!');
    } else {
      console.log('Jest not found in package.json, skipping automated tests');
    }
    
    return true;
  } catch (error) {
    console.error('Automated tests failed:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('Testing MFU/PFR average factor fix...');
    
    // First run automated tests if they exist
    const testsExist = fs.existsSync(path.join(__dirname, 'src/utils/calculations/__tests__/itemCostService.test.ts')) || 
                       fs.existsSync(path.join(__dirname, 'src/utils/calculations/__tests__/itemCostService.test.js'));
    let testsSucceeded = true;
    
    if (testsExist) {
      testsSucceeded = await runTests();
    } else {
      console.log('No automated tests found, skipping test phase');
    }
    
    // Open the application in the browser for manual verification
    if (testsSucceeded) {
      console.log('Opening application in browser for manual verification...');
      await runCommand('node', ['open-app-in-browser.mjs']);
      
      console.log('\nTest completed successfully!');
      console.log('\nVerify in the browser that:');
      console.log('1. The application loads without errors');
      console.log('2. Cost calculations are performed correctly with the average of MFU and PFR factors');
      console.log('3. Annual costs reflect the proper application of geographic adjustments');
      console.log('\nCheck the browser console for log messages showing:');
      console.log('- "Using average of MFU and PFR factors: [value]"');
      console.log('- "Combined costs with average geographic factor"');
      console.log('\nThe refactored code now uses the Strategy pattern for better maintainability:');
      console.log('- Common utilities have been extracted to reduce duplication');
      console.log('- Different calculation strategies handle different types of items');
      console.log('- Error handling has been standardized across the codebase');
    } else {
      console.error('Skipping manual verification due to test failures');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
