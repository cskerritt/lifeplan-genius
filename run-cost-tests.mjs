#!/usr/bin/env node

/**
 * Comprehensive Cost Calculation Test Runner
 * 
 * This script runs all the cost calculation tests and generates a comprehensive report.
 * It helps identify patterns in $0 output issues and provides detailed debugging information.
 * 
 * Usage:
 * node run-cost-tests.mjs [options]
 * 
 * Options:
 *   --verbose       Enable verbose logging
 *   --export        Export logs to a JSON file
 *   --mock-only     Only run the mock tests
 *   --actual-only   Only run the actual tests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose'),
  exportLogs: args.includes('--export'),
  mockOnly: args.includes('--mock-only'),
  actualOnly: args.includes('--actual-only')
};

// Configure colors for console output
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
  white: '\x1b[37m'
};

// Print header
console.log(`\n${colors.bright}${colors.blue}====================================${colors.reset}`);
console.log(`${colors.bright}${colors.blue}  Cost Calculation Test Runner${colors.reset}`);
console.log(`${colors.bright}${colors.blue}====================================${colors.reset}\n`);

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Get current timestamp for filenames
const timestamp = new Date().toISOString().replace(/:/g, '-');

/**
 * Run a command and return its output
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.cyan}Running: ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Run all the tests
 */
async function runTests() {
  console.log(`${colors.bright}Running cost calculation tests...${colors.reset}\n`);
  
  try {
    // Run mock tests
    if (!options.actualOnly) {
      console.log(`\n${colors.bright}${colors.green}Running mock tests...${colors.reset}\n`);
      
      const mockArgs = ['debug-cost-calculations.mjs', '--all'];
      if (options.verbose) mockArgs.push('--verbose');
      if (options.exportLogs) mockArgs.push('--export');
      
      await runCommand('node', mockArgs);
    }
    
    // Run actual tests
    if (!options.mockOnly) {
      console.log(`\n${colors.bright}${colors.green}Running actual tests...${colors.reset}\n`);
      
      const actualArgs = ['test-actual-cost-calculations.mjs', '--all'];
      if (options.verbose) actualArgs.push('--verbose');
      if (options.exportLogs) actualArgs.push('--export');
      
      await runCommand('node', actualArgs);
    }
    
    // Collect and analyze results
    console.log(`\n${colors.bright}${colors.green}Analyzing results...${colors.reset}\n`);
    
    // Look for any JSON files created by the tests
    const jsonFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.json') && 
        (file.includes('calculation-debug') || 
         file.includes('calculation-results')));
    
    if (jsonFiles.length > 0) {
      // Create a directory for this test run
      const runDir = path.join(resultsDir, `run-${timestamp}`);
      if (!fs.existsSync(runDir)) {
        fs.mkdirSync(runDir);
      }
      
      // Move all JSON files to the run directory
      jsonFiles.forEach(file => {
        const oldPath = path.join(__dirname, file);
        const newPath = path.join(runDir, file);
        fs.renameSync(oldPath, newPath);
        console.log(`Moved ${file} to ${runDir}`);
      });
      
      // Generate a summary report
      const summaryPath = path.join(runDir, 'summary.md');
      let summaryContent = `# Cost Calculation Test Summary\n\n`;
      summaryContent += `Run Date: ${new Date().toISOString()}\n\n`;
      
      // Add information about the test files
      summaryContent += `## Test Files\n\n`;
      jsonFiles.forEach(file => {
        summaryContent += `- ${file}\n`;
      });
      
      // Try to extract zero value information
      summaryContent += `\n## Zero Value Analysis\n\n`;
      
      let totalZeroValues = 0;
      let zeroValuesByField = {};
      
      jsonFiles.forEach(file => {
        if (file.includes('debug')) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(runDir, file), 'utf8'));
            if (data.zeroValues) {
              totalZeroValues += data.zeroValues.length;
              
              // Count by field
              data.zeroValues.forEach(entry => {
                const field = entry.message.split('in ')[1]?.split(':')[0] || 'unknown';
                zeroValuesByField[field] = (zeroValuesByField[field] || 0) + 1;
              });
            }
          } catch (error) {
            console.error(`Error parsing ${file}: ${error.message}`);
          }
        }
      });
      
      summaryContent += `Total zero values detected: ${totalZeroValues}\n\n`;
      
      if (Object.keys(zeroValuesByField).length > 0) {
        summaryContent += `### Zero Values by Field\n\n`;
        for (const [field, count] of Object.entries(zeroValuesByField)) {
          summaryContent += `- ${field}: ${count}\n`;
        }
      }
      
      // Write the summary file
      fs.writeFileSync(summaryPath, summaryContent);
      console.log(`${colors.green}Summary report written to ${summaryPath}${colors.reset}`);
      
      // Print the summary to the console
      console.log(`\n${colors.bright}${colors.blue}Test Summary:${colors.reset}\n`);
      console.log(summaryContent);
    } else {
      console.log(`${colors.yellow}No result files found. Make sure to use the --export option.${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}${colors.green}All tests completed successfully!${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});
