/**
 * Test Foreign Key Bypass Fix
 * 
 * This script helps test the foreign key bypass fix by opening a browser window
 * and guiding the user through the process of creating a care plan.
 */

import { spawn } from 'child_process';
import open from 'open';

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
console.log(`${colors.bgBlue}${colors.white}${colors.bright} TESTING FOREIGN KEY BYPASS FIX ${colors.reset}`);
console.log(`${colors.cyan}This script helps test the foreign key bypass fix by opening a browser window${colors.reset}`);
console.log(`${colors.cyan}and guiding you through the process of creating a care plan.${colors.reset}`);
console.log();

// Check if the application is running
console.log(`${colors.yellow}Checking if the application is running...${colors.reset}`);

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i:${port} | grep LISTEN`;
    
    const check = spawn(process.platform === 'win32' ? 'cmd.exe' : 'sh', 
                        process.platform === 'win32' ? ['/c', command] : ['-c', command]);
    
    let output = '';
    check.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    check.on('close', (code) => {
      resolve(output.trim().length > 0);
    });
  });
};

// Main function
const main = async () => {
  // Check if the application is running
  const isRunning = await isPortInUse(8080);
  
  if (!isRunning) {
    console.log(`${colors.red}The application is not running on port 8080.${colors.reset}`);
    console.log(`${colors.yellow}Please start the application first with:${colors.reset}`);
    console.log(`${colors.bright}node restart_app_with_fk_bypass.js${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}The application is running on port 8080.${colors.reset}`);
  
  // Open the browser
  console.log(`${colors.yellow}Opening the browser...${colors.reset}`);
  await open('http://localhost:8080');
  
  // Print instructions
  console.log();
  console.log(`${colors.green}${colors.bright}Testing Instructions:${colors.reset}`);
  console.log();
  console.log(`${colors.cyan}1. Sign in with any email and password${colors.reset}`);
  console.log(`${colors.cyan}2. Click on the "New Plan" button${colors.reset}`);
  console.log(`${colors.cyan}3. Fill out the form with the following information:${colors.reset}`);
  console.log(`   ${colors.bright}First Name:${colors.reset} John`);
  console.log(`   ${colors.bright}Last Name:${colors.reset} Doe`);
  console.log(`   ${colors.bright}Date of Birth:${colors.reset} 01/01/1980`);
  console.log(`   ${colors.bright}Date of Injury:${colors.reset} 01/01/2020`);
  console.log(`   ${colors.bright}Gender:${colors.reset} Male`);
  console.log(`   ${colors.bright}ZIP Code:${colors.reset} 12345`);
  console.log(`${colors.cyan}4. Click on the "Demographics & Factors" tab${colors.reset}`);
  console.log(`${colors.cyan}5. Click on the "Save" button${colors.reset}`);
  console.log();
  console.log(`${colors.yellow}${colors.bright}Important:${colors.reset} ${colors.yellow}Open the browser console (F12 or right-click > Inspect > Console)${colors.reset}`);
  console.log(`${colors.yellow}to see if the foreign key bypass fix is working.${colors.reset}`);
  console.log();
  console.log(`${colors.green}If the fix is working, you should see:${colors.reset}`);
  console.log(`${colors.bright}1. A debug log message like:${colors.reset}`);
  console.log(`   ${colors.dim}[DB DEBUG] Replacing invalid UUID "mock-user-id" with a valid one for development mode${colors.reset}`);
  console.log(`${colors.bright}2. No errors about invalid UUID format${colors.reset}`);
  console.log(`${colors.bright}3. The care plan should be created successfully${colors.reset}`);
  console.log();
  console.log(`${colors.red}If you still see errors, check the FOREIGN_KEY_BYPASS_DOCUMENTATION.md file for troubleshooting.${colors.reset}`);
};

// Run the main function
main().catch(console.error);
