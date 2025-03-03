// This script restarts the application with the updated calculation components
// It ensures that the changes to ItemCalculationDetails, CategoryCalculationBreakdown, 
// and PlanCalculationSummary are properly loaded

const { exec } = require('child_process');
const path = require('path');

console.log('Restarting application with updated calculation components...');

// Get the current working directory
const cwd = process.cwd();

// Run the development server
const command = 'npm run dev';

console.log(`Executing command: ${command}`);
console.log('This will restart the application with the updated calculation components');
console.log('The changes include:');
console.log('1. Fixed ItemCalculationDetails to properly handle and display fee schedule data');
console.log('2. Updated CategoryCalculationBreakdown to correctly process and display category totals');
console.log('3. Improved PlanCalculationSummary to ensure consistent calculation methodology');
console.log('4. Added better validation for numeric values and handling of edge cases');
console.log('5. Fixed NaN display issues in calculation details');

// Execute the command
const childProcess = exec(command, { cwd });

// Forward stdout and stderr to the console
childProcess.stdout.on('data', (data) => {
  console.log(data);
});

childProcess.stderr.on('data', (data) => {
  console.error(data);
});

// Handle process exit
childProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('Application restarted successfully with updated calculation components');
  } else {
    console.error(`Application restart failed with code ${code}`);
  }
});
