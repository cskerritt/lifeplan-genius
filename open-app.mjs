/**
 * Open Application in Browser
 * 
 * This script opens the application in the default browser.
 * This version uses ES module syntax.
 */

import { exec } from 'child_process';

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Print a header
console.log(`${colors.bgBlue}${colors.white}${colors.bright} OPENING APPLICATION IN BROWSER ${colors.reset}`);
console.log(`${colors.cyan}This script opens the application in the default browser.${colors.reset}`);
console.log();

// Determine the command to open the browser based on the platform
let command;
switch (process.platform) {
  case 'darwin':
    command = 'open';
    break;
  case 'win32':
    command = 'start';
    break;
  default:
    command = 'xdg-open';
    break;
}

// Open the application in the browser
const url = 'http://localhost:8080';
console.log(`${colors.yellow}Opening ${url} in the default browser...${colors.reset}`);

exec(`${command} ${url}`, (error) => {
  if (error) {
    console.error(`${colors.red}Error opening browser: ${error.message}${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}Browser opened successfully.${colors.reset}`);
  console.log();
  console.log(`${colors.bright}Testing Instructions:${colors.reset}`);
  console.log();
  console.log(`1. Sign in with any email and password`);
  console.log();
  console.log(`2. Click on the "New Plan" button`);
  console.log();
  console.log(`3. Fill out the form with the following information:`);
  console.log(`   First Name: John`);
  console.log(`   Last Name: Doe`);
  console.log(`   Date of Birth: 01/01/1980`);
  console.log(`   Date of Injury: 01/01/2020`);
  console.log(`   Gender: Male`);
  console.log(`   ZIP Code: 12345`);
  console.log();
  console.log(`4. Click on the "Demographics & Factors" tab`);
  console.log();
  console.log(`5. Click on the "Save" button`);
  console.log();
  console.log(`${colors.bright}Important:${colors.reset} Open the browser console (F12 or right-click > Inspect > Console)`);
  console.log(`to see if the foreign key bypass fix is working.`);
  console.log();
  console.log(`If the fix is working, you should see:`);
  console.log(`1. A debug log message like:`);
  console.log(`   ${colors.green}[DB DEBUG] Replacing invalid UUID "mock-user-id" with a valid one for development mode${colors.reset}`);
  console.log(`2. No errors about invalid UUID format`);
  console.log(`3. The care plan should be created successfully`);
});
