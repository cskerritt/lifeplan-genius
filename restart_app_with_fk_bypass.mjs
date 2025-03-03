/**
 * Restart Application with Foreign Key Bypass Fix
 * 
 * This script restarts the application with the foreign key bypass fix.
 * It sets the environment to development mode to ensure the bypass logic is active.
 * This version uses ES module syntax.
 */

import { spawn } from 'child_process';

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
console.log(`${colors.bgBlue}${colors.white}${colors.bright} RESTARTING APPLICATION WITH FOREIGN KEY BYPASS FIX ${colors.reset}`);
console.log(`${colors.cyan}This script will restart the application with the foreign key bypass fix.${colors.reset}`);
console.log(`${colors.cyan}The fix bypasses foreign key constraints in development mode.${colors.reset}`);
console.log();

// Ensure we're in development mode
process.env.NODE_ENV = 'development';
process.env.VITE_APP_ENV = 'development';

// Kill any running processes on port 8080
console.log(`${colors.yellow}Stopping any running processes on port 8080...${colors.reset}`);

let killCommand;
if (process.platform === 'win32') {
  // Windows
  killCommand = spawn('cmd.exe', ['/c', 'for /f "tokens=5" %a in (\'netstat -aon ^| findstr :8080\') do taskkill /F /PID %a']);
} else {
  // macOS/Linux
  killCommand = spawn('sh', ['-c', 'lsof -ti:8080 | xargs kill -9 || true']);
}

killCommand.on('close', (code) => {
  console.log(`${colors.green}Port 8080 is now available.${colors.reset}`);
  
  // Start the application with the development environment
  console.log(`${colors.yellow}Starting application in development mode...${colors.reset}`);
  
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  // Set environment variables to ensure development mode
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_APP_ENV: 'development'
  };
  
  const devProcess = spawn(npmCommand, ['run', 'dev'], {
    env,
    stdio: 'inherit'
  });
  
  devProcess.on('error', (error) => {
    console.error(`${colors.red}Error starting application:${colors.reset}`, error);
  });
  
  // Print instructions
  console.log();
  console.log(`${colors.green}${colors.bright}Application is starting in development mode with foreign key bypass enabled.${colors.reset}`);
  console.log(`${colors.cyan}You can now create care plans without foreign key constraint errors.${colors.reset}`);
  console.log(`${colors.cyan}The application will be available at:${colors.reset} ${colors.bright}http://localhost:8080${colors.reset}`);
  console.log();
  console.log(`${colors.yellow}Note: This is a development-only fix. In production, proper foreign key relationships should be maintained.${colors.reset}`);
});
