#!/usr/bin/env node

/**
 * Restart App with Fixed Cost Calculation
 * 
 * This script restarts the application with the fixed cost calculation code.
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(colors.bright + colors.cyan + '='.repeat(80) + colors.reset);
console.log(colors.bright + colors.cyan + ' Restarting App with Fixed Cost Calculation' + colors.reset);
console.log(colors.bright + colors.cyan + '='.repeat(80) + colors.reset);

console.log(colors.blue + 'The following files have been fixed:' + colors.reset);
console.log('  - src/utils/calculations/services/cptCodeService.ts');
console.log('  - src/utils/calculations/services/geoFactorsService.ts');
console.log('  - src/utils/calculations/services/adjustedCostService.ts');
console.log('  - src/hooks/usePlanItemCosts.ts');

console.log(colors.blue + '\nChanges made:' + colors.reset);
console.log('  1. Fixed syntax errors in cptCodeService.ts');
console.log('  2. Removed duplicate code and improved fallback mechanisms');
console.log('  3. Fixed indentation issues in all services');
console.log('  4. Enhanced error handling and validation in usePlanItemCosts.ts');
console.log('  5. Ensured costs are never zero or NaN in the calculation flow');

try {
  // Kill any running processes on port 3000
  console.log(colors.blue + '\nKilling any processes on port 3000...' + colors.reset);
  try {
    execSync('npx kill-port 3000');
    console.log(colors.green + 'Successfully killed processes on port 3000' + colors.reset);
  } catch (error) {
    console.log(colors.yellow + 'No processes found on port 3000' + colors.reset);
  }
  
  // Kill any running processes on port 3004 (API server)
  console.log(colors.blue + 'Killing any processes on port 3004...' + colors.reset);
  try {
    execSync('npx kill-port 3004');
    console.log(colors.green + 'Successfully killed processes on port 3004' + colors.reset);
  } catch (error) {
    console.log(colors.yellow + 'No processes found on port 3004' + colors.reset);
  }
  
  // Start the development server
  console.log(colors.blue + '\nStarting development server...' + colors.reset);
  console.log(colors.yellow + 'This will start both the frontend and API server using npm run dev:all' + colors.reset);
  console.log(colors.yellow + 'Check the console for any errors during startup' + colors.reset);
  
  execSync('npm run dev:all', { stdio: 'inherit' });
} catch (error) {
  console.error(colors.red + 'Error restarting app:' + colors.reset, error);
  process.exit(1);
}