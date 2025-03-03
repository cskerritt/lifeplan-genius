// Restart the application with the manual cost fix
const { execSync } = require('child_process');

console.log('Stopping any running processes...');
try {
  execSync('pkill -f "node api-server.js"', { stdio: 'inherit' });
} catch (error) {
  console.log('No API server process found to kill.');
}

try {
  execSync('pkill -f "vite"', { stdio: 'inherit' });
} catch (error) {
  console.log('No Vite process found to kill.');
}

console.log('Starting the application...');
execSync('npm run dev:all', { stdio: 'inherit' });
