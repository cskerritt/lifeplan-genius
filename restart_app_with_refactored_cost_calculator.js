const { exec } = require('child_process');

console.log('Restarting the application with refactored cost calculator...');

// Command to restart the application
const command = 'npm run dev';

// Execute the command
const childProcess = exec(command);

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
    console.log('Application restarted successfully.');
  } else {
    console.error(`Application restart failed with code ${code}.`);
  }
});

// Handle process error
childProcess.on('error', (error) => {
  console.error(`Error restarting application: ${error.message}`);
});
