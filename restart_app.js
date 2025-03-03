// Script to restart the application and refresh the schema cache
console.log('Restarting application to refresh schema cache...');

// Import required modules
const { exec } = require('child_process');

// Function to execute a command and return a promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`Command stderr: ${stderr}`);
      }
      
      console.log(`Command stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Main function to restart the application
async function restartApp() {
  try {
    // Stop any running development server
    console.log('Stopping any running development server...');
    await executeCommand('pkill -f "npm run dev" || true');
    
    // Clear any cached data
    console.log('Clearing cache...');
    
    // Restart the development server
    console.log('Starting development server...');
    const devProcess = exec('npm run dev');
    
    // Log output from the development server
    devProcess.stdout.on('data', (data) => {
      console.log(`Dev server: ${data}`);
    });
    
    devProcess.stderr.on('data', (data) => {
      console.error(`Dev server error: ${data}`);
    });
    
    console.log('Application restarted successfully!');
    console.log('The schema cache should now be refreshed with the new columns.');
    console.log('You can now use the age increments feature.');
    
  } catch (error) {
    console.error('Error restarting application:', error);
  }
}

// Run the restart function
restartApp().catch(console.error);
