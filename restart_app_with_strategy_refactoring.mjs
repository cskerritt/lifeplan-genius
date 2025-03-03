/**
 * Restart the application with the refactored strategy pattern implementation
 * 
 * This script restarts the application after the strategy pattern refactoring
 * that introduces a base strategy class and refactors the concrete strategies
 * to extend it.
 */

import { exec } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Verify that the refactored files exist
const baseCostCalculationStrategyPath = resolve(__dirname, 'src/utils/calculations/strategies/baseCostCalculationStrategy.ts');
const oneTimeCostStrategyPath = resolve(__dirname, 'src/utils/calculations/strategies/oneTimeCostStrategy.ts');
const recurringCostStrategyPath = resolve(__dirname, 'src/utils/calculations/strategies/recurringCostStrategy.ts');
const ageIncrementCostStrategyPath = resolve(__dirname, 'src/utils/calculations/strategies/ageIncrementCostStrategy.ts');

// Check if all files exist
const allFilesExist = 
  fs.existsSync(baseCostCalculationStrategyPath) &&
  fs.existsSync(oneTimeCostStrategyPath) &&
  fs.existsSync(recurringCostStrategyPath) &&
  fs.existsSync(ageIncrementCostStrategyPath);

if (!allFilesExist) {
  console.error('Error: One or more refactored strategy files are missing.');
  process.exit(1);
}

console.log('Restarting application with refactored strategy pattern...');
console.log('All refactored strategy files exist.');

// Kill any running instances of the app
exec('pkill -f "node.*vite"', (error) => {
  // Ignore errors from pkill (it will error if no processes are found)
  
  // Start the development server
  const devProcess = exec('npm run dev', {
    cwd: resolve(__dirname),
  });
  
  devProcess.stdout.on('data', (data) => {
    console.log(data);
    
    // If the server is ready, open the app in a browser
    if (data.includes('Local:') && data.includes('http://localhost')) {
      console.log('Development server is ready');
      console.log('Strategy pattern refactoring has been applied');
      console.log('The following changes were made:');
      console.log('1. Created BaseCostCalculationStrategy abstract class');
      console.log('2. Refactored OneTimeCostStrategy to extend the base class');
      console.log('3. Refactored RecurringCostStrategy to extend the base class');
      console.log('4. Refactored AgeIncrementCostStrategy to extend the base class');
      console.log('5. Created documentation in STRATEGY_REFACTORING_DOCUMENTATION.md');
      console.log('\nSee STRATEGY_REFACTORING_DOCUMENTATION.md for more details');
    }
  });
  
  devProcess.stderr.on('data', (data) => {
    console.error(data);
  });
});
